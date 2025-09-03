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

const getAllButterTanks = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_butter_tank');
            return successResponse(res, "Data butter tank berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getButterTankById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_butter_tank WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Butter tank dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data butter tank berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil butter tank ID ${id}`
    );
};

const createButterTank = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'code', 'line', 'no_tank'];
    const validateData = (item) => requiredFields.every(field => item[field] !== undefined);

    if ((isArray && data.some(item => !validateData(item))) ||
        (!isArray && !validateData(data))) {
        return errorResponse(res, "Bad Request: Properti 'id_list_table', 'id_form', 'code', 'line', dan 'no_tank' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_list_table, id_form, code, line, no_tank, product_type, stock_initial, stock_end, time_start, time_end, deo_no';
            const placeholders = isArray ? `(${Array(11).fill('?').join(',')})` : `(${Array(11).fill('?').join(',')})`;
            const SQLQuery = isArray
                ? `INSERT INTO table_butter_tank (${fields}) VALUES ${data.map(() => placeholders).join(',')}`
                : `INSERT INTO table_butter_tank (${fields}) VALUES ${placeholders}`;

            const getValues = (item) => [
                item.id_list_table ? parseInt(item.id_list_table, 10) : null,
                item.id_form ? parseInt(item.id_form, 10): null,
                item.code,
                item.line,
                item.no_tank,
                item.product_type || null,
                item.stock_initial || null,
                item.stock_end || null,
                item.time_start || null,
                item.time_end || null,
                item.deo_no || null
            ];

            const values = isArray
                ? data.flatMap(getValues)
                : getValues(data);

            await dbPool.execute(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} butter tank baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateButterTank = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        const updateFields = 'id_list_table = ?, id_form = ?, code = ?, line = ?, no_tank = ?, product_type = ?, stock_initial = ?, stock_end = ?, time_start = ?, time_end = ?, deo_no = ?';

        const getUpdateValues = (item) => [
            item.id_list_table, item.id_form, item.code, item.line, item.no_tank,
            item.product_type, item.stock_initial, item.stock_end,
            item.time_start, item.time_end, item.deo_no, item.id
        ];

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(`UPDATE table_butter_tank SET ${updateFields} WHERE id = ?`,
                    getUpdateValues(item))
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data butter tank berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(`UPDATE table_butter_tank SET ${updateFields} WHERE id = ?`,
            getUpdateValues(data));
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Butter tank dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Butter tank dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteButterTank = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_butter_tank WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data butter tank berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllButterTanks,
    getButterTankById,
    createButterTank,
    updateButterTank,
    deleteButterTank,
}