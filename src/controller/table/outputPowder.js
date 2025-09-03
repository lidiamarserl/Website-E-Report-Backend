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

const getAllOutputPowder = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_output_powder');
            return successResponse(res, "Data output powder berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getOutputPowderById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_output_powder WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Output powder dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data output powder berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil output powder ID ${id}`
    );
};

const createOutputPowder = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'product_type', 'batch_code', 'packing_code', 'quantity', 'quantity_sack'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_output_powder (id_list_table, id_form, code, product_type, batch_code, packing_code, quantity, quantity_sack, description) VALUES ?'
                : 'INSERT INTO table_output_powder (id_list_table, id_form, code, product_type, batch_code, packing_code, quantity, quantity_sack, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.product_type, item.batch_code, item.packing_code, item.quantity, item.quantity_sack, item.description || null])]
                : [data.id_list_table, data.id_form, data.code, data.product_type, data.batch_code, data.packing_code, data.quantity, data.quantity_sack, data.description || null];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data output powder berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateOutputPowder = async (req, res) => {
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
                if (item.product_type) { fields.push('product_type = ?'); values.push(item.product_type); }
                if (item.batch_code) { fields.push('batch_code = ?'); values.push(item.batch_code); }
                if (item.packing_code) { fields.push('packing_code = ?'); values.push(item.packing_code); }
                if (item.quantity !== undefined) { fields.push('quantity = ?'); values.push(item.quantity); }
                if (item.quantity_sack !== undefined) { fields.push('quantity_sack = ?'); values.push(item.quantity_sack); }
                if (item.description !== undefined) { fields.push('description = ?'); values.push(item.description); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_output_powder SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data output powder berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.product_type) { fields.push('product_type = ?'); values.push(data.product_type); }
        if (data.batch_code) { fields.push('batch_code = ?'); values.push(data.batch_code); }
        if (data.packing_code) { fields.push('packing_code = ?'); values.push(data.packing_code); }
        if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
        if (data.quantity_sack !== undefined) { fields.push('quantity_sack = ?'); values.push(data.quantity_sack); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_output_powder SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data output powder dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data output powder dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteOutputPowder = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_output_powder WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data output powder berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllOutputPowder,
    getOutputPowderById,
    createOutputPowder,
    updateOutputPowder,
    deleteOutputPowder
};