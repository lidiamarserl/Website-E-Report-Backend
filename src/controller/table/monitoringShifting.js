
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

const getAllSifting = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_sifting');
            return successResponse(res, "Data sifting berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getSiftingById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_sifting WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Sifting dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data sifting berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil sifting ID ${id}`
    );
};

const createSifting = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'shift', 'time', 'bolt', 'screen_front', 'screen_back', 'pic'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_sifting (id_list_table, id_form, shift, time, bolt, screen_front, screen_back, description, pic) VALUES ?'
                : 'INSERT INTO table_monitoring_sifting (id_list_table, id_form, shift, time, bolt, screen_front, screen_back, description, pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.shift, item.time, item.bolt, item.screen_front, item.screen_back, item.description || null, item.pic])]
                : [data.id_list_table, data.id_form, data.shift, data.time, data.bolt, data.screen_front, data.screen_back, data.description || null, data.pic];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data sifting berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateSifting = async (req, res) => {
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
                if (item.shift) { fields.push('shift = ?'); values.push(item.shift); }
                if (item.time) { fields.push('time = ?'); values.push(item.time); }
                if (item.bolt) { fields.push('bolt = ?'); values.push(item.bolt); }
                if (item.screen_front) { fields.push('screen_front = ?'); values.push(item.screen_front); }
                if (item.screen_back) { fields.push('screen_back = ?'); values.push(item.screen_back); }
                if (item.description !== undefined) { fields.push('description = ?'); values.push(item.description); }
                if (item.pic) { fields.push('pic = ?'); values.push(item.pic); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_monitoring_sifting SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data sifting berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.shift) { fields.push('shift = ?'); values.push(data.shift); }
        if (data.time) { fields.push('time = ?'); values.push(data.time); }
        if (data.bolt) { fields.push('bolt = ?'); values.push(data.bolt); }
        if (data.screen_front) { fields.push('screen_front = ?'); values.push(data.screen_front); }
        if (data.screen_back) { fields.push('screen_back = ?'); values.push(data.screen_back); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.pic) { fields.push('pic = ?'); values.push(data.pic); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_monitoring_sifting SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data Sifting dengan id ${data.id} berhasil diupdate`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data temperature D dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};


const deleteSifting = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_sifting WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data temperature D berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );

};


module.exports = {
    getAllSifting,
    getSiftingById,
    createSifting,
    updateSifting,
    deleteSifting
}