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

const getAllStartupChecklistItem = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_startup_checklist_item');
            return successResponse(res, "Data startup checklist item berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getStartupChecklistItemById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_startup_checklist_item WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Startup checklist item dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data startup checklist item berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil startup checklist item ID ${id}`
    );
};

const createStartupChecklistItem = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'item', 'no_batch', 'stock_initial', 'stock_in', 'stock_use', 'reject', 'stock_final', 'pic'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_startup_checklist_item (id_list_table, id_form, item, no_batch, stock_initial, stock_in, stock_use, reject, stock_final, pic) VALUES ?'
                : 'INSERT INTO table_startup_checklist_item (id_list_table, id_form, item, no_batch, stock_initial, stock_in, stock_use, reject, stock_final, pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.item, item.no_batch, item.stock_initial, item.stock_in, item.stock_use, item.reject, item.stock_final, item.pic])]
                : [data.id_list_table, data.id_form, data.item, data.no_batch, data.stock_initial, data.stock_in, data.stock_use, data.reject, data.stock_final, data.pic];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data startup checklist item berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateStartupChecklistItem = async (req, res) => {
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
                if (item.item) { fields.push('item = ?'); values.push(item.item); }
                if (item.no_batch) { fields.push('no_batch = ?'); values.push(item.no_batch); }
                if (item.stock_initial) { fields.push('stock_initial = ?'); values.push(item.stock_initial); }
                if (item.stock_in) { fields.push('stock_in = ?'); values.push(item.stock_in); }
                if (item.stock_use) { fields.push('stock_use = ?'); values.push(item.stock_use); }
                if (item.reject) { fields.push('reject = ?'); values.push(item.reject); }
                if (item.stock_final) { fields.push('stock_final = ?'); values.push(item.stock_final); }
                if (item.pic) { fields.push('pic = ?'); values.push(item.pic); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_startup_checklist_item SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data startup checklist item berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.item) { fields.push('item = ?'); values.push(data.item); }
        if (data.no_batch) { fields.push('no_batch = ?'); values.push(data.no_batch); }
        if (data.stock_initial) { fields.push('stock_initial = ?'); values.push(data.stock_initial); }
        if (data.stock_in) { fields.push('stock_in = ?'); values.push(data.stock_in); }
        if (data.stock_use) { fields.push('stock_use = ?'); values.push(data.stock_use); }
        if (data.reject) { fields.push('reject = ?'); values.push(data.reject); }
        if (data.stock_final) { fields.push('stock_final = ?'); values.push(data.stock_final); }
        if (data.pic) { fields.push('pic = ?'); values.push(data.pic); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_startup_checklist_item SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data startup checklist item dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data startup checklist item dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteStartupChecklistItem = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_startup_checklist_item WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data startup checklist item berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllStartupChecklistItem,
    getStartupChecklistItemById,
    createStartupChecklistItem,
    updateStartupChecklistItem,
    deleteStartupChecklistItem
};