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

const getAllFilterButterLokal = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_process_filter_butter_lokal');
            return successResponse(res, "Data filter butter lokal berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getFilterButterLokalById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_process_filter_butter_lokal WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Filter butter lokal dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data filter butter lokal berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil filter butter lokal ID ${id}`
    );
};

const createFilterButterLokal = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'line1', 'line2', 'no_machine', 'product_type', 'process_start', 'process_end', 'canvas_replacement', 'cleaning_filter_butter', 'flow_filter_capacity', 'visual_check', 'pressure_filter', 'polishing_filter', 'polishing_step', 'polishing_size', 'polishing_pressure', 'polishing_change', 'description'];

    if ((isArray && data.some(item => requiredFields.some(field => item[field] === undefined || item[field] === null))) ||
        (!isArray && requiredFields.some(field => data[field] === undefined || data[field] === null))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_process_filter_butter_lokal (id_list_table, id_form, line1, line2, no_machine, product_type, process_start, process_end, canvas_replacement, cleaning_filter_butter, flow_filter_capacity, visual_check, pressure_filter, polishing_filter, polishing_step, polishing_size, polishing_pressure, polishing_change, description) VALUES ?'
                : 'INSERT INTO table_process_filter_butter_lokal (id_list_table, id_form, line1, line2, no_machine, product_type, process_start, process_end, canvas_replacement, cleaning_filter_butter, flow_filter_capacity, visual_check, pressure_filter, polishing_filter, polishing_step, polishing_size, polishing_pressure, polishing_change, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.line1, item.line2, item.no_machine, item.product_type, item.process_start, item.process_end, item.canvas_replacement, item.cleaning_filter_butter, item.flow_filter_capacity, item.visual_check, item.pressure_filter, item.polishing_filter, item.polishing_step, item.polishing_size, item.polishing_pressure, item.polishing_change, item.description])]
                : [data.id_list_table, data.id_form, data.line1, data.line2, data.no_machine, data.product_type, data.process_start, data.process_end, data.canvas_replacement, data.cleaning_filter_butter, data.flow_filter_capacity, data.visual_check, data.pressure_filter, data.polishing_filter, data.polishing_step, data.polishing_size, data.polishing_pressure, data.polishing_change, data.description];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data filter butter lokal berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateFilterButterLokal = async (req, res) => {
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

                if (item.id_list_table !== undefined) { fields.push('id_list_table = ?'); values.push(item.id_list_table); }
                if (item.id_form !== undefined) { fields.push('id_form = ?'); values.push(item.id_form); }
                if (item.line1 !== undefined) { fields.push('line1 = ?'); values.push(item.line1); }
                if (item.line2 !== undefined) { fields.push('line2 = ?'); values.push(item.line2); }
                if (item.no_machine !== undefined) { fields.push('no_machine = ?'); values.push(item.no_machine); }
                if (item.product_type !== undefined) { fields.push('product_type = ?'); values.push(item.product_type); }
                if (item.process_start !== undefined) { fields.push('process_start = ?'); values.push(item.process_start); }
                if (item.process_end !== undefined) { fields.push('process_end = ?'); values.push(item.process_end); }
                if (item.canvas_replacement !== undefined) { fields.push('canvas_replacement = ?'); values.push(item.canvas_replacement); }
                if (item.cleaning_filter_butter !== undefined) { fields.push('cleaning_filter_butter = ?'); values.push(item.cleaning_filter_butter); }
                if (item.flow_filter_capacity !== undefined) { fields.push('flow_filter_capacity = ?'); values.push(item.flow_filter_capacity); }
                if (item.visual_check !== undefined) { fields.push('visual_check = ?'); values.push(item.visual_check); }
                if (item.pressure_filter !== undefined) { fields.push('pressure_filter = ?'); values.push(item.pressure_filter); }
                if (item.polishing_filter !== undefined) { fields.push('polishing_filter = ?'); values.push(item.polishing_filter); }
                if (item.polishing_step !== undefined) { fields.push('polishing_step = ?'); values.push(item.polishing_step); }
                if (item.polishing_size !== undefined) { fields.push('polishing_size = ?'); values.push(item.polishing_size); }
                if (item.polishing_pressure !== undefined) { fields.push('polishing_pressure = ?'); values.push(item.polishing_pressure); }
                if (item.polishing_change !== undefined) { fields.push('polishing_change = ?'); values.push(item.polishing_change); }
                if (item.description !== undefined) { fields.push('description = ?'); values.push(item.description); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_process_filter_butter_lokal SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data filter butter lokal berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table !== undefined) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form !== undefined) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.line1 !== undefined) { fields.push('line1 = ?'); values.push(data.line1); }
        if (data.line2 !== undefined) { fields.push('line2 = ?'); values.push(data.line2); }
        if (data.no_machine !== undefined) { fields.push('no_machine = ?'); values.push(data.no_machine); }
        if (data.product_type !== undefined) { fields.push('product_type = ?'); values.push(data.product_type); }
        if (data.process_start !== undefined) { fields.push('process_start = ?'); values.push(data.process_start); }
        if (data.process_end !== undefined) { fields.push('process_end = ?'); values.push(data.process_end); }
        if (data.canvas_replacement !== undefined) { fields.push('canvas_replacement = ?'); values.push(data.canvas_replacement); }
        if (data.cleaning_filter_butter !== undefined) { fields.push('cleaning_filter_butter = ?'); values.push(data.cleaning_filter_butter); }
        if (data.flow_filter_capacity !== undefined) { fields.push('flow_filter_capacity = ?'); values.push(data.flow_filter_capacity); }
        if (data.visual_check !== undefined) { fields.push('visual_check = ?'); values.push(data.visual_check); }
        if (data.pressure_filter !== undefined) { fields.push('pressure_filter = ?'); values.push(data.pressure_filter); }
        if (data.polishing_filter !== undefined) { fields.push('polishing_filter = ?'); values.push(data.polishing_filter); }
        if (data.polishing_step !== undefined) { fields.push('polishing_step = ?'); values.push(data.polishing_step); }
        if (data.polishing_size !== undefined) { fields.push('polishing_size = ?'); values.push(data.polishing_size); }
        if (data.polishing_pressure !== undefined) { fields.push('polishing_pressure = ?'); values.push(data.polishing_pressure); }
        if (data.polishing_change !== undefined) { fields.push('polishing_change = ?'); values.push(data.polishing_change); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_process_filter_butter_lokal SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data filter butter lokal dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data filter butter lokal dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteFilterButterLokal = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_process_filter_butter_lokal WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data filter butter lokal berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllFilterButterLokal,
    getFilterButterLokalById,
    createFilterButterLokal,
    updateFilterButterLokal,
    deleteFilterButterLokal
};