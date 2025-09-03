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

const getAllTemperatureRH = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_temperature_rh');
            return successResponse(res, "Data temperature RH berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getTemperatureRHById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_temperature_rh WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Temperature RH dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data temperature RH berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil temperature RH ID ${id}`
    );
};

const createTemperatureRH = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'time', 'temperature', 'rh', 'differential_pressure', 'pic'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_temperature_rh (id_list_table, id_form, time, temperature, rh, differential_pressure, pic, description) VALUES ?'
                : 'INSERT INTO table_monitoring_temperature_rh (id_list_table, id_form, time, temperature, rh, differential_pressure, pic, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.time, item.temperature, item.rh, item.differential_pressure, item.pic, item.description || null])]
                : [data.id_list_table, data.id_form, data.time, data.temperature, data.rh, data.differential_pressure, data.pic, data.description || null];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data temperature RH berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateTemperatureRH = async (req, res) => {
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
                if (item.temperature) { fields.push('temperature = ?'); values.push(item.temperature); }
                if (item.rh) { fields.push('rh = ?'); values.push(item.rh); }
                if (item.differential_pressure) { fields.push('differential_pressure = ?'); values.push(item.differential_pressure); }
                if (item.pic) { fields.push('pic = ?'); values.push(item.pic); }
                if (item.description !== undefined) { fields.push('description = ?'); values.push(item.description); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_monitoring_temperature_rh SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data temperature RH berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }
        if (data.temperature) { fields.push('temperature = ?'); values.push(data.temperature); }
        if (data.rh) { fields.push('rh = ?'); values.push(data.rh); }
        if (data.differential_pressure) { fields.push('differential_pressure = ?'); values.push(data.differential_pressure); }
        if (data.pic) { fields.push('pic = ?'); values.push(data.pic); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_monitoring_temperature_rh SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data temperature RH dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data temperature RH dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteTemperatureRH = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_temperature_rh WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data temperature RH berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllTemperatureRH,
    getTemperatureRHById,
    createTemperatureRH,
    updateTemperatureRH,
    deleteTemperatureRH
};