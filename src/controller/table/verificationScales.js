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

const getAllVerificationScales = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_verification_scales');
            return successResponse(res, "Data verification scales berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getVerificationScalesById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_verification_scales WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Verification scales dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data verification scales berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil verification scales ID ${id}`
    );
};

const createVerificationScales = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'parameter', 'verification_filling', 'verification_weigher', 'load', 'result'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_verification_scales (id_list_table, id_form, parameter, verification_filling, verification_weigher, load, result) VALUES ?'
                : 'INSERT INTO table_verification_scales (id_list_table, id_form, parameter, verification_filling, verification_weigher, load, result) VALUES (?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.parameter, item.verification_filling, item.verification_weigher, item.load, item.result])]
                : [data.id_list_table, data.id_form, data.parameter, data.verification_filling, data.verification_weigher, data.load, data.result];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data verification scales berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateVerificationScales = async (req, res) => {
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
                if (item.parameter) { fields.push('parameter = ?'); values.push(item.parameter); }
                if (item.verification_filling) { fields.push('verification_filling = ?'); values.push(item.verification_filling); }
                if (item.verification_weigher) { fields.push('verification_weigher = ?'); values.push(item.verification_weigher); }
                if (item.load) { fields.push('load = ?'); values.push(item.load); }
                if (item.result) { fields.push('result = ?'); values.push(item.result); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_verification_scales SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data verification scales berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.parameter) { fields.push('parameter = ?'); values.push(data.parameter); }
        if (data.verification_filling) { fields.push('verification_filling = ?'); values.push(data.verification_filling); }
        if (data.verification_weigher) { fields.push('verification_weigher = ?'); values.push(data.verification_weigher); }
        if (data.load) { fields.push('load = ?'); values.push(data.load); }
        if (data.result) { fields.push('result = ?'); values.push(data.result); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_verification_scales SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data verification scales dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data verification scales dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteVerificationScales = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_verification_scales WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data verification scales berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllVerificationScales,
    getVerificationScalesById,
    createVerificationScales,
    updateVerificationScales,
    deleteVerificationScales
};