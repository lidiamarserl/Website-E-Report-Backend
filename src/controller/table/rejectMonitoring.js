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

const getAllRejectMonitoring = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_reject_monitoring');
            return successResponse(res, "Data reject monitoring berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getRejectMonitoringById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_reject_monitoring WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Reject monitoring dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data reject monitoring berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil reject monitoring ID ${id}`
    );
};

const createRejectMonitoring = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'no_code', 'shift', 'quantity_reject', 'counting_start', 'counting_end', 'total_counting', 'time'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_reject_monitoring (id_list_table, id_form, no_code, shift, quantity_reject, counting_start, counting_end, total_counting, time) VALUES ?'
                : 'INSERT INTO table_reject_monitoring (id_list_table, id_form, no_code, shift, quantity_reject, counting_start, counting_end, total_counting, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.no_code, item.shift, item.quantity_reject, item.counting_start, item.counting_end, item.total_counting, item.time])]
                : [data.id_list_table, data.id_form, data.no_code, data.shift, data.quantity_reject, data.counting_start, data.counting_end, data.total_counting, data.time];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data reject monitoring berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateRejectMonitoring = async (req, res) => {
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
                if (item.no_code) { fields.push('no_code = ?'); values.push(item.no_code); }
                if (item.shift) { fields.push('shift = ?'); values.push(item.shift); }
                if (item.quantity_reject !== undefined) { fields.push('quantity_reject = ?'); values.push(item.quantity_reject); }
                if (item.counting_start !== undefined) { fields.push('counting_start = ?'); values.push(item.counting_start); }
                if (item.counting_end !== undefined) { fields.push('counting_end = ?'); values.push(item.counting_end); }
                if (item.total_counting !== undefined) { fields.push('total_counting = ?'); values.push(item.total_counting); }
                if (item.time) { fields.push('time = ?'); values.push(item.time); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_reject_monitoring SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data reject monitoring berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.no_code) { fields.push('no_code = ?'); values.push(data.no_code); }
        if (data.shift) { fields.push('shift = ?'); values.push(data.shift); }
        if (data.quantity_reject !== undefined) { fields.push('quantity_reject = ?'); values.push(data.quantity_reject); }
        if (data.counting_start !== undefined) { fields.push('counting_start = ?'); values.push(data.counting_start); }
        if (data.counting_end !== undefined) { fields.push('counting_end = ?'); values.push(data.counting_end); }
        if (data.total_counting !== undefined) { fields.push('total_counting = ?'); values.push(data.total_counting); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_reject_monitoring SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data reject monitoring dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data reject monitoring dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteRejectMonitoring = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_reject_monitoring WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data reject monitoring berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllRejectMonitoring,
    getRejectMonitoringById,
    createRejectMonitoring,
    updateRejectMonitoring,
    deleteRejectMonitoring
};