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

const getAllDryingMachine = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_drying_machine');
            return successResponse(res, "Data drying machine berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getDryingMachineById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_drying_machine WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Drying machine dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data drying machine berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil drying machine ID ${id}`
    );
};

const createDryingMachine = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field wajib
    const requiredFields = ['id_list_table', 'id_form', 'parameter', 'standard', 'uom', 'result'];

    const validateItem = (item) => {
        return requiredFields.every(field => {
            return item[field] !== undefined && item[field] !== null && item[field] !== '';
        });
    };

    if ((isArray && data.some(item => !validateItem(item))) || (!isArray && !validateItem(data))) {
        return errorResponse(res, "Bad Request: Semua field wajib harus diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_drying_machine (id_list_table, id_form, parameter, standard, uom, result) VALUES ?'
                : 'INSERT INTO table_monitoring_drying_machine (id_list_table, id_form, parameter, standard, uom, result) VALUES (?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.parameter, item.standard, item.uom, item.result])]
                : [data.id_list_table, data.id_form, data.parameter, data.standard, data.uom, data.result];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data drying machine berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data drying machine`
    );
};

const updateDryingMachine = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        const validateItem = (item) => {
            return item.id && item.id_list_table && item.id_form && item.parameter &&
                item.standard && item.uom && item.result;
        };

        if ((isArray && (data.length === 0 || data.some(item => !validateItem(item)))) ||
            (!isArray && !validateItem(data))) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item =>
                connection.execute(
                    'UPDATE table_monitoring_drying_machine SET id_list_table = ?, id_form = ?, parameter = ?, standard = ?, uom = ?, result = ? WHERE id = ?',
                    [item.id_list_table, item.id_form, item.parameter, item.standard, item.uom, item.result, item.id]
                )
            ));
            await connection.commit();
            return successResponse(res, `${data.length} data drying machine berhasil diperbarui`, data);
        }

        const [result] = await connection.execute(
            'UPDATE table_monitoring_drying_machine SET id_list_table = ?, id_form = ?, parameter = ?, standard = ?, uom = ?, result = ? WHERE id = ?',
            [data.id_list_table, data.id_form, data.parameter, data.standard, data.uom, data.result, data.id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Drying machine dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Drying machine dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data drying machine, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteDryingMachine = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_drying_machine WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data drying machine yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data drying machine berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data drying machine"
    );
};

// const getDryingMachineByListTable = (req, res) => {
//     const { id_list_table } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_drying_machine WHERE id_list_table = ?', [id_list_table]);
//             return successResponse(res, "Data drying machine berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

// const getDryingMachineByForm = (req, res) => {
//     const { id_form } = req.params;

//     return handleDatabaseOperation(
//         async () => {
//             const [data] = await dbPool.query('SELECT * FROM table_monitoring_drying_machine WHERE id_form = ?', [id_form]);
//             return successResponse(res, "Data drying machine berhasil diambil", data);
//         },
//         res,
//         "Terjadi kesalahan pada server"
//     );
// };

module.exports = {
    getAllDryingMachine,
    getDryingMachineById,
    createDryingMachine,
    updateDryingMachine,
    deleteDryingMachine,
    // getDryingMachineByListTable,
    // getDryingMachineByForm
};