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

const getAllMetalCatcher = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_metal_catcher');
            return successResponse(res, "Data metal catcher berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getMetalCatcherById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_metal_catcher WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Metal catcher dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data metal catcher berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil metal catcher ID ${id}`
    );
};

const createMetalCatcher = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field wajib
    const requiredFields = ['id_list_table', 'id_form', 'parameter', 'condition', 'pic'];

    const validateItem = (item) => {
        return requiredFields.every(field => {
            return item[field] !== undefined && item[field] !== null && item[field] !== '';
        });
    };

    if ((isArray && data.some(item => !validateItem(item))) || (!isArray && !validateItem(data))) {
        return errorResponse(res, "Bad Request: Field id_list_table, id_form, parameter, condition, dan pic wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_metal_catcher (id_list_table, id_form, date, parameter, condition, pic) VALUES ?'
                : 'INSERT INTO table_monitoring_metal_catcher (id_list_table, id_form, date, parameter, condition, pic) VALUES (?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.date || null, item.parameter, item.condition, item.pic])]
                : [data.id_list_table, data.id_form, data.date || null, data.parameter, data.condition, data.pic];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data metal catcher berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data metal catcher`
    );
};

const updateMetalCatcher = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        const validateItem = (item) => {
            return item.id && item.id_list_table && item.id_form && item.parameter &&
                item.condition && item.pic;
        };

        if ((isArray && (data.length === 0 || data.some(item => !validateItem(item)))) ||
            (!isArray && !validateItem(data))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(
                    'UPDATE table_monitoring_metal_catcher SET id_list_table = ?, id_form = ?, date = ?, parameter = ?, condition = ?, pic = ? WHERE id = ?',
                    [item.id_list_table, item.id_form, item.date || null, item.parameter, item.condition, item.pic, item.id]
                )
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data metal catcher berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(
            'UPDATE table_monitoring_metal_catcher SET id_list_table = ?, id_form = ?, date = ?, parameter = ?, condition = ?, pic = ? WHERE id = ?',
            [data.id_list_table, data.id_form, data.date || null, data.parameter, data.condition, data.pic, data.id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Metal catcher dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Metal catcher dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data metal catcher, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteMetalCatcher = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_metal_catcher WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data metal catcher yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data metal catcher berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data metal catcher"
    );
};

// const getMetalCatcherByListTable = (req, res) => {
//     const { id_list_table } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_metal_catcher WHERE id_list_table = ?', [id_list_table]);
//             return successResponse(res, "Data metal catcher berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getMetalCatcherByForm = (req, res) => {
//     const { id_form } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_metal_catcher WHERE id_form = ?', [id_form]);
//             return successResponse(res, "Data metal catcher berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getMetalCatcherByDate = (req, res) => {
//     const { date } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_metal_catcher WHERE DATE(date) = ?', [date]);
//             return successResponse(res, "Data metal catcher berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

module.exports = {
    getAllMetalCatcher,
    getMetalCatcherById,
    createMetalCatcher,
    updateMetalCatcher,
    deleteMetalCatcher,
    // getMetalCatcherByListTable,
    // getMetalCatcherByForm,
    // getMetalCatcherByDate
};