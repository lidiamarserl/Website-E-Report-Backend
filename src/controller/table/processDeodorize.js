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

const getAllProcessDeodorize = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_process_deodorize');
            return successResponse(res, "Data process deodorize berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getProcessDeodorizeById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_process_deodorize WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Process deodorize dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data process deodorize berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil process deodorize ID ${id}`
    );
};

const createProcessDeodorize = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'no', 'product_type', 'butter_tank_no', 'butter_tank_ffa', 'capacity', 'code', 'temperature', 'sparging', 'ffa_deo', 'moisture', 'deo_butter_tank', 'deo_butter_quantity', 'deo_butter_ffa'];

    if ((isArray && data.some(item => requiredFields.some(field => item[field] === undefined || item[field] === null))) ||
        (!isArray && requiredFields.some(field => data[field] === undefined || data[field] === null))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_process_deodorize (id_list_table, id_form, no, product_type, butter_tank_no, butter_tank_ffa, capacity, code, temperature, sparging, ffa_deo, moisture, deo_butter_tank, deo_butter_quantity, deo_butter_ffa) VALUES ?'
                : 'INSERT INTO table_process_deodorize (id_list_table, id_form, no, product_type, butter_tank_no, butter_tank_ffa, capacity, code, temperature, sparging, ffa_deo, moisture, deo_butter_tank, deo_butter_quantity, deo_butter_ffa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.no, item.product_type, item.butter_tank_no, item.butter_tank_ffa, item.capacity, item.code, item.temperature, item.sparging, item.ffa_deo, item.moisture, item.deo_butter_tank, item.deo_butter_quantity, item.deo_butter_ffa])]
                : [data.id_list_table, data.id_form, data.no, data.product_type, data.butter_tank_no, data.butter_tank_ffa, data.capacity, data.code, data.temperature, data.sparging, data.ffa_deo, data.moisture, data.deo_butter_tank, data.deo_butter_quantity, data.deo_butter_ffa];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data process deodorize berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateProcessDeodorize = async (req, res) => {
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
                const fields = [];
                const values = [];

                if (item.id_list_table !== undefined) { fields.push('id_list_table = ?'); values.push(item.id_list_table); }
                if (item.id_form !== undefined) { fields.push('id_form = ?'); values.push(item.id_form); }
                if (item.no !== undefined) { fields.push('no = ?'); values.push(item.no); }
                if (item.product_type !== undefined) { fields.push('product_type = ?'); values.push(item.product_type); }
                if (item.butter_tank_no !== undefined) { fields.push('butter_tank_no = ?'); values.push(item.butter_tank_no); }
                if (item.butter_tank_ffa !== undefined) { fields.push('butter_tank_ffa = ?'); values.push(item.butter_tank_ffa); }
                if (item.capacity !== undefined) { fields.push('capacity = ?'); values.push(item.capacity); }
                if (item.code !== undefined) { fields.push('code = ?'); values.push(item.code); }
                if (item.temperature !== undefined) { fields.push('temperature = ?'); values.push(item.temperature); }
                if (item.sparging !== undefined) { fields.push('sparging = ?'); values.push(item.sparging); }
                if (item.ffa_deo !== undefined) { fields.push('ffa_deo = ?'); values.push(item.ffa_deo); }
                if (item.moisture !== undefined) { fields.push('moisture = ?'); values.push(item.moisture); }
                if (item.deo_butter_tank !== undefined) { fields.push('deo_butter_tank = ?'); values.push(item.deo_butter_tank); }
                if (item.deo_butter_quantity !== undefined) { fields.push('deo_butter_quantity = ?'); values.push(item.deo_butter_quantity); }
                if (item.deo_butter_ffa !== undefined) { fields.push('deo_butter_ffa = ?'); values.push(item.deo_butter_ffa); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_process_deodorize SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data process deodorize berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table !== undefined) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form !== undefined) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.no !== undefined) { fields.push('no = ?'); values.push(data.no); }
        if (data.product_type !== undefined) { fields.push('product_type = ?'); values.push(data.product_type); }
        if (data.butter_tank_no !== undefined) { fields.push('butter_tank_no = ?'); values.push(data.butter_tank_no); }
        if (data.butter_tank_ffa !== undefined) { fields.push('butter_tank_ffa = ?'); values.push(data.butter_tank_ffa); }
        if (data.capacity !== undefined) { fields.push('capacity = ?'); values.push(data.capacity); }
        if (data.code !== undefined) { fields.push('code = ?'); values.push(data.code); }
        if (data.temperature !== undefined) { fields.push('temperature = ?'); values.push(data.temperature); }
        if (data.sparging !== undefined) { fields.push('sparging = ?'); values.push(data.sparging); }
        if (data.ffa_deo !== undefined) { fields.push('ffa_deo = ?'); values.push(data.ffa_deo); }
        if (data.moisture !== undefined) { fields.push('moisture = ?'); values.push(data.moisture); }
        if (data.deo_butter_tank !== undefined) { fields.push('deo_butter_tank = ?'); values.push(data.deo_butter_tank); }
        if (data.deo_butter_quantity !== undefined) { fields.push('deo_butter_quantity = ?'); values.push(data.deo_butter_quantity); }
        if (data.deo_butter_ffa !== undefined) { fields.push('deo_butter_ffa = ?'); values.push(data.deo_butter_ffa); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_process_deodorize SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data process deodorize dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data process deodorize dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteProcessDeodorize = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_process_deodorize WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data process deodorize berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllProcessDeodorize,
    getProcessDeodorizeById,
    createProcessDeodorize,
    updateProcessDeodorize,
    deleteProcessDeodorize
}