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

const getAllStartupChecklistOperasional = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_startup_checklist_operasional');
            return successResponse(res, "Data startup checklist operasional berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getStartupChecklistOperasionalById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_startup_checklist_operasional WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Startup checklist operasional dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data startup checklist operasional berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil startup checklist operasional ID ${id}`
    );
};

const createStartupChecklistOperasional = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'periode', 'operator', 'time', 'sens', 'product_angle', 'reject_start', 'reject_end', 'reject_total'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_startup_checklist_operasional (id_list_table, id_form, code, periode, operator, time, sens, product_angle, detected_fe, detected_non_fe, detected_ss, reject_start, reject_end, reject_total, remark) VALUES ?'
                : 'INSERT INTO table_startup_checklist_operasional (id_list_table, id_form, code, periode, operator, time, sens, product_angle, detected_fe, detected_non_fe, detected_ss, reject_start, reject_end, reject_total, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.periode, item.operator, item.time, item.sens, item.product_angle, item.detected_fe || null, item.detected_non_fe || null, item.detected_ss || null, item.reject_start, item.reject_end, item.reject_total, item.remark || null])]
                : [data.id_list_table, data.id_form, data.code, data.periode, data.operator, data.time, data.sens, data.product_angle, data.detected_fe || null, data.detected_non_fe || null, data.detected_ss || null, data.reject_start, data.reject_end, data.reject_total, data.remark || null];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data startup checklist operasional berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateStartupChecklistOperasional = async (req, res) => {
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
                if (item.code) { fields.push('code = ?'); values.push(item.code); }
                if (item.periode) { fields.push('periode = ?'); values.push(item.periode); }
                if (item.operator) { fields.push('operator = ?'); values.push(item.operator); }
                if (item.time) { fields.push('time = ?'); values.push(item.time); }
                if (item.sens) { fields.push('sens = ?'); values.push(item.sens); }
                if (item.product_angle) { fields.push('product_angle = ?'); values.push(item.product_angle); }
                if (item.detected_fe !== undefined) { fields.push('detected_fe = ?'); values.push(item.detected_fe); }
                if (item.detected_non_fe !== undefined) { fields.push('detected_non_fe = ?'); values.push(item.detected_non_fe); }
                if (item.detected_ss !== undefined) { fields.push('detected_ss = ?'); values.push(item.detected_ss); }
                if (item.reject_start) { fields.push('reject_start = ?'); values.push(item.reject_start); }
                if (item.reject_end) { fields.push('reject_end = ?'); values.push(item.reject_end); }
                if (item.reject_total) { fields.push('reject_total = ?'); values.push(item.reject_total); }
                if (item.remark !== undefined) { fields.push('remark = ?'); values.push(item.remark); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_startup_checklist_operasional SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data startup checklist operasional berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.periode) { fields.push('periode = ?'); values.push(data.periode); }
        if (data.operator) { fields.push('operator = ?'); values.push(data.operator); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }
        if (data.sens) { fields.push('sens = ?'); values.push(data.sens); }
        if (data.product_angle) { fields.push('product_angle = ?'); values.push(data.product_angle); }
        if (data.detected_fe !== undefined) { fields.push('detected_fe = ?'); values.push(data.detected_fe); }
        if (data.detected_non_fe !== undefined) { fields.push('detected_non_fe = ?'); values.push(data.detected_non_fe); }
        if (data.detected_ss !== undefined) { fields.push('detected_ss = ?'); values.push(data.detected_ss); }
        if (data.reject_start) { fields.push('reject_start = ?'); values.push(data.reject_start); }
        if (data.reject_end) { fields.push('reject_end = ?'); values.push(data.reject_end); }
        if (data.reject_total) { fields.push('reject_total = ?'); values.push(data.reject_total); }
        if (data.remark !== undefined) { fields.push('remark = ?'); values.push(data.remark); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_startup_checklist_operasional SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data startup checklist operasional dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data startup checklist operasional dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteStartupChecklistOperasional = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_startup_checklist_operasional WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data startup checklist operasional berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllStartupChecklistOperasional,
    getStartupChecklistOperasionalById,
    createStartupChecklistOperasional,
    updateStartupChecklistOperasional,
    deleteStartupChecklistOperasional
};