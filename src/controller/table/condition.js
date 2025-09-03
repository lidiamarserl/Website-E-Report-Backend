const dbPool = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Helper function to handle database operations and catch errors.
 * @param {Function} operation - The async database operation to execute.
 * @param {object} res - The response object from Express.
 * @param {string} errorMsg - The generic error message to send on failure.
 * @returns {Promise<any>}
 */
const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        return await operation();
    } catch (error) {
        console.error(error); 
        return errorResponse(res, errorMsg, error);
    }
};

const getAllConditions = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_condistion');
            return successResponse(res, "Data condition berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server saat mengambil semua data condition"
    );

const getConditionById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_condistion WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Condition dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data condition berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil condition ID ${id}`
    );
};

const createCondition = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['id_list_table', 'id_form', 'variable', 'condition', 'description'];

    const validateItem = item => requiredFields.every(field => item.hasOwnProperty(field));

    if ((isArray && data.some(item => !validateItem(item))) || (!isArray && !validateItem(data))) {
        return errorResponse(res, `Bad Request: Field '${requiredFields.join("', '")}' wajib ada`, null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const fields = 'id_list_table, id_form, variable, `condition`, description';
            const SQLQuery = isArray
                ? `INSERT INTO table_condistion (${fields}) VALUES ?`
                : `INSERT INTO table_condistion (${fields}) VALUES (?, ?, ?, ?, ?)`;

            const values = isArray
                ? [data.map(item => [
                    item.id_list_table,
                    item.id_form,
                    item.variable,
                    item.condition,
                    item.description
                ])]
                : [
                    data.id_list_table,
                    data.id_form,
                    data.variable,
                    data.condition,
                    data.description
                ];

            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa data' : 'Data'} condition berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data condition`
    );
};

// UPDATE condition(s)
const updateCondition = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);
    
    if ((isArray && (data.length === 0 || data.some(item => !item.id))) || (!isArray && !data.id)) {
        return errorResponse(res, "Bad Request: Data input tidak valid, ID wajib ada.", null, 400);
    }
    
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const updateItem = async (item) => {
            const updateFields = [];
            const updateValues = [];
            
            const allowedFields = ['id_list_table', 'id_form', 'variable', 'condition', 'description'];

            allowedFields.forEach(field => {
                if (item.hasOwnProperty(field)) {
                    const fieldName = field === 'condition' ? '`condition`' : field;
                    updateFields.push(`${fieldName} = ?`);
                    updateValues.push(item[field]);
                }
            });

            if (updateFields.length === 0) {
                return; 
            }

            updateValues.push(item.id);
            const [result] = await connection.execute(
                `UPDATE table_condistion SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            if (result.affectedRows === 0) {
                throw new Error(`Not found: ID ${item.id}`);
            }
        };

        if (isArray) {
            await Promise.all(data.map(updateItem));
        } else {
            await updateItem(data);
        }

        await connection.commit();
        return successResponse(res, `Data condition berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message.startsWith("Not found")
            ? `Gagal memperbarui: Salah satu ID tidak ditemukan. Perubahan dibatalkan.`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message.startsWith("Not found") ? 404 : 400);
    } finally {
        connection.release();
    }
};

// DELETE condition(s)
const deleteCondition = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_condistion WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data condition berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data condition"
    );
};

module.exports = {
    getAllConditions,
    getConditionById,
    createCondition,
    updateCondition,
    deleteCondition
};