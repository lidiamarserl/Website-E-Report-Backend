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

const getAllWinnowingOutputReport2 = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_winnowing_output_report2');
            return successResponse(res, "Data winnowing output report2 berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getWinnowingOutputReport2ById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_winnowing_output_report2 WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Winnowing output report2 dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data winnowing output report2 berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil winnowing output report2 ID ${id}`
    );
};

const createWinnowingOutputReport2 = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'process_start1', 'process_end1', 'process_start2', 'process_end2', 'process_start3', 'process_end3', 'wip_start', 'wip_end'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_winnowing_output_report2 (id_list_table, id_form, process_start1, process_end1, process_start2, process_end2, process_start3, process_end3, wip_start, wip_end) VALUES ?'
                : 'INSERT INTO table_winnowing_output_report2 (id_list_table, id_form, process_start1, process_end1, process_start2, process_end2, process_start3, process_end3, wip_start, wip_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.process_start1, item.process_end1, item.process_start2, item.process_end2, item.process_start3, item.process_end3, item.wip_start, item.wip_end])]
                : [data.id_list_table, data.id_form, data.process_start1, data.process_end1, data.process_start2, data.process_end2, data.process_start3, data.process_end3, data.wip_start, data.wip_end];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data winnowing output report2 berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateWinnowingOutputReport2 = async (req, res) => {
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
                if (item.process_start1) { fields.push('process_start1 = ?'); values.push(item.process_start1); }
                if (item.process_end1) { fields.push('process_end1 = ?'); values.push(item.process_end1); }
                if (item.process_start2) { fields.push('process_start2 = ?'); values.push(item.process_start2); }
                if (item.process_end2) { fields.push('process_end2 = ?'); values.push(item.process_end2); }
                if (item.process_start3) { fields.push('process_start3 = ?'); values.push(item.process_start3); }
                if (item.process_end3) { fields.push('process_end3 = ?'); values.push(item.process_end3); }
                if (item.wip_start) { fields.push('wip_start = ?'); values.push(item.wip_start); }
                if (item.wip_end) { fields.push('wip_end = ?'); values.push(item.wip_end); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_winnowing_output_report2 SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data winnowing output report2 berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.process_start1) { fields.push('process_start1 = ?'); values.push(data.process_start1); }
        if (data.process_end1) { fields.push('process_end1 = ?'); values.push(data.process_end1); }
        if (data.process_start2) { fields.push('process_start2 = ?'); values.push(data.process_start2); }
        if (data.process_end2) { fields.push('process_end2 = ?'); values.push(data.process_end2); }
        if (data.process_start3) { fields.push('process_start3 = ?'); values.push(data.process_start3); }
        if (data.process_end3) { fields.push('process_end3 = ?'); values.push(data.process_end3); }
        if (data.wip_start) { fields.push('wip_start = ?'); values.push(data.wip_start); }
        if (data.wip_end) { fields.push('wip_end = ?'); values.push(data.wip_end); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_winnowing_output_report2 SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data winnowing output report2 dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data winnowing output report2 dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteWinnowingOutputReport2 = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_winnowing_output_report2 WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data winnowing output report2 berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};
module.exports = {
    getAllWinnowingOutputReport2,
    getWinnowingOutputReport2ById,
    createWinnowingOutputReport2,
    updateWinnowingOutputReport2,
    deleteWinnowingOutputReport2
};