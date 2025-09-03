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

const getAllTemperatureD = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_temperature_d');
            return successResponse(res, "Data temperature D berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getTemperatureDById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_temperature_d WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Temperature D dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data temperature D berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil temperature D ID ${id}`
    );
};

const createTemperatureD = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'time', 'temp_burner', 'temp_safety', 'temp_product'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_temperature_d (id_list_table, id_form, time, temp_burner, temp_safety, temp_product, description) VALUES ?'
                : 'INSERT INTO table_monitoring_temperature_d (id_list_table, id_form, time, temp_burner, temp_safety, temp_product, description) VALUES (?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.time, item.temp_burner, item.temp_safety, item.temp_product, item.description || null])]
                : [data.id_list_table, data.id_form, data.time, data.temp_burner, data.temp_safety, data.temp_product, data.description || null];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data temperature D berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateTemperatureD = async (req, res) => {
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
                if (item.time) { fields.push('time = ?'); values.push(item.time); }
                if (item.temp_burner) { fields.push('temp_burner = ?'); values.push(item.temp_burner); }
                if (item.temp_safety) { fields.push('temp_safety = ?'); values.push(item.temp_safety); }
                if (item.temp_product) { fields.push('temp_product = ?'); values.push(item.temp_product); }
                if (item.description !== undefined) { fields.push('description = ?'); values.push(item.description); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_monitoring_temperature_d SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data temperature D berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }
        if (data.temp_burner) { fields.push('temp_burner = ?'); values.push(data.temp_burner); }
        if (data.temp_safety) { fields.push('temp_safety = ?'); values.push(data.temp_safety); }
        if (data.temp_product) { fields.push('temp_product = ?'); values.push(data.temp_product); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_monitoring_temperature_d SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data temperature D dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data temperature D dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteTemperatureD = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_temperature_d WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data temperature D berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllTemperatureD,
    getTemperatureDById,
    createTemperatureD,
    updateTemperatureD,
    deleteTemperatureD
};