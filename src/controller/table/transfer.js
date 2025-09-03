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

const getAllTransfer = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_transfer');
            return successResponse(res, "Data transfer berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getTransferById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_transfer WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Transfer dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data transfer berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil transfer ID ${id}`
    );
};

const createTransfer = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'transfer', 'code', 'parameter', 'value1', 'value2', 'value3', 'value4', 'stock_start', 'stock_end'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_transfer (id_list_table, id_form, transfer, code, parameter, value1, value2, value3, value4, stock_start, stock_end) VALUES ?'
                : 'INSERT INTO table_transfer (id_list_table, id_form, transfer, code, parameter, value1, value2, value3, value4, stock_start, stock_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.transfer, item.code, item.parameter, item.value1, item.value2, item.value3, item.value4, item.stock_start, item.stock_end])]
                : [data.id_list_table, data.id_form, data.transfer, data.code, data.parameter, data.value1, data.value2, data.value3, data.value4, data.stock_start, data.stock_end];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data transfer berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateTransfer = async (req, res) => {
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
                if (item.transfer) { fields.push('transfer = ?'); values.push(item.transfer); }
                if (item.code) { fields.push('code = ?'); values.push(item.code); }
                if (item.parameter) { fields.push('parameter = ?'); values.push(item.parameter); }
                if (item.value1) { fields.push('value1 = ?'); values.push(item.value1); }
                if (item.value2) { fields.push('value2 = ?'); values.push(item.value2); }
                if (item.value3) { fields.push('value3 = ?'); values.push(item.value3); }
                if (item.value4) { fields.push('value4 = ?'); values.push(item.value4); }
                if (item.stock_start) { fields.push('stock_start = ?'); values.push(item.stock_start); }
                if (item.stock_end) { fields.push('stock_end = ?'); values.push(item.stock_end); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_transfer SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data transfer berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.transfer) { fields.push('transfer = ?'); values.push(data.transfer); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.parameter) { fields.push('parameter = ?'); values.push(data.parameter); }
        if (data.value1) { fields.push('value1 = ?'); values.push(data.value1); }
        if (data.value2) { fields.push('value2 = ?'); values.push(data.value2); }
        if (data.value3) { fields.push('value3 = ?'); values.push(data.value3); }
        if (data.value4) { fields.push('value4 = ?'); values.push(data.value4); }
        if (data.stock_start) { fields.push('stock_start = ?'); values.push(data.stock_start); }
        if (data.stock_end) { fields.push('stock_end = ?'); values.push(data.stock_end); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_transfer SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data transfer dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data transfer dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteTransfer = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_transfer WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data transfer berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllTransfer,
    getTransferById,
    createTransfer,
    updateTransfer,
    deleteTransfer
};