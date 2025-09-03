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

const getAllChangePressPlate = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_change_press_plate');
            return successResponse(res, "Data change press plate berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getChangePressPlateById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_change_press_plate WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Change press plate dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data change press plate berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil change press plate ID ${id}`
    );
};

const createChangePressPlate = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field yang wajib ada
    const requiredFields = ['id_list_table', 'id_form', 'cycle', 'product_type', 'liquor_tank', 'silo_destination'];

    if (isArray) {
        const hasInvalidItem = data.some(item =>
            requiredFields.some(field => !item.hasOwnProperty(field))
        );
        if (hasInvalidItem) {
            return errorResponse(res, "Bad Request: Semua field wajib harus ada", null, 400);
        }
    } else {
        const hasInvalidField = requiredFields.some(field => !data.hasOwnProperty(field));
        if (hasInvalidField) {
            return errorResponse(res, "Bad Request: Semua field wajib harus ada", null, 400);
        }
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? `INSERT INTO table_change_press_plate (
                    id_list_table, id_form, cycle, product_type, liquor_tank, silo_destination,
                    time_start, time_press, temperature_start, temperature_end, temperature_engine,
                    vitmix_start, vitmix_end, vitmix_netto, butter_scale_start, butter_scale_end,
                    butter_scale_netto, equipment_condition, equipment_pot_no, equipment_kn_kr,
                    equipment_code_old, equipment_code_new, feltcord_pot_no, feltcord_kn_kr,
                    feltcord_condition, main_shaft_condition
                ) VALUES ?`
                : `INSERT INTO table_change_press_plate (
                    id_list_table, id_form, cycle, product_type, liquor_tank, silo_destination,
                    time_start, time_press, temperature_start, temperature_end, temperature_engine,
                    vitmix_start, vitmix_end, vitmix_netto, butter_scale_start, butter_scale_end,
                    butter_scale_netto, equipment_condition, equipment_pot_no, equipment_kn_kr,
                    equipment_code_old, equipment_code_new, feltcord_pot_no, feltcord_kn_kr,
                    feltcord_condition, main_shaft_condition
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = isArray
                ? [data.map(item => [
                    item.id_list_table, item.id_form, item.cycle, item.product_type, item.liquor_tank,
                    item.silo_destination, item.time_start || null, item.time_press || null,
                    item.temperature_start || null, item.temperature_end || null, item.temperature_engine || null,
                    item.vitmix_start || null, item.vitmix_end || null, item.vitmix_netto || null,
                    item.butter_scale_start || null, item.butter_scale_end || null, item.butter_scale_netto || null,
                    item.equipment_condition || null, item.equipment_pot_no || null, item.equipment_kn_kr || null,
                    item.equipment_code_old || null, item.equipment_code_new || null, item.feltcord_pot_no || null,
                    item.feltcord_kn_kr || null, item.feltcord_condition || null, item.main_shaft_condition || null
                ])]
                : [
                    data.id_list_table, data.id_form, data.cycle, data.product_type, data.liquor_tank,
                    data.silo_destination, data.time_start || null, data.time_press || null,
                    data.temperature_start || null, data.temperature_end || null, data.temperature_engine || null,
                    data.vitmix_start || null, data.vitmix_end || null, data.vitmix_netto || null,
                    data.butter_scale_start || null, data.butter_scale_end || null, data.butter_scale_netto || null,
                    data.equipment_condition || null, data.equipment_pot_no || null, data.equipment_kn_kr || null,
                    data.equipment_code_old || null, data.equipment_code_new || null, data.feltcord_pot_no || null,
                    data.feltcord_kn_kr || null, data.feltcord_condition || null, data.main_shaft_condition || null
                ];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data change press plate berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateChangePressPlate = async (req, res) => {
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
                const updateFields = [];
                const updateValues = [];

                // Daftar field yang bisa diupdate
                const allowedFields = [
                    'id_list_table', 'id_form', 'cycle', 'product_type', 'liquor_tank', 'silo_destination',
                    'time_start', 'time_press', 'temperature_start', 'temperature_end', 'temperature_engine',
                    'vitmix_start', 'vitmix_end', 'vitmix_netto', 'butter_scale_start', 'butter_scale_end',
                    'butter_scale_netto', 'equipment_condition', 'equipment_pot_no', 'equipment_kn_kr',
                    'equipment_code_old', 'equipment_code_new', 'feltcord_pot_no', 'feltcord_kn_kr',
                    'feltcord_condition', 'main_shaft_condition'
                ];

                allowedFields.forEach(field => {
                    if (item.hasOwnProperty(field)) {
                        updateFields.push(`${field} = ?`);
                        updateValues.push(item[field]);
                    }
                });

                updateValues.push(item.id);

                return connection.execute(
                    `UPDATE table_change_press_plate SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data change press plate berhasil diperbarui`, data);
        }

        const updateFields = [];
        const updateValues = [];

        const allowedFields = [
            'id_list_table', 'id_form', 'cycle', 'product_type', 'liquor_tank', 'silo_destination',
            'time_start', 'time_press', 'temperature_start', 'temperature_end', 'temperature_engine',
            'vitmix_start', 'vitmix_end', 'vitmix_netto', 'butter_scale_start', 'butter_scale_end',
            'butter_scale_netto', 'equipment_condition', 'equipment_pot_no', 'equipment_kn_kr',
            'equipment_code_old', 'equipment_code_new', 'feltcord_pot_no', 'feltcord_kn_kr',
            'feltcord_condition', 'main_shaft_condition'
        ];

        allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(data[field]);
            }
        });

        updateValues.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_change_press_plate SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Change press plate dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Change press plate dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteChangePressPlate = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_change_press_plate WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data change press plate berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllChangePressPlate,
    getChangePressPlateById,
    createChangePressPlate,
    updateChangePressPlate,
    deleteChangePressPlate
};