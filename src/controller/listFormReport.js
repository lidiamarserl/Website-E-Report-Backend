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

const getAllListFormReports = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query(`
                    SELECT lfr.*, lf.name as list_form_name, lr.name as list_report_name 
                    FROM list_form_report lfr 
                    LEFT JOIN list_form lf ON lfr.id_list_form = lf.id
                    LEFT JOIN list_report lr ON lfr.id_list_report = lr.id
                `);
            return successResponse(res, "Data list form report berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getListFormReportById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute(`
                SELECT lfr.*, lf.name as list_form_name, lr.name as list_report_name
                FROM list_form_report lfr
                LEFT JOIN list_form lf ON lfr.id_list_form = lf.id
                LEFT JOIN list_report lr ON lfr.id_list_report = lr.id
                WHERE lfr.id = ?
            `, [id]);
            if (data.length === 0) {
                return errorResponse(res, `List form report dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data list form report berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil list form report ID ${id}`
    );
};

const createListFormReport = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_form', 'id_list_report'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Field id_list_form dan id_list_report wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO list_form_report (id_list_form, id_list_report) VALUES ?'
                : 'INSERT INTO list_form_report (id_list_form, id_list_report) VALUES (?, ?)';

            const values = isArray
                ? [data.map(item => [parseInt(item.id_list_form, 10), parseInt(item.id_list_report, 10)])]
                : [[parseInt(data.id_list_form, 10), parseInt(data.id_list_report, 10)]];
            await dbPool.query(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} list form report baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateListFormReport = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id_list_form || !item.id_list_report))) ||
            (!isArray && (!data.id_list_form || !data.id_list_report))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute('UPDATE list_form_report SET id_list_report = ? WHERE id_list_form = ?',
                    [parseInt(item.id_list_report, 10), parseInt(item.id_list_form, 10)])
            ));
        } else {
            const [result] = await connection.execute('UPDATE list_form_report SET id_list_report = ? WHERE id_list_form = ?',
                [parseInt(data.id_list_report, 10), parseInt(data.id_list_form, 10)]);
            if (result.affectedRows === 0) { throw new Error("Not found"); }
        }
        await connection.commit();
        return successResponse(res, `Data list form report berhasil diperbarui`, data);
    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `List form report tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteListFormReport = async (req, res) => {
    const { id_list_forms } = req.body;

    if (!Array.isArray(id_list_forms) || id_list_forms.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'id_list_forms' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    const intIds = id_list_forms.map(id => parseInt(id, 10));


    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM list_form_report WHERE id_list_form IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data list form report berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllListFormReports,
    getListFormReportById,
    createListFormReport,
    updateListFormReport,
    deleteListFormReport
};