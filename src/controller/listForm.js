const dbPool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllListForms = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM list_form');
            return successResponse(res, "Data list form berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getListFormById = (req, res) => {
    const { id } = req.params;

    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM list_form WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `List form dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data list form berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil list form ID ${id}`
    );
};

const createListForm = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['name', 'issue', 'rev', 'code', 'status'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Field name, issue, rev, code, dan status wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO list_form (name, issue, rev, code, status) VALUES ?'
                : 'INSERT INTO list_form (name, issue, rev, code, status) VALUES (?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.name, item.issue, item.rev, item.code, item.status])]
                : [data.name, data.issue, data.rev, data.code, data.status];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} list form baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateListForm = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item => {
                const fields = Object.keys(item).filter(key => key !== 'id');
                const setClause = fields.map(field => `${field} = ?`).join(', ');
                const values = fields.map(field => item[field]);
                values.push(parseInt(item.id, 10));
                return connection.execute(`UPDATE list_form SET ${setClause} WHERE id = ?`, values);
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data list form berhasil diperbarui`, data);
        }

        const fields = Object.keys(data).filter(key => key !== 'id');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => data[field]);
                values.push(parseInt(data.id, 10));

        const [result] = await connection.execute(`UPDATE list_form SET ${setClause} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `List form dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `List form dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteListForm = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

        const intIds = ids.map(id => parseInt(id, 10));

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM list_form WHERE id IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data list form berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllListForms,
    getListFormById,
    createListForm,
    updateListForm,
    deleteListForm
};