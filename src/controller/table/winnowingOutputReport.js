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

const getAllWinnowingOutputReport = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_winnowing_output_report');
            return successResponse(res, "Data winnowing output report berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getWinnowingOutputReportById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_winnowing_output_report WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Winnowing output report dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data winnowing output report berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil winnowing output report ID ${id}`
    );
};

const createWinnowingOutputReport = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'parameter', 'standard', 'uom', 'result', 'capacity', 'suction_before', 'suction_after', 'gap_before', 'gap_after'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_winnowing_output_report (id_list_table, id_form, parameter, standard, uom, result, capacity, suction_before, suction_after, gap_before, gap_after) VALUES ?'
                : 'INSERT INTO table_winnowing_output_report (id_list_table, id_form, parameter, standard, uom, result, capacity, suction_before, suction_after, gap_before, gap_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.parameter, item.standard, item.uom, item.result, item.capacity, item.suction_before, item.suction_after, item.gap_before, item.gap_after])]
                : [data.id_list_table, data.id_form, data.parameter, data.standard, data.uom, data.result, data.capacity, data.suction_before, data.suction_after, data.gap_before, data.gap_after];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data winnowing output report berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateWinnowingOutputReport = async (req, res) => {
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
                if (item.parameter) { fields.push('parameter = ?'); values.push(item.parameter); }
                if (item.standard) { fields.push('standard = ?'); values.push(item.standard); }
                if (item.uom) { fields.push('uom = ?'); values.push(item.uom); }
                if (item.result) { fields.push('result = ?'); values.push(item.result); }
                if (item.capacity) { fields.push('capacity = ?'); values.push(item.capacity); }
                if (item.suction_before) { fields.push('suction_before = ?'); values.push(item.suction_before); }
                if (item.suction_after) { fields.push('suction_after = ?'); values.push(item.suction_after); }
                if (item.gap_before) { fields.push('gap_before = ?'); values.push(item.gap_before); }
                if (item.gap_after) { fields.push('gap_after = ?'); values.push(item.gap_after); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_winnowing_output_report SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data winnowing output report berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.parameter) { fields.push('parameter = ?'); values.push(data.parameter); }
        if (data.standard) { fields.push('standard = ?'); values.push(data.standard); }
        if (data.uom) { fields.push('uom = ?'); values.push(data.uom); }
        if (data.result) { fields.push('result = ?'); values.push(data.result); }
        if (data.capacity) { fields.push('capacity = ?'); values.push(data.capacity); }
        if (data.suction_before) { fields.push('suction_before = ?'); values.push(data.suction_before); }
        if (data.suction_after) { fields.push('suction_after = ?'); values.push(data.suction_after); }
        if (data.gap_before) { fields.push('gap_before = ?'); values.push(data.gap_before); }
        if (data.gap_after) { fields.push('gap_after = ?'); values.push(data.gap_after); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_winnowing_output_report SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data winnowing output report dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data winnowing output report dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteWinnowingOutputReport = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_winnowing_output_report WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data winnowing output report berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllWinnowingOutputReport,
    getWinnowingOutputReportById,
    createWinnowingOutputReport,
    updateWinnowingOutputReport,
    deleteWinnowingOutputReport
};