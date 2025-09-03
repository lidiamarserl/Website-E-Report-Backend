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

const getAllListReports = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query(`
                SELECT lr.*, d.name as department_name 
                FROM list_report lr 
                LEFT JOIN department d ON lr.department = d.id
            `);
            return successResponse(res, "Data list report berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getListReportById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute(`
                SELECT lr.*, d.name as department_name
                FROM list_report lr
                LEFT JOIN department d ON lr.department = d.id
                WHERE lr.id = ?
            `, [id]);
            if (data.length === 0) {
                return errorResponse(res, `List report dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data list report berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil list report ID ${id}`
    );
};

const createListReport = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['name', 'department'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Field name dan department wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO list_report (name, department) VALUES ?'
                : 'INSERT INTO list_report (name, department) VALUES (?, ?)';

            const values = isArray
                ? [data.map(item => [item.name, parseInt(item.department, 10)])]
                : [[data.name, parseInt(data.department, 10)]];

            await dbPool.query(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} list report baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateListReport = async (req, res) => {
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
                if (item.department) { item.department = parseInt(item.department, 10); }

                const fields = Object.keys(item).filter(key => key !== 'id');
                const setClause = fields.map(field => `${field} = ?`).join(', ');
                const values = fields.map(field => item[field]);
                values.push(parseInt(item.id, 10));
                return connection.execute(`UPDATE list_report SET ${setClause} WHERE id = ?`, values);
            }));
        } else {
            if (data.department) { data.department = parseInt(data.department, 10); }
            const fields = Object.keys(data).filter(key => key !== 'id');
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => data[field]);
            values.push(parseInt(data.id, 10));
            const [result] = await connection.execute(`UPDATE list_report SET ${setClause} WHERE id = ?`, values);
            if (result.affectedRows === 0) { throw new Error("Not found"); }
        }
        await connection.commit();
        return successResponse(res, `Data list report berhasil diperbarui`, data);
    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `List report dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteListReport = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    const intIds = ids.map(id => parseInt(id, 10));

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM list_report WHERE id IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data list report berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllListReports,
    getListReportById,
    createListReport,
    updateListReport,
    deleteListReport
};