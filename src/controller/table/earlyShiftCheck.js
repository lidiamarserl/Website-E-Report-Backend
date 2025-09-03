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


const getAllEarlyShiftChecks = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_early_shift_check');
            return successResponse(res, "Data early shift check berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getEarlyShiftCheckById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_early_shift_check WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Early shift check dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data early shift check berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil early shift check ID ${id}`
    );
};

const createEarlyShiftCheck = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form'];
    const validateData = (item) => requiredFields.every(field => item[field] !== undefined);

    if ((isArray && data.some(item => !validateData(item))) ||
        (!isArray && !validateData(data))) {
        return errorResponse(res, "Bad Request: Properti 'id_list_table' dan 'id_form' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_list_table, id_form, shift, time_start, press_plate_right, press_plate_left, teflon_right, teflin_left, feltcord_right, feltcord_left, pic, checked';
            const placeholders = isArray ? `(${Array(12).fill('?').join(',')})` : `(${Array(12).fill('?').join(',')})`;
            const SQLQuery = isArray
                ? `INSERT INTO table_early_shift_check (${fields}) VALUES ${data.map(() => placeholders).join(',')}`
                : `INSERT INTO table_early_shift_check (${fields}) VALUES ${placeholders}`;

            const getValues = (item) => [
                item.id_list_table, item.id_form, item.shift || null, item.time_start || null,
                item.press_plate_right || null, item.press_plate_left || null,
                item.teflon_right || null, item.teflin_left || null,
                item.feltcord_right || null, item.feltcord_left || null,
                item.pic || null, item.checked || null
            ];

            const values = isArray
                ? data.flatMap(getValues)
                : getValues(data);

            await dbPool.execute(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} early shift check baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateEarlyShiftCheck = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        const updateFields = 'id_list_table = ?, id_form = ?, shift = ?, time_start = ?, press_plate_right = ?, press_plate_left = ?, teflon_right = ?, teflin_left = ?, feltcord_right = ?, feltcord_left = ?, pic = ?, checked = ?';

        const getUpdateValues = (item) => [
            item.id_list_table, item.id_form, item.shift, item.time_start,
            item.press_plate_right, item.press_plate_left,
            item.teflon_right, item.teflin_left,
            item.feltcord_right, item.feltcord_left,
            item.pic, item.checked, item.id
        ];

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(`UPDATE table_early_shift_check SET ${updateFields} WHERE id = ?`,
                    getUpdateValues(item))
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data early shift check berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(`UPDATE table_early_shift_check SET ${updateFields} WHERE id = ?`,
            getUpdateValues(data));
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Early shift check dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Early shift check dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteEarlyShiftCheck = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_early_shift_check WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data early shift check berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};


module.exports = {
    getAllEarlyShiftChecks,
    getEarlyShiftCheckById,
    createEarlyShiftCheck,
    updateEarlyShiftCheck,
    deleteEarlyShiftCheck,
};