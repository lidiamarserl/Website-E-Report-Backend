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

const getAllWip = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_wip');
            return successResponse(res, "Data WIP berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getWipById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_wip WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `WIP dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data WIP berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil WIP ID ${id}`
    );
};

const createWip = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'line', 'nomor', 'stock_start', 'stock_end'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_wip (id_list_table, id_form, code, line, nomor, stock_start, stock_end, description) VALUES ?'
                : 'INSERT INTO table_wip (id_list_table, id_form, code, line, nomor, stock_start, stock_end, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.line, item.nomor, item.stock_start, item.stock_end, item.description || null])]
                : [data.id_list_table, data.id_form, data.code, data.line, data.nomor, data.stock_start, data.stock_end, data.description || null];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data WIP berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data WIP`
    );
};

const updateWip = async (req, res) => {
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
                if (item.line) { fields.push('line = ?'); values.push(item.line); }
                if (item.nomor) { fields.push('nomor = ?'); values.push(item.nomor); }
                if (item.stock_start !== undefined) { fields.push('stock_start = ?'); values.push(item.stock_start); }
                if (item.stock_end !== undefined) { fields.push('stock_end = ?'); values.push(item.stock_end); }
                if (item.description !== undefined) { fields.push('description = ?'); values.push(item.description); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_wip SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data WIP berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.line) { fields.push('line = ?'); values.push(data.line); }
        if (data.nomor) { fields.push('nomor = ?'); values.push(data.nomor); }
        if (data.stock_start !== undefined) { fields.push('stock_start = ?'); values.push(data.stock_start); }
        if (data.stock_end !== undefined) { fields.ush('stock_end = ?'); values.push(data.stock_end); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_wip SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data WIP dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data WIP dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data WIP, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 500);
    } finally {
        connection.release();
    }
};

const deleteWip = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_wip WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data WIP yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data WIP berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data WIP"
    );
};

module.exports = {
    getAllWip,
    getWipById,
    createWip,
    updateWip,
    deleteWip
}