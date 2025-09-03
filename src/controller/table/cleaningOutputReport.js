const dbPool = require('../../config/database');
const {successResponse, errorResponse} = require('../../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllCleaningOutputReport = (req, res) => 
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT * FROM table_cleaning_output_report');
            return successResponse(res, "Data cleaning output report berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getCleaningOutputReportById = (req, res) => {
    const { id } = req.params;  
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM table_cleaning_output_report WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `Cleaning output report dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data cleaning output report berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil cleaning output report ID ${id}`
    );
};

const createCleaningOutputReport = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);
    
    // Validasi field yang wajib ada
    const requiredFields = ['id_list_table', 'id_form', 'item', 'parameter', 'standard', 'result'];
    
    if (isArray) {
        const hasInvalidItem = data.some(item => 
            requiredFields.some(field => !item.hasOwnProperty(field))
        );
        if (hasInvalidItem) {
            return errorResponse(res, "Bad Request: Field 'id_list_table', 'id_form', 'item', 'parameter', 'standard', dan 'result' wajib ada", null, 400);
        }
    } else {
        const hasInvalidField = requiredFields.some(field => !data.hasOwnProperty(field));
        if (hasInvalidField) {
            return errorResponse(res, "Bad Request: Field 'id_list_table', 'id_form', 'item', 'parameter', 'standard', dan 'result' wajib ada", null, 400);
        }
    }

    return handleDatabaseOperation(
        async () => {
            const SQLQuery = isArray 
                ? `INSERT INTO table_cleaning_output_report (
                    id_list_table, id_form, item, parameter, standard, result,
                    process_start, process_end, no_batch, process_bag, process_kg,
                    silo_beans, description
                ) VALUES ?`
                : `INSERT INTO table_cleaning_output_report (
                    id_list_table, id_form, item, parameter, standard, result,
                    process_start, process_end, no_batch, process_bag, process_kg,
                    silo_beans, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const values = isArray 
                ? [data.map(item => [
                    item.id_list_table, item.id_form, item.item, item.parameter, item.standard, item.result,
                    item.process_start || null, item.process_end || null, item.no_batch || null,
                    item.process_bag || null, item.process_kg || null, item.silo_beans || null,
                    item.description || null
                ])]
                : [
                    data.id_list_table, data.id_form, data.item, data.parameter, data.standard, data.result,
                    data.process_start || null, data.process_end || null, data.no_batch || null,
                    data.process_bag || null, data.process_kg || null, data.silo_beans || null,
                    data.description || null
                ];
            
            await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            return successResponse(res, `${isArray ? 'Beberapa' : ''} data cleaning output report berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateCleaningOutputReport = async (req, res) => {
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
                    'id_list_table', 'id_form', 'item', 'parameter', 'standard', 'result',
                    'process_start', 'process_end', 'no_batch', 'process_bag', 'process_kg',
                    'silo_beans', 'description'
                ];
                
                allowedFields.forEach(field => {
                    if (item.hasOwnProperty(field)) {
                        updateFields.push(`${field} = ?`);
                        updateValues.push(item[field]);
                    }
                });
                
                updateValues.push(item.id);
                
                return connection.execute(
                    `UPDATE table_cleaning_output_report SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} data cleaning output report berhasil diperbarui`, data);
        }

        const updateFields = [];
        const updateValues = [];
        
        const allowedFields = [
            'id_list_table', 'id_form', 'item', 'parameter', 'standard', 'result',
            'process_start', 'process_end', 'no_batch', 'process_bag', 'process_kg',
            'silo_beans', 'description'
        ];
        
        allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(data[field]);
            }
        });
        
        updateValues.push(data.id);
        
        const [result] = await connection.execute(
            `UPDATE table_cleaning_output_report SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `Cleaning output report dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found" 
            ? `Cleaning output report dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteCleaningOutputReport = async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM table_cleaning_output_report WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data cleaning output report berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllCleaningOutputReport,
    getCleaningOutputReportById,
    createCleaningOutputReport,
    updateCleaningOutputReport,
    deleteCleaningOutputReport
};