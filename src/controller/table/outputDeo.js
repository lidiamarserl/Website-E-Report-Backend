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

const getAllOutputDeo = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_output_deo');
            return successResponse(res, "Data output deo berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );


const getOutputDeoById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_output_deo WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Output deo dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data output deo berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil output deo ID ${id}`
    );
};

const createOutputDeo = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'value_start', 'value_end', 'total'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_output_deo (id_list_table, id_form, code, value_start, value_end, total) VALUES ?'
                : 'INSERT INTO table_output_deo (id_list_table, id_form, code, value_start, value_end, total) VALUES (?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.value_start, item.value_end, item.total])]
                : [data.id_list_table, data.id_form, data.code, data.value_start, data.value_end, data.total];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data output deo berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateOutputDeo = async (req, res) => {
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
                if (item.value_start !== undefined) { fields.push('value_start = ?'); values.push(item.value_start); }
                if (item.value_end !== undefined) { fields.push('value_end = ?'); values.push(item.value_end); }
                if (item.total !== undefined) { fields.push('total = ?'); values.push(item.total); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_output_deo SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data output deo berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.value_start !== undefined) { fields.push('value_start = ?'); values.push(data.value_start); }
        if (data.value_end !== undefined) { fields.push('value_end = ?'); values.push(data.value_end); }
        if (data.total !== undefined) { fields.push('total = ?'); values.push(data.total); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_output_deo SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data output deo dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data output deo dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteOutputDeo = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_output_deo WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data output deo berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllOutputDeo,
    getOutputDeoById,
    createOutputDeo,
    updateOutputDeo,
    deleteOutputDeo
};