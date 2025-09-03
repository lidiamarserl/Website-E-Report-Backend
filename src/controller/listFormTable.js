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

const getAllListFormTables = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query(`
                    SELECT lft.*, lf.name as list_form_name, lt.name as list_table_name 
                    FROM list_form_table lft 
                    LEFT JOIN list_form lf ON lft.id_list_form = lf.id
                    LEFT JOIN list_table lt ON lft.id_list_table = lt.id
                `);
            return successResponse(res, "Data list form table berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getListFormTableById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute(`
                SELECT lft.*, lf.name as list_form_name, lt.name as list_table_name
                FROM list_form_table lft
                LEFT JOIN list_form lf ON lft.id_list_form = lf.id
                LEFT JOIN list_table lt ON lft.id_list_table = lt.id
                WHERE lft.id = ?
            `, [id]);
            if (data.length === 0) {    
                return errorResponse(res, `List form table dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data list form table berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil list form table ID ${id}`
    );
};

const createListFormTable = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_form', 'id_list_table'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Field id_list_form dan id_list_table wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO list_form_table (id_list_form, id_list_table) VALUES ?'
                : 'INSERT INTO list_form_table (id_list_form, id_list_table) VALUES (?, ?)';

            const values = isArray
                ? [data.map(item => [parseInt(item.id_list_form, 10), parseInt(item.id_list_table, 10)])]
                : [[parseInt(data.id_list_form, 10), parseInt(data.id_list_table, 10)]];

            await dbPool.query(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} list form table baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateListFormTable = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);
        if ((isArray && (data.length === 0 || data.some(item => !item.id_list_form || !item.id_list_table))) ||
            (!isArray && (!data.id_list_form || !data.id_list_table))) {
            throw new Error("Invalid input data");
        }
        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute('UPDATE list_form_table SET id_list_table = ? WHERE id_list_form = ?',
                    [parseInt(item.id_list_table, 10), parseInt(item.id_list_form, 10)])
            ));
        } else {
            const [result] = await connection.execute('UPDATE list_form_table SET id_list_table = ? WHERE id_list_form = ?',
                [parseInt(data.id_list_table, 10), parseInt(data.id_list_form, 10)]);
            if (result.affectedRows === 0) { throw new Error("Not found"); }
        }
        await connection.commit();
        return successResponse(res, `List form table berhasil diperbarui`, data);
    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `List form table tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteListFormTable = async (req, res) => {
    const { id_list_forms } = req.body;

    if (!Array.isArray(id_list_forms) || id_list_forms.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'id_list_forms' dalam bentuk array dan tidak boleh kosong", null, 400);
    }
    const intIds = id_list_forms.map(id => parseInt(id, 10));


    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM list_form_table WHERE id_list_form IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data list form table berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllListFormTables,
    getListFormTableById,
    createListFormTable,
    updateListFormTable,
    deleteListFormTable
};