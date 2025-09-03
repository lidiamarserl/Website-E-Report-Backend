const dbPool = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllProcessTime = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_process_time');
            return successResponse(res, "Data process time berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getProcessTimeById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_process_time WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Process time dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data process time berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil process time ID ${id}`
    );
};

const createProcessTime = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'time_start1', 'time_end1', 'time_start2', 'time_end2'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_process_time (id_list_table, id_form, time_start1, time_end1, time_start2, time_end2) VALUES ?'
                : 'INSERT INTO table_process_time (id_list_table, id_form, time_start1, time_end1, time_start2, time_end2) VALUES (?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.time_start1, item.time_end1, item.time_start2, item.time_end2])]
                : [data.id_list_table, data.id_form, data.time_start1, data.time_end1, data.time_start2, data.time_end2];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data process time berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateProcessTime = async (req, res) => {
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
                const fields = [];
                const values = [];

                if (item.id_list_table) { fields.push('id_list_table = ?'); values.push(item.id_list_table); }
                if (item.id_form) { fields.push('id_form = ?'); values.push(item.id_form); }
                if (item.time_start1) { fields.push('time_start1 = ?'); values.push(item.time_start1); }
                if (item.time_end1) { fields.push('time_end1 = ?'); values.push(item.time_end1); }
                if (item.time_start2) { fields.push('time_start2 = ?'); values.push(item.time_start2); }
                if (item.time_end2) { fields.push('time_end2 = ?'); values.push(item.time_end2); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_process_time SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data process time berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.time_start1) { fields.push('time_start1 = ?'); values.push(data.time_start1); }
        if (data.time_end1) { fields.push('time_end1 = ?'); values.push(data.time_end1); }
        if (data.time_start2) { fields.push('time_start2 = ?'); values.push(data.time_start2); }
        if (data.time_end2) { fields.push('time_end2 = ?'); values.push(data.time_end2); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_process_time SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data process time dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data process time dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteProcessTime = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_process_time WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data process time berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllProcessTime,
    getProcessTimeById,
    createProcessTime,
    updateProcessTime,
    deleteProcessTime
};