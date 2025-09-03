const dbPool = require('../config/database');
const {successResponse, errorResponse} = require('../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllReports = (req, res) => 
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM report');
            return successResponse(res, "Data report berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getReportById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM report WHERE id = ?',
                [id]);
            if (data.length === 0) {
                return errorResponse(res, `Report dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data report berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil report ID ${id}`
    );
};

const createReport = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);
    
    if ((isArray && data.some(item => !item.id_list_report || !item.date_created || !item.date_modified || !item.created_by)) || 
        (!isArray && (!data.id_list_report || !data.date_created || !data.date_modified || !data.created_by))) {
        return errorResponse(res, "Bad Request: Properti 'id_list_report' dan 'tanggal' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray 
                ? 'INSERT INTO report (id_list_report, date_created, date_modified, created_by) VALUES ?'
                : 'INSERT INTO report (id_list_report, date_created, date_modified, created_by) VALUES (?, ?, ?, ?)';
            const values = isArray 
                ? [data.map(item => [parseInt(item.id_list_report, 10), item.date_created, item.date_modified, parseInt(item.created_by, 10)])] 
                : [parseInt(data.id_list_report, 10), data.date_created, data.date_modified, parseInt(data.created_by, 10)];
            
            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} report baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateReport = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id || !item.id_list_report || !item.date_created || item.date_modified || item.created_by))) ||
            (!isArray && (!data.id || !data.id_list_report || !data.date_created || data.date_modified || data.created_by))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item => 
                connection.execute('UPDATE report SET id_list_report = ?, date_created = ?, date_modified = ?, created_by = ? WHERE id = ?', 
                    [parseInt(item.id_list_report, 10), item.date_created, item.date_modified, parseInt(item.created_by, 10), parseInt(item.id, 10)])
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data report berhasil diperbarui`, data);
        }

        const [result] = await connection.execute('UPDATE report SET id_list_report = ?, date_created = ?, date_modified = ?, created_by = ? WHERE id = ?', 
                [parseInt(data.id_list_report, 10), data.date_created, data.date_modified, parseInt(data.created_by, 10), parseInt(data.id, 10)]);
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Report dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found" 
            ? `Report dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteReport = async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    const intIds = ids.map(id => parseInt(id, 10));

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM report WHERE id IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data report berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};


module.exports = {
    getAllReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
}