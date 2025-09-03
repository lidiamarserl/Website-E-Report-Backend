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

const getAllHoldQCs = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_hold_qc');
            return successResponse(res, "Data hold QC berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getHoldQCById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_hold_qc WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Hold QC dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data hold QC berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil hold QC ID ${id}`
    );
};

const createHoldQC = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'qty_bag', 'qty_kg'];
    const validateData = (item) => requiredFields.every(field => item[field] !== undefined);

    if ((isArray && data.some(item => !validateData(item))) ||
        (!isArray && !validateData(data))) {
        return errorResponse(res, "Bad Request: Properti 'id_list_table', 'id_form', 'qty_bag', dan 'qty_kg' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_list_table, id_form, qty_bag, qty_kg, description';
            const placeholders = isArray ? `(${Array(5).fill('?').join(',')})` : `(${Array(5).fill('?').join(',')})`;
            const SQLQuery = isArray
                ? `INSERT INTO table_hold_qc (${fields}) VALUES ${data.map(() => placeholders).join(',')}`
                : `INSERT INTO table_hold_qc (${fields}) VALUES ${placeholders}`;

            const getValues = (item) => [
                item.id_list_table, item.id_form, item.qty_bag, item.qty_kg,
                item.description || null
            ];

            const values = isArray
                ? data.flatMap(getValues)
                : getValues(data);

            await dbPool.execute(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} hold QC baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateHoldQC = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        const updateFields = 'id_list_table = ?, id_form = ?, qty_bag = ?, qty_kg = ?, description = ?';

        const getUpdateValues = (item) => [
            item.id_list_table, item.id_form, item.qty_bag, item.qty_kg,
            item.description, item.id
        ];

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(`UPDATE table_hold_qc SET ${updateFields} WHERE id = ?`,
                    getUpdateValues(item))
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data hold QC berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(`UPDATE table_hold_qc SET ${updateFields} WHERE id = ?`,
            getUpdateValues(data));
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Hold QC dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Hold QC dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteHoldQC = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_hold_qc WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data hold QC berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};


module.exports = {
    getAllHoldQCs,
    getHoldQCById,
    createHoldQC,
    updateHoldQC,
    deleteHoldQC
};