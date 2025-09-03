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

const getAllChallengeTests = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_challenge_test');
            return successResponse(res, "Data challenge test berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getChallengeTestById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_challenge_test WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Challenge test dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data challenge test berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil challenge test ID ${id}`
    );
};

const createChallengeTest = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_form', 'id_list_table', 'shift', 'time'];
    const validateData = (item) => requiredFields.every(field => item[field] !== undefined);

    if ((isArray && data.some(item => !validateData(item))) ||
        (!isArray && !validateData(data))) {
        return errorResponse(res, "Bad Request: Properti 'id_form', 'id_list_table', 'shift', dan 'time' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_form, id_list_table, shift, time, test_fe_1, test_fe_2, test_fe_3, test_ss_1, test_ss_2, test_ss_3, test_non_fe_1, test_non_fe_2, test_non_fe_3, counting_start, counting_end, counting_detection, description, pic';
            const placeholders = isArray ? `(${Array(18).fill('?').join(',')})` : `(${Array(18).fill('?').join(',')})`;
            const SQLQuery = isArray
                ? `INSERT INTO table_challenge_test (${fields}) VALUES ${data.map(() => placeholders).join(',')}`
                : `INSERT INTO table_challenge_test (${fields}) VALUES ${placeholders}`;

            const getValues = (item) => [
                item.id_form, item.id_list_table, item.shift, item.time,
                item.test_fe_1 || null, item.test_fe_2 || null, item.test_fe_3 || null,
                item.test_ss_1 || null, item.test_ss_2 || null, item.test_ss_3 || null,
                item.test_non_fe_1 || null, item.test_non_fe_2 || null, item.test_non_fe_3 || null,
                item.counting_start || null, item.counting_end || null, item.counting_detection || null,
                item.description || null, item.pic || null
            ];

            const values = isArray
                ? data.flatMap(getValues)
                : getValues(data);

            await dbPool.execute(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} challenge test baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateChallengeTest = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        const updateFields = 'id_form = ?, id_list_table = ?, shift = ?, time = ?, test_fe_1 = ?, test_fe_2 = ?, test_fe_3 = ?, test_ss_1 = ?, test_ss_2 = ?, test_ss_3 = ?, test_non_fe_1 = ?, test_non_fe_2 = ?, test_non_fe_3 = ?, counting_start = ?, counting_end = ?, counting_detection = ?, description = ?, pic = ?';

        const getUpdateValues = (item) => [
            item.id_form, item.id_list_table, item.shift, item.time,
            item.test_fe_1, item.test_fe_2, item.test_fe_3,
            item.test_ss_1, item.test_ss_2, item.test_ss_3,
            item.test_non_fe_1, item.test_non_fe_2, item.test_non_fe_3,
            item.counting_start, item.counting_end, item.counting_detection,
            item.description, item.pic, item.id
        ];

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(`UPDATE table_challenge_test SET ${updateFields} WHERE id = ?`,
                    getUpdateValues(item))
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data challenge test berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(`UPDATE table_challenge_test SET ${updateFields} WHERE id = ?`,
            getUpdateValues(data));
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Challenge test dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Challenge test dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteChallengeTest = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_challenge_test WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data challenge test berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllChallengeTests,
    getChallengeTestById,
    createChallengeTest,
    updateChallengeTest,
    deleteChallengeTest,
}