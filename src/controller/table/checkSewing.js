const dbPool = require('../../config/database');
const {successResponse, errorResponse} = require('../../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllCheckSewings = (req, res) => 
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_check_sewing');
            return successResponse(res, "Data check sewing berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getCheckSewingById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_check_sewing WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Check sewing dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data check sewing berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil check sewing ID ${id}`
    );
};

const createCheckSewing = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);
    
    const requiredFields = ['id_list_table', 'id_form', 'time'];
    const validateData = (item) => requiredFields.every(field => item[field] !== undefined);
    
    if ((isArray && data.some(item => !validateData(item))) || 
        (!isArray && !validateData(data))) {
        return errorResponse(res, "Bad Request: Properti 'id_list_table', 'id_form', dan 'time' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_list_table, id_form, time, engine_condition, stitching_quality';
            const placeholders = isArray ? `(${Array(5).fill('?').join(',')})` : `(${Array(5).fill('?').join(',')})`;
            const SQLQuery = isArray 
                ? `INSERT INTO table_check_sewing (${fields}) VALUES ${data.map(() => placeholders).join(',')}`
                : `INSERT INTO table_check_sewing (${fields}) VALUES ${placeholders}`;
            
            const getValues = (item) => [
                item.id_list_table, item.id_form, item.time,
                item.engine_condition || null, item.stitching_quality || null
            ];
            
            const values = isArray 
                ? data.flatMap(getValues)
                : getValues(data);
            
            await dbPool.execute(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} check sewing baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateCheckSewing = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        const updateFields = 'id_list_table = ?, id_form = ?, time = ?, engine_condition = ?, stitching_quality = ?';
        
        const getUpdateValues = (item) => [
            item.id_list_table, item.id_form, item.time,
            item.engine_condition, item.stitching_quality, item.id
        ];

        if (isArray) {
            await Promise.all(data.map(item => 
                connection.execute(`UPDATE table_check_sewing SET ${updateFields} WHERE id = ?`, 
                    getUpdateValues(item))
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data check sewing berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(`UPDATE table_check_sewing SET ${updateFields} WHERE id = ?`, 
            getUpdateValues(data));
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Check sewing dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found" 
            ? `Check sewing dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteCheckSewing = async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_check_sewing WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data check sewing berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};


module.exports = {
    getAllCheckSewings,
    getCheckSewingById,
    createCheckSewing,
    updateCheckSewing,
    deleteCheckSewing
};