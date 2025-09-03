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

const getAllTemperingAasted = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_tempering_aasted');
            return successResponse(res, "Data tempering aasted berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getTemperingAastedById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_tempering_aasted WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Tempering Aasted dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data tempering aasted berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil tempering aasted ID ${id}`
    );
};

const createTemperingAasted = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'product_type', 'batch_code', 'time', 'packing_code', 'no_tank', 'temperature_before', 'pressure_before', 'process_pump_capacity', 'process_pre_treat', 'process_zone1', 'process_zone2', 'process_zone3', 'process_water_jacket', 'process_water_internal', 'chiller_in_degree', 'chiller_out_degree', 'chiller_in_bar', 'chiller_out_bar'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_tempering_aasted (id_list_table, id_form, product_type, batch_code, time, packing_code, no_tank, temperature_before, pressure_before, process_pump_capacity, process_pre_treat, process_zone1, process_zone2, process_zone3, process_water_jacket, process_water_internal, chiller_in_degree, chiller_out_degree, chiller_in_bar, chiller_out_bar) VALUES ?'
                : 'INSERT INTO table_tempering_aasted (id_list_table, id_form, product_type, batch_code, time, packing_code, no_tank, temperature_before, pressure_before, process_pump_capacity, process_pre_treat, process_zone1, process_zone2, process_zone3, process_water_jacket, process_water_internal, chiller_in_degree, chiller_out_degree, chiller_in_bar, chiller_out_bar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.product_type, item.batch_code, item.time, item.packing_code, item.no_tank, item.temperature_before, item.pressure_before, item.process_pump_capacity, item.process_pre_treat, item.process_zone1, item.process_zone2, item.process_zone3, item.process_water_jacket, item.process_water_internal, item.chiller_in_degree, item.chiller_out_degree, item.chiller_in_bar, item.chiller_out_bar])]
                : [data.id_list_table, data.id_form, data.product_type, data.batch_code, data.time, data.packing_code, data.no_tank, data.temperature_before, data.pressure_before, data.process_pump_capacity, data.process_pre_treat, data.process_zone1, data.process_zone2, data.process_zone3, data.process_water_jacket, data.process_water_internal, data.chiller_in_degree, data.chiller_out_degree, data.chiller_in_bar, data.chiller_out_bar];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data tempering aasted berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateTemperingAasted = async (req, res) => {
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
                if (item.product_type) { fields.push('product_type = ?'); values.push(item.product_type); }
                if (item.batch_code) { fields.push('batch_code = ?'); values.push(item.batch_code); }
                if (item.time) { fields.push('time = ?'); values.push(item.time); }
                if (item.packing_code) { fields.push('packing_code = ?'); values.push(item.packing_code); }
                if (item.no_tank) { fields.push('no_tank = ?'); values.push(item.no_tank); }
                if (item.temperature_before) { fields.push('temperature_before = ?'); values.push(item.temperature_before); }
                if (item.pressure_before) { fields.push('pressure_before = ?'); values.push(item.pressure_before); }
                if (item.process_pump_capacity) { fields.push('process_pump_capacity = ?'); values.push(item.process_pump_capacity); }
                if (item.process_pre_treat) { fields.push('process_pre_treat = ?'); values.push(item.process_pre_treat); }
                if (item.process_zone1) { fields.push('process_zone1 = ?'); values.push(item.process_zone1); }
                if (item.process_zone2) { fields.push('process_zone2 = ?'); values.push(item.process_zone2); }
                if (item.process_zone3) { fields.push('process_zone3 = ?'); values.push(item.process_zone3); }
                if (item.process_water_jacket) { fields.push('process_water_jacket = ?'); values.push(item.process_water_jacket); }
                if (item.process_water_internal) { fields.push('process_water_internal = ?'); values.push(item.process_water_internal); }
                if (item.chiller_in_degree) { fields.push('chiller_in_degree = ?'); values.push(item.chiller_in_degree); }
                if (item.chiller_out_degree) { fields.push('chiller_out_degree = ?'); values.push(item.chiller_out_degree); }
                if (item.chiller_in_bar) { fields.push('chiller_in_bar = ?'); values.push(item.chiller_in_bar); }
                if (item.chiller_out_bar) { fields.push('chiller_out_bar = ?'); values.push(item.chiller_out_bar); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_tempering_aasted SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data tempering aasted berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.product_type) { fields.push('product_type = ?'); values.push(data.product_type); }
        if (data.batch_code) { fields.push('batch_code = ?'); values.push(data.batch_code); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }
        if (data.packing_code) { fields.push('packing_code = ?'); values.push(data.packing_code); }
        if (data.no_tank) { fields.push('no_tank = ?'); values.push(data.no_tank); }
        if (data.temperature_before) { fields.push('temperature_before = ?'); values.push(data.temperature_before); }
        if (data.pressure_before) { fields.push('pressure_before = ?'); values.push(data.pressure_before); }
        if (data.process_pump_capacity) { fields.push('process_pump_capacity = ?'); values.push(data.process_pump_capacity); }
        if (data.process_pre_treat) { fields.push('process_pre_treat = ?'); values.push(data.process_pre_treat); }
        if (data.process_zone1) { fields.push('process_zone1 = ?'); values.push(data.process_zone1); }
        if (data.process_zone2) { fields.push('process_zone2 = ?'); values.push(data.process_zone2); }
        if (data.process_zone3) { fields.push('process_zone3 = ?'); values.push(data.process_zone3); }
        if (data.process_water_jacket) { fields.push('process_water_jacket = ?'); values.push(data.process_water_jacket); }
        if (data.process_water_internal) { fields.push('process_water_internal = ?'); values.push(data.process_water_internal); }
        if (data.chiller_in_degree) { fields.push('chiller_in_degree = ?'); values.push(data.chiller_in_degree); }
        if (data.chiller_out_degree) { fields.push('chiller_out_degree = ?'); values.push(data.chiller_out_degree); }
        if (data.chiller_in_bar) { fields.push('chiller_in_bar = ?'); values.push(data.chiller_in_bar); }
        if (data.chiller_out_bar) { fields.push('chiller_out_bar = ?'); values.push(item.chiller_out_bar); }

        values.push(data.id);


        const [result] = await connection.execute(
            `UPDATE table_tempering_aasted SET ${fields.join(', ')} WHERE id = ?`,
            values
        );


        if (result.effectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data Tempering Aasted dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not Found"
            ? `Data Tempering Aasted dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};


const deleteTemperingAasted = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }


    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_tempering_aasted WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data tempering aasted reportz berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"

    );
};

module.exports = {
    getAllTemperingAasted,
    getTemperingAastedById,
    createTemperingAasted,
    updateTemperingAasted,
    deleteTemperingAasted
};