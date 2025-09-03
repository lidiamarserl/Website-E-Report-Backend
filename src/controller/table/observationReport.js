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

const getAllObservationReport = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_observation_report');
            return successResponse(res, "Data observation report berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getObservationReportById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_observation_report WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Observation report dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data observation report berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil observation report ID ${id}`
    );
};


const createObservationReport = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'product_type', 'code', 'mix', 'time'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_observation_report (id_list_table, id_form, product_type, code, mix, time, impact_flowrats_feed, impact_main_drive, impact_drive_frekuensi, impact_drive, impact_fan, impact_air_volume, impact_air_volume_degree, impact_oxygen, impact_hopper, cooling_fan, cooling_air_volume, cooling_air_volume_degree, cooling_hopper, stabilizing_fan, stabilizing_air_volume, stabilizing_air_volume_degree, stabilizing_hopper) VALUES ?'
                : 'INSERT INTO table_observation_report (id_list_table, id_form, product_type, code, mix, time, impact_flowrats_feed, impact_main_drive, impact_drive_frekuensi, impact_drive, impact_fan, impact_air_volume, impact_air_volume_degree, impact_oxygen, impact_hopper, cooling_fan, cooling_air_volume, cooling_air_volume_degree, cooling_hopper, stabilizing_fan, stabilizing_air_volume, stabilizing_air_volume_degree, stabilizing_hopper) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [
                    item.id_list_table, item.id_form, item.product_type, item.code, item.mix, item.time,
                    item.impact_flowrats_feed || null, item.impact_main_drive || null, item.impact_drive_frekuensi || null,
                    item.impact_drive || null, item.impact_fan || null, item.impact_air_volume || null,
                    item.impact_air_volume_degree || null, item.impact_oxygen || null, item.impact_hopper || null,
                    item.cooling_fan || null, item.cooling_air_volume || null, item.cooling_air_volume_degree || null,
                    item.cooling_hopper || null, item.stabilizing_fan || null, item.stabilizing_air_volume || null,
                    item.stabilizing_air_volume_degree || null, item.stabilizing_hopper || null
                ])]
                : [
                    data.id_list_table, data.id_form, data.product_type, data.code, data.mix, data.time,
                    data.impact_flowrats_feed || null, data.impact_main_drive || null, data.impact_drive_frekuensi || null,
                    data.impact_drive || null, data.impact_fan || null, data.impact_air_volume || null,
                    data.impact_air_volume_degree || null, data.impact_oxygen || null, data.impact_hopper || null,
                    data.cooling_fan || null, data.cooling_air_volume || null, data.cooling_air_volume_degree || null,
                    data.cooling_hopper || null, data.stabilizing_fan || null, data.stabilizing_air_volume || null,
                    data.stabilizing_air_volume_degree || null, data.stabilizing_hopper || null
                ];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data observation report berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateObservationReport = async (req, res) => {
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
                if (item.code) { fields.push('code = ?'); values.push(item.code); }
                if (item.mix) { fields.push('mix = ?'); values.push(item.mix); }
                if (item.time) { fields.push('time = ?'); values.push(item.time); }
                if (item.impact_flowrats_feed !== undefined) { fields.push('impact_flowrats_feed = ?'); values.push(item.impact_flowrats_feed); }
                if (item.impact_main_drive !== undefined) { fields.push('impact_main_drive = ?'); values.push(item.impact_main_drive); }
                if (item.impact_drive_frekuensi !== undefined) { fields.push('impact_drive_frekuensi = ?'); values.push(item.impact_drive_frekuensi); }
                if (item.impact_drive !== undefined) { fields.push('impact_drive = ?'); values.push(item.impact_drive); }
                if (item.impact_fan !== undefined) { fields.push('impact_fan = ?'); values.push(item.impact_fan); }
                if (item.impact_air_volume !== undefined) { fields.push('impact_air_volume = ?'); values.push(item.impact_air_volume); }
                if (item.impact_air_volume_degree !== undefined) { fields.push('impact_air_volume_degree = ?'); values.push(item.impact_air_volume_degree); }
                if (item.impact_oxygen !== undefined) { fields.push('impact_oxygen = ?'); values.push(item.impact_oxygen); }
                if (item.impact_hopper !== undefined) { fields.push('impact_hopper = ?'); values.push(item.impact_hopper); }
                if (item.cooling_fan !== undefined) { fields.push('cooling_fan = ?'); values.push(item.cooling_fan); }
                if (item.cooling_air_volume !== undefined) { fields.push('cooling_air_volume = ?'); values.push(item.cooling_air_volume); }
                if (item.cooling_air_volume_degree !== undefined) { fields.push('cooling_air_volume_degree = ?'); values.push(item.cooling_air_volume_degree); }
                if (item.cooling_hopper !== undefined) { fields.push('cooling_hopper = ?'); values.push(item.cooling_hopper); }
                if (item.stabilizing_fan !== undefined) { fields.push('stabilizing_fan = ?'); values.push(item.stabilizing_fan); }
                if (item.stabilizing_air_volume !== undefined) { fields.push('stabilizing_air_volume = ?'); values.push(item.stabilizing_air_volume); }
                if (item.stabilizing_air_volume_degree !== undefined) { fields.push('stabilizing_air_volume_degree = ?'); values.push(item.stabilizing_air_volume_degree); }
                if (item.stabilizing_hopper !== undefined) { fields.push('stabilizing_hopper = ?'); values.push(item.stabilizing_hopper); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_observation_report SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data observation report berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.product_type) { fields.push('product_type = ?'); values.push(data.product_type); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.mix) { fields.push('mix = ?'); values.push(data.mix); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }
        if (data.impact_flowrats_feed !== undefined) { fields.push('impact_flowrats_feed = ?'); values.push(data.impact_flowrats_feed); }
        if (data.impact_main_drive !== undefined) { fields.push('impact_main_drive = ?'); values.push(data.impact_main_drive); }
        if (data.impact_drive_frekuensi !== undefined) { fields.push('impact_drive_frekuensi = ?'); values.push(data.impact_drive_frekuensi); }
        if (data.impact_drive !== undefined) { fields.push('impact_drive = ?'); values.push(data.impact_drive); }
        if (data.impact_fan !== undefined) { fields.push('impact_fan = ?'); values.push(data.impact_fan); }
        if (data.impact_air_volume !== undefined) { fields.push('impact_air_volume = ?'); values.push(data.impact_air_volume); }
        if (data.impact_air_volume_degree !== undefined) { fields.push('impact_air_volume_degree = ?'); values.push(data.impact_air_volume_degree); }
        if (data.impact_oxygen !== undefined) { fields.push('impact_oxygen = ?'); values.push(data.impact_oxygen); }
        if (data.impact_hopper !== undefined) { fields.push('impact_hopper = ?'); values.push(data.impact_hopper); }
        if (data.cooling_fan !== undefined) { fields.push('cooling_fan = ?'); values.push(data.cooling_fan); }
        if (data.cooling_air_volume !== undefined) { fields.push('cooling_air_volume = ?'); values.push(data.cooling_air_volume); }
        if (data.cooling_air_volume_degree !== undefined) { fields.push('cooling_air_volume_degree = ?'); values.push(data.cooling_air_volume_degree); }
        if (data.cooling_hopper !== undefined) { fields.push('cooling_hopper = ?'); values.push(data.cooling_hopper); }
        if (data.stabilizing_fan !== undefined) { fields.push('stabilizing_fan = ?'); values.push(data.stabilizing_fan); }
        if (data.stabilizing_air_volume !== undefined) { fields.push('stabilizing_air_volume = ?'); values.push(data.stabilizing_air_volume); }
        if (data.stabilizing_air_volume_degree !== undefined) { fields.push('stabilizing_air_volume_degree = ?'); values.push(data.stabilizing_air_volume_degree); }
        if (data.stabilizing_hopper !== undefined) { fields.push('stabilizing_hopper = ?'); values.push(data.stabilizing_hopper); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_observation_report SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data observation report dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data observation report dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteObservationReport = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_observation_report WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data observation report berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllObservationReport,
    getObservationReportById,
    createObservationReport,
    updateObservationReport,
    deleteObservationReport
};