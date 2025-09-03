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

const getAllRoastingSection = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_roasting_section');
            return successResponse(res, "Data roasting section berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getRoastingSectionById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_roasting_section WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Roasting section dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data roasting section berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil roasting section ID ${id}`
    );
};

const createRoastingSection = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'scale', 'part', 'standard', 'batch_no', 'nibs_transfer'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray
                ? 'INSERT INTO table_roasting_section (id_list_table, id_form, scale, part, standard, batch_no, nibs_transfer) VALUES ?'
                : 'INSERT INTO table_roasting_section (id_list_table, id_form, scale, part, standard, batch_no, nibs_transfer) VALUES (?, ?, ?, ?, ?, ?, ?)';

            const values = isArray
                ? [data.map(item => [item.id_list_table, item.id_form, item.scale, item.part, item.standard, item.batch_no, item.nibs_transfer])]
                : [data.id_list_table, data.id_form, data.scale, data.part, data.standard, data.batch_no, data.nibs_transfer];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data roasting section berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateRoastingSection = async (req, res) => {
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
                if (item.scale) { fields.push('scale = ?'); values.push(item.scale); }
                if (item.part) { fields.push('part = ?'); values.push(item.part); }
                if (item.standard) { fields.push('standard = ?'); values.push(item.standard); }
                if (item.batch_no !== undefined) { fields.push('batch_no = ?'); values.push(item.batch_no); }
                if (item.nibs_transfer !== undefined) { fields.push('nibs_transfer = ?'); values.push(item.nibs_transfer); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE table_roasting_section SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data roasting section berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
        if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
        if (data.scale) { fields.push('scale = ?'); values.push(data.scale); }
        if (data.part) { fields.push('part = ?'); values.push(data.part); }
        if (data.standard) { fields.push('standard = ?'); values.push(data.standard); }
        if (data.batch_no !== undefined) { fields.push('batch_no = ?'); values.push(data.batch_no); }
        if (data.nibs_transfer !== undefined) { fields.push('nibs_transfer = ?'); values.push(data.nibs_transfer); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE table_roasting_section SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Data roasting section dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Data roasting section dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteRoastingSection = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_roasting_section WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data roasting section berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllRoastingSection,
    getRoastingSectionById,
    createRoastingSection,
    updateRoastingSection,
    deleteRoastingSection
};