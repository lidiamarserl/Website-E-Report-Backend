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

const getAllCocoaRecord = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_cocoa_record');
            return successResponse(res, "Data cocoa record berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getCocoaRecordById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_cocoa_record WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Cocoa record dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data cocoa record berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil cocoa record ID ${id}`
    );
};

const createCocoaRecord = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // Validasi field yang wajib ada
    const requiredFields = ['id_list_table', 'id_form', 'no', 'product_type', 'packing_code'];

    if (isArray) {
        const hasInvalidItem = data.some(item =>
            requiredFields.some(field => !item.hasOwnProperty(field))
        );
        if (hasInvalidItem) {
            return errorResponse(res, "Bad Request: Field 'id_list_table', 'id_form', 'no', 'product_type', dan 'packing_code' wajib ada", null, 400);
        }
    } else {
        const hasInvalidField = requiredFields.some(field => !data.hasOwnProperty(field));
        if (hasInvalidField) {
            return errorResponse(res, "Bad Request: Field 'id_list_table', 'id_form', 'no', 'product_type', dan 'packing_code' wajib ada", null, 400);
        }
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? `INSERT INTO table_cocoa_record (
                    id_list_table, id_form, no, product_type, packing_code,
                    time_start, time_end, quantity1, quantity2, mx, cs, fh, description
                ) VALUES ?`
                : `INSERT INTO table_cocoa_record (
                    id_list_table, id_form, no, product_type, packing_code,
                    time_start, time_end, quantity1, quantity2, mx, cs, fh, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = isArray
                ? [data.map(item => [
                    item.id_list_table ? parseInt(item.id_list_table, 10) : null,
                     item.id_form ? parseInt(item.id_form, 10) : null,
                     item.no ? parseInt(item.no, 10) : null,
                     item.product_type,
                     item.packing_code,

                    item.time_start || null,
                     item.time_end || null,
                     item.quantity1 || null,

                    item.quantity2 || null,
                     item.mx || null,
                     item.cs || null,
                     item.fh || null,

                    item.description || null
                ])]
                : [
                    data.id_list_table, data.id_form, data.no, data.product_type, data.packing_code,
                    data.time_start || null, data.time_end || null, data.quantity1 || null,
                    data.quantity2 || null, data.mx || null, data.cs || null, data.fh || null,
                    data.description || null
                ];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data cocoa record berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateCocoaRecord = async (req, res) => {
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
                    'id_list_table', 'id_form', 'no', 'product_type', 'packing_code',
                    'time_start', 'time_end', 'quantity1', 'quantity2', 'mx', 'cs', 'fh', 'description'
                ];

                allowedFields.forEach(field => {
                    if (item.hasOwnProperty(field)) {
                        updateFields.push(`${field} = ?`);
                        updateValues.push(item[field]);
                    }
                });

                updateValues.push(item.id);

                return connection.execute(
                    `UPDATE table_cocoa_record SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data cocoa record berhasil diperbarui`, data);
        }

        const updateFields = [];
        const updateValues = [];

        const allowedFields = [
            'id_list_table', 'id_form', 'no', 'product_type', 'packing_code',
            'time_start', 'time_end', 'quantity1', 'quantity2', 'mx', 'cs', 'fh', 'description'
        ];

        allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(data[field]);
            }
        });

        updateValues.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_cocoa_record SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Cocoa record dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Cocoa record dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteCocoaRecord = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_cocoa_record WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data cocoa record berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllCocoaRecord,
    getCocoaRecordById,
    createCocoaRecord,
    updateCocoaRecord,
    deleteCocoaRecord
};