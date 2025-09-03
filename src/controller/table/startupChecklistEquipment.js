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

const getAllStartupChecklistEquipment = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_startup_checklist_equipment');
            return successResponse(res, "Data startup checklist equipment berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getStartupChecklistEquipmentById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_startup_checklist_equipment WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Startup checklist equipment dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data startup checklist equipment berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil startup checklist equipment ID ${id}`
    );
};

const createStartupChecklistEquipment = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'line', 'equipment', 'parameter', 'standard', 'result_value', 'result_status'];

    if ((isArray && data.some(item => requiredFields.some(field => item[field] === undefined || item[field] === null))) ||
        (!isArray && requiredFields.some(field => data[field] === undefined || data[field] === null))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_startup_checklist_equipment (id_list_table, id_form, line, equipment, parameter, standard, result_value, result_status) VALUES ?'
                : 'INSERT INTO table_startup_checklist_equipment (id_list_table, id_form, line, equipment, parameter, standard, result_value, result_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.line, item.equipment, item.parameter, item.standard, item.result_value, item.result_status])]
                : [data.id_list_table, data.id_form, data.line, data.equipment, data.parameter, data.standard, data.result_value, data.result_status];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data startup checklist equipment berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateStartupChecklistEquipment = async (req, res) => {
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
                if (item.line !== undefined) { fields.push('line = ?'); values.push(item.line); }
                if (item.equipment !== undefined) { fields.push('equipment = ?'); values.push(item.equipment); }
                if (item.parameter !== undefined) { fields.push('parameter = ?'); values.push(item.parameter); }
                if (item.standard !== undefined) { fields.push('standard = ?'); values.push(item.standard); }
                if (item.result_value !== undefined) { fields.push('result_value = ?'); values.push(item.result_value); }
                if (item.result_status !== undefined) { fields.push('result_status = ?'); values.push(item.result_status); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_startup_checklist_equipment SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data startup checklist equipment berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table !== undefined) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form !== undefined) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.line !== undefined) { fields.push('line = ?'); values.push(data.line); }
        if (data.equipment !== undefined) { fields.push('equipment = ?'); values.push(data.equipment); }
        if (data.parameter !== undefined) { fields.push('parameter = ?'); values.push(data.parameter); }
        if (data.standard !== undefined) { fields.push('standard = ?'); values.push(data.standard); }
        if (data.result_value !== undefined) { fields.push('result_value = ?'); values.push(data.result_value); }
        if (data.result_status !== undefined) { fields.push('result_status = ?'); values.push(data.result_status); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_startup_checklist_equipment SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data startup checklist equipment dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data startup checklist equipment dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteStartupChecklistEquipment = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_startup_checklist_equipment WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data startup checklist equipment berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllStartupChecklistEquipment,
    getStartupChecklistEquipmentById,
    createStartupChecklistEquipment,
    updateStartupChecklistEquipment,
    deleteStartupChecklistEquipment
};