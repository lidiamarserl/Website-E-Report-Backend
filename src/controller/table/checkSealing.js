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


const getAllCheckSealings = (req, res) => 
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_check_sealing');
            return successResponse(res, "Data check sealing berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getCheckSealingById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_check_sealing WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Check sealing dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data check sealing berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil check sealing ID ${id}`
    );
};

const createCheckSealing = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);
    
    const requiredFields = ['id_list_table', 'id_form', 'no_machine', 'time'];
    const validateData = (item) => requiredFields.every(field => item[field] !== undefined);
    
    if ((isArray && data.some(item => !validateData(item))) || 
        (!isArray && !validateData(data))) {
        return errorResponse(res, "Bad Request: Properti 'id_list_table', 'id_form', 'no_machine', dan 'time' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_list_table, id_form, no_machine, time, heating_isolation, heating_element';
            const placeholders = isArray ? `(${Array(6).fill('?').join(',')})` : `(${Array(6).fill('?').join(',')})`;
            const SQLQuery = isArray 
                ? `INSERT INTO table_check_sealing (${fields}) VALUES ${data.map(() => placeholders).join(',')}`
                : `INSERT INTO table_check_sealing (${fields}) VALUES ${placeholders}`;
            
            const getValues = (item) => [
                item.id_list_table, item.id_form, item.no_machine, item.time,
                item.heating_isolation || null, item.heating_element || null
            ];
            
            const values = isArray 
                ? data.flatMap(getValues)
                : getValues(data);
            
            await dbPool.execute(SQLQuery, values);
            return successResponse(res, `${isArray ? 'Beberapa' : ''} check sealing baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateCheckSealing = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        const updateFields = 'id_list_table = ?, id_form = ?, no_machine = ?, time = ?, heating_isolation = ?, heating_element = ?';
        
        const getUpdateValues = (item) => [
            item.id_list_table, item.id_form, item.no_machine, item.time,
            item.heating_isolation, item.heating_element, item.id
        ];

        if (isArray) {
            await Promise.all(data.map(item => 
                connection.execute(`UPDATE table_check_sealing SET ${updateFields} WHERE id = ?`, 
                    getUpdateValues(item))
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data check sealing berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(`UPDATE table_check_sealing SET ${updateFields} WHERE id = ?`, 
            getUpdateValues(data));
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Check sealing dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found" 
            ? `Check sealing dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteCheckSealing = async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_check_sealing WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data check sealing berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};


module.exports = {
    getAllCheckSealings,
    getCheckSealingById,
    createCheckSealing,
    updateCheckSealing,
    deleteCheckSealing,

};