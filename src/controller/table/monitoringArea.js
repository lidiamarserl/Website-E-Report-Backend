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

const getAllArea = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_area');
            return successResponse(res, "Data area berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getAreaById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_area WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Area dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data area berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil area ID ${id}`
    );
};

const createArea = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field wajib
    const requiredFields = ['id_list_table', 'id_form', 'code', 'area', 'shift', 'time', 'result', 'pic'];

    const validateItem = (item) => {
        return requiredFields.every(field => {
            if (field === 'time') return item[field] !== undefined; // time bisa null
            return item[field] !== undefined && item[field] !== null && item[field] !== '';
        });
    };

    if ((isArray && data.some(item => !validateItem(item))) || (!isArray && !validateItem(data))) {
        return errorResponse(res, "Bad Request: Semua field wajib harus diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_area (id_list_table, id_form, code, area, shift, time, result, pic) VALUES ?'
                : 'INSERT INTO table_monitoring_area (id_list_table, id_form, code, area, shift, time, result, pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.code, item.area, item.shift, item.time, item.result, item.pic])]
                : [data.id_list_table, data.id_form, data.code, data.area, data.shift, data.time, data.result, data.pic];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data area berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data area`
    );
};

const updateArea = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        const validateItem = (item) => {
            return item.id && item.id_list_table && item.id_form && item.code &&
                item.area && item.shift && item.result && item.pic;
        };

        if ((isArray && (data.length === 0 || data.some(item => !validateItem(item)))) ||
            (!isArray && !validateItem(data))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(
                    'UPDATE table_monitoring_area SET id_list_table = ?, id_form = ?, code = ?, area = ?, shift = ?, time = ?, result = ?, pic = ? WHERE id = ?',
                    [item.id_list_table, item.id_form, item.code, item.area, item.shift, item.time, item.result, item.pic, item.id]
                )
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data area berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(
            'UPDATE table_monitoring_area SET id_list_table = ?, id_form = ?, code = ?, area = ?, shift = ?, time = ?, result = ?, pic = ? WHERE id = ?',
            [data.id_list_table, data.id_form, data.code, data.area, data.shift, data.time, data.result, data.pic, data.id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Area dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Area dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data area, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteArea = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_area WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data area yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data area berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data area"
    );
};

// const getAreaByListTable = (req, res) => {
//     const { id_list_table } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_area WHERE id_list_table = ?', [id_list_table]);
//             return successResponse(res, "Data area berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getAreaByForm = (req, res) => {
//     const { id_form } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_area WHERE id_form = ?', [id_form]);
//             return successResponse(res, "Data area berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getAreaByShift = (req, res) => {
//     const { shift } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_area WHERE shift = ?', [shift]);
//             return successResponse(res, "Data area berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

module.exports = {
    getAllArea,
    getAreaById,
    createArea,
    updateArea,
    deleteArea,
    // getAreaByListTable,
    // getAreaByForm,
    // getAreaByShift
};