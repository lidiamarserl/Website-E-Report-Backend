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

const getAllPressureFilter = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_pressure_filter_duyvis');
            return successResponse(res, "Data pressure filter duyvis berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getPressureFilterById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_pressure_filter_duyvis WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Pressure filter duyvis dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data pressure filter duyvis berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil pressure filter duyvis ID ${id}`
    );
};

const createPressureFilter = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field wajib
    const requiredFields = ['id_list_table', 'id_form', 'minutes', 'p1', 'p2'];

    const validateItem = (item) => {
        return requiredFields.every(field => {
            return item[field] !== undefined && item[field] !== null && item[field] !== '';
        });
    };

    if ((isArray && data.some(item => !validateItem(item))) || (!isArray && !validateItem(data))) {
        return errorResponse(res, "Bad Request: Field id_list_table, id_form, minutes, p1, dan p2 wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_pressure_filter_duyvis (id_list_table, id_form, minutes, p1, p2) VALUES ?'
                : 'INSERT INTO table_monitoring_pressure_filter_duyvis (id_list_table, id_form, minutes, p1, p2) VALUES (?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.minutes, item.p1, item.p2])]
                : [data.id_list_table, data.id_form, data.minutes, data.p1, data.p2];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data pressure filter duyvis berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data pressure filter duyvis`
    );
};

const updatePressureFilter = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        const validateItem = (item) => {
            return item.id && item.id_list_table && item.id_form &&
                item.minutes !== undefined && item.p1 !== undefined && item.p2 !== undefined;
        };

        if ((isArray && (data.length === 0 || data.some(item => !validateItem(item)))) ||
            (!isArray && !validateItem(data))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(
                    'UPDATE table_monitoring_pressure_filter_duyvis SET id_list_table = ?, id_form = ?, minutes = ?, p1 = ?, p2 = ? WHERE id = ?',
                    [item.id_list_table, item.id_form, item.minutes, item.p1, item.p2, item.id]
                )
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data pressure filter duyvis berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(
            'UPDATE table_monitoring_pressure_filter_duyvis SET id_list_table = ?, id_form = ?, minutes = ?, p1 = ?, p2 = ? WHERE id = ?',
            [data.id_list_table, data.id_form, data.minutes, data.p1, data.p2, data.id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Pressure filter duyvis dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Pressure filter duyvis dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data pressure filter duyvis, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deletePressureFilter = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_pressure_filter_duyvis WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data pressure filter duyvis yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data pressure filter duyvis berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data pressure filter duyvis"
    );
};

// const getPressureFilterByListTable = (req, res) => {
//     const { id_list_table } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_pressure_filter_duyvis WHERE id_list_table = ?', [id_list_table]);
//             return successResponse(res, "Data pressure filter duyvis berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getPressureFilterByForm = (req, res) => {
//     const { id_form } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_pressure_filter_duyvis WHERE id_form = ?', [id_form]);
//             return successResponse(res, "Data pressure filter duyvis berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getPressureFilterByMinutes = (req, res) => {
//     const { minutes } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_pressure_filter_duyvis WHERE minutes = ?', [minutes]);
//             return successResponse(res, "Data pressure filter duyvis berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

module.exports = {
    getAllPressureFilter,
    getPressureFilterById,
    createPressureFilter,
    updatePressureFilter,
    deletePressureFilter,
    // getPressureFilterByListTable,
    // getPressureFilterByForm,
    // getPressureFilterByMinutes
};