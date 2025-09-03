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

const getAllWeighingVerification = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_weighing_verification');
            return successResponse(res, "Data weighing verification berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getWeighingVerificationById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_weighing_verification WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Weighing verification dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data weighing verification berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil weighing verification ID ${id}`
    );
};

const createWeighingVerification = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'bag_no', 'quantity', 'verification_bag', 'verification_bag2'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_weighing_verification (id_list_table, id_form, code, bag_no, quantity, verification_bag, verification_bag2) VALUES ?'
                : 'INSERT INTO table_weighing_verification (id_list_table, id_form, code, bag_no, quantity, verification_bag, verification_bag2) VALUES (?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.bag_no, item.quantity, item.verification_bag, item.verification_bag2])]
                : [data.id_list_table, data.id_form, data.code, data.bag_no, data.quantity, data.verification_bag, data.verification_bag2];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data weighing verification berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateWeighingVerification = async (req, res) => {
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
                if (item.bag_no) { fields.push('bag_no = ?'); values.push(item.bag_no); }
                if (item.quantity) { fields.push('quantity = ?'); values.push(item.quantity); }
                if (item.verification_bag) { fields.push('verification_bag = ?'); values.push(item.verification_bag); }
                if (item.verification_bag2) { fields.push('verification_bag2 = ?'); values.push(item.verification_bag2); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_weighing_verification SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data weighing verification berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.code) { fields.push('code = ?'); values.push(data.code); }
        if (data.bag_no) { fields.push('bag_no = ?'); values.push(data.bag_no); }
        if (data.quantity) { fields.push('quantity = ?'); values.push(data.quantity); }
        if (data.verification_bag) { fields.push('verification_bag = ?'); values.push(data.verification_bag); }
        if (data.verification_bag2) { fields.push('verification_bag2 = ?'); values.push(data.verification_bag2); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_weighing_verification SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data weighing verification dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data weighing verification dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteWeighingVerification = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_weighing_verification WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data weighing verification berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllWeighingVerification,
    getWeighingVerificationById,
    createWeighingVerification,
    updateWeighingVerification,
    deleteWeighingVerification
};