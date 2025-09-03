const dbPool = require('../config/database');
const {successResponse, errorResponse} = require('../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllTests = (req, res) => 
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM test');
            return successResponse(res, "Data test berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getTestById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM test WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Test dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data test berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil test ID ${id}`
    );
};

const createTest = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);
    
    if ((isArray && data.some(item => !item.name)) || (!isArray && !data.name)) {
        return errorResponse(res, "Bad Request: Properti 'name' wajib ada", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray 
                ? 'INSERT INTO test (name) VALUES ?'
                : 'INSERT INTO test (name) VALUES (?)';
            const values = isArray ? [data.map(item => [item.name])] : [data.name];
            
            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} test baru berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateTest = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id || !item.name))) ||
            (!isArray && (!data.id || !data.name))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item => 
                connection.execute('UPDATE test SET name = ? WHERE id = ?', [item.name, parseInt(item.id, 10)])
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data test berhasil diperbarui`, data);
        }

        const [result] = await connection.execute('UPDATE test SET name = ? WHERE id = ?', [data.name, parseInt(data.id, 10)]);
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Test dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found" 
            ? `Test dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteTest = async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    const intIds = ids.map(id => parseInt(id, 10));


    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM test WHERE id IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data test berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest
};