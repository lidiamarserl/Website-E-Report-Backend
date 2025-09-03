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

const getAllFilterButterDuyvis = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_process_filter_butter_duyvis');
            return successResponse(res, "Data filter butter duyvis berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getFilterButterDuyvisById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_process_filter_butter_duyvis WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Filter butter duyvis dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data filter butter duyvis berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil filter butter duyvis ID ${id}`
    );
};

const createFilterButterDuyvis = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'equipment', 'parameter', 'value1', 'value2', 'value3'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_process_filter_butter_duyvis (id_list_table, id_form, code, equipment, parameter, value1, value2, value3) VALUES ?'
                : 'INSERT INTO table_process_filter_butter_duyvis (id_list_table, id_form, code, equipment, parameter, value1, value2, value3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.equipment, item.parameter, item.value1, item.value2, item.value3])]
                : [data.id_list_table, data.id_form, data.code, data.equipment, data.parameter, data.value1, data.value2, data.value3];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data filter butter duyvis berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateFilterButterDuyvis = async (req, res) => {
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
                if (item.equipment) { fields.push('equipment = ?'); values.push(item.equipment); }
                if (item.parameter) { fields.push('parameter = ?'); values.push(item.parameter); }
                if (item.value1) { fields.push('value1 = ?'); values.push(item.value1); }
                if (item.value2) { fields.push('value2 = ?'); values.push(item.value2); }
                if (item.value3) { fields.push('value3 = ?'); values.push(item.value3); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_process_filter_butter_duyvis SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data filter butter duyvis berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.equipment) { fields.push('equipment = ?'); values.push(data.equipment); }
        if (data.parameter) { fields.push('parameter = ?'); values.push(data.parameter); }
        if (data.value1) { fields.push('value1 = ?'); values.push(data.value1); }
        if (data.value2) { fields.push('value2 = ?'); values.push(data.value2); }
        if (data.value3) { fields.push('value3 = ?'); values.push(data.value3); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_process_filter_butter_duyvis SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data filter butter duyvis dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data filter butter duyvis dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteFilterButterDuyvis = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_process_filter_butter_duyvis WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data filter butter duyvis berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllFilterButterDuyvis,
    getFilterButterDuyvisById,
    createFilterButterDuyvis,
    updateFilterButterDuyvis,
    deleteFilterButterDuyvis
};