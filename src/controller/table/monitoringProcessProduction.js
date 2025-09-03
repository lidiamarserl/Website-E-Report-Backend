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

const getAllProductionProcesses = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_monitoring_process_production');
            return successResponse(res, "Data proses produksi berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getProductionProcessById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_monitoring_process_production WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Proses produksi dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data proses produksi berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil proses produksi ID ${id}`
    );
};

const createProductionProcess = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'product_type', 'batch_code', 'packing_code', 'no_silo_tank', 'qty_bag', 'qty_kg', 'fia'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_monitoring_process_production (id_list_table, id_form, product_type, batch_code, packing_code, no_silo_tank, qty_bag, qty_kg, fia) VALUES ?'
                : 'INSERT INTO table_monitoring_process_production (id_list_table, id_form, product_type, batch_code, packing_code, no_silo_tank, qty_bag, qty_kg, fia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.product_type, item.batch_code, item.packing_code, item.no_silo_tank, item.qty_bag, item.qty_kg, item.fia])]
                : [data.id_list_table, data.id_form, data.product_type, data.batch_code, data.packing_code, data.no_silo_tank, data.qty_bag, data.qty_kg, data.fia];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data proses produksi berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateProductionProcess = async (req, res) => {
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

                if (item.id_list_table) { fields.push('id_list_table = ?'); values.push(item.id_list_table); }
                if (item.id_form) { fields.push('id_form = ?'); values.push(item.id_form); }
                if (item.product_type) { fields.push('product_type = ?'); values.push(item.product_type); }
                if (item.batch_code) { fields.push('batch_code = ?'); values.push(item.batch_code); }
                if (item.packing_code) { fields.push('packing_code = ?'); values.push(item.packing_code); }
                if (item.no_silo_tank) { fields.push('no_silo_tank = ?'); values.push(item.no_silo_tank); }
                if (item.qty_bag) { fields.push('qty_bag = ?'); values.push(item.qty_bag); }
                if (item.qty_kg) { fields.push('qty_kg = ?'); values.push(item.qty_kg); }
                if (item.fia) { fields.push('fia = ?'); values.push(item.fia); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_monitoring_process_production SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data proses produksi berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.product_type) { fields.push('product_type = ?'); values.push(data.product_type); }
        if (data.batch_code) { fields.push('batch_code = ?'); values.push(data.batch_code); }
        if (data.packing_code) { fields.push('packing_code = ?'); values.push(data.packing_code); }
        if (data.no_silo_tank) { fields.push('no_silo_tank = ?'); values.push(data.no_silo_tank); }
        if (data.qty_bag) { fields.push('qty_bag = ?'); values.push(data.qty_bag); }
        if (data.qty_kg) { fields.push('qty_kg = ?'); values.push(data.qty_kg); }
        if (data.fia) { fields.push('fia = ?'); values.push(data.fia); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_monitoring_process_production SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data proses produksi dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data proses produksi dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteProductionProcess = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_monitoring_process_production WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data proses produksi berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllProductionProcesses,
    getProductionProcessById,
    createProductionProcess,
    updateProductionProcess,
    deleteProductionProcess
};