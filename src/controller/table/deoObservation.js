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

const getAllDeoObservation = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_deo_observation');
            return successResponse(res, "Data deo observation berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getDeoObservationById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_deo_observation WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Deo observation dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data deo observation berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil deo observation ID ${id}`
    );
};

const createDeoObservation = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field yang wajib ada
    const requiredFields = ['id_list_table', 'id_form', 'code', 'nomor_item', 'item', 'nomor_parameter', 'parameter'];

    if (isArray) {
        const hasInvalidItem = data.some(item =>
            requiredFields.some(field => !item.hasOwnProperty(field))
        );
        if (hasInvalidItem) {
            return errorResponse(res, "Bad Request: Field 'id_list_table', 'id_form', 'code', 'nomor_item', 'item', 'nomor_parameter', dan 'parameter' wajib ada", null, 400);
        }
    } else {
        const hasInvalidField = requiredFields.some(field => !data.hasOwnProperty(field));
        if (hasInvalidField) {
            return errorResponse(res, "Bad Request: Field 'id_list_table', 'id_form', 'code', 'nomor_item', 'item', 'nomor_parameter', dan 'parameter' wajib ada", null, 400);
        }
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? `INSERT INTO table_deo_observation (
                    id_list_table, id_form, code, nomor_item, item, nomor_parameter,
                    parameter, standard, uom, shift, time, value, pic
                ) VALUES ?`
                : `INSERT INTO table_deo_observation (
                    id_list_table, id_form, code, nomor_item, item, nomor_parameter,
                    parameter, standard, uom, shift, time, value, pic
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = isArray
                ? [data.map(item => [
                    item.id_list_table, item.id_form, item.code, item.nomor_item, item.item,
                    item.nomor_parameter, item.parameter, item.standard || null, item.uom || null,
                    item.shift || null, item.time || null, item.value || null, item.pic || null
                ])]
                : [
                    data.id_list_table, data.id_form, data.code, data.nomor_item, data.item,
                    data.nomor_parameter, data.parameter, data.standard || null, data.uom || null,
                    data.shift || null, data.time || null, data.value || null, data.pic || null
                ];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data deo observation berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateDeoObservation = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            throw new Error("Invalid input data");
        }

        if (isArray) {
            await Promise.all(data.map(item => {
                const updateFields = [];
                const updateValues = [];

                // Daftar field yang bisa diupdate
                const allowedFields = [
                    'id_list_table', 'id_form', 'code', 'nomor_item', 'item', 'nomor_parameter',
                    'parameter', 'standard', 'uom', 'shift', 'time', 'value', 'pic'
                ];

                allowedFields.forEach(field => {
                    if (item.hasOwnProperty(field)) {
                        updateFields.push(`${field} = ?`);
                        updateValues.push(item[field]);
                    }
                });

                updateValues.push(item.id);

                return connection.execute(
                    `UPDATE table_deo_observation SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data deo observation berhasil diperbarui`, data);
        }

        const updateFields = [];
        const updateValues = [];

        const allowedFields = [
            'id_list_table', 'id_form', 'code', 'nomor_item', 'item', 'nomor_parameter',
            'parameter', 'standard', 'uom', 'shift', 'time', 'value', 'pic'
        ];

        allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(data[field]);
            }
        });

        updateValues.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_deo_observation SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Deo observation dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Deo observation dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteDeoObservation = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_deo_observation WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data deo observation berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllDeoObservation,
    getDeoObservationById,
    createDeoObservation,
    updateDeoObservation,
    deleteDeoObservation
};