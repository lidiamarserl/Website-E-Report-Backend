const dbPool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error.message);
    }
};

const getAllForms = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query(`
                    SELECT f.*, lf.name as list_form_name 
                    FROM form f 
                    LEFT JOIN list_form lf ON f.id_list_form = lf.id
                `);
            return successResponse(res, "Data form berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );


const getFormById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT * FROM form WHERE id = ?', [id]);
            if (data.length === 0){
                return errorResponse(res, `Form dengan ID ${id} tidak ditemukan`, null, 404);
            }

            return successResponse(res, "Data form berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil form ID ${id}`


    );
};

const createForm = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    // const requiredFields = ['id_list_form', 'id_report', 'date_created', 'date_modified', 'shift', 'group', 'location'];

    // if ((isArray && data.some(item => requiredFields.some(field => !item[field] && item[field] !== 0))) ||
    //     (!isArray && requiredFields.some(field => !data[field]))) {
    //     const errorMessage = `Bad Request: Field berikut wajib diisi: ${requiredFields.join(', ')}`;
    //     return errorResponse(res, errorMessage, null, 400);
    // }

    return handleDatabaseOperation(
        async () => {
            const fields = '(`id_list_form`, `id_report`, `date_created`, `date_modified`, `shift`, `group`, `location`, `product_type`, `line`, `nett_weight`, `batch_code`, `SN`, `model`, `created_by`, `released_by`, `checked_by`, `approved_by`, `comment`, `note`, `released_date`, `checked_date`, `approved_date`, `row`)';

            const SQLQuery = isArray
                ? `INSERT INTO form ${fields} VALUES ?`
                : `INSERT INTO form ${fields} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const mapItem = item => [
                item.id_list_form ? parseInt(item.id_list_form, 10) : null,
                item.id_report ? parseInt(item.id_report, 10) : null,
                item.date_created || null,
                item.date_modified || null,
                item.shift || null,
                item.group || null,
                item.location || null,
                item.product_type || null,
                item.line || null,
                item.nett_weight || null,
                item.batch_code || null,
                item.SN || null,
                item.model || null,
                item.created_by ? parseInt(item.created_by, 10) : null,
                item.released_by ? parseInt(item.released_by, 10) : null,
                item.checked_by ? parseInt(item.checked_by, 10) : null,
                item.approved_by ? parseInt(item.approved_by, 10) : null,
                item.comment || null,
                item.note || null,
                item.released_date || null,
                item.checked_date || null,
                item.approved_date || null,
                item.row  ? parseInt(item.row, 10) : null,

           ];
            const values = isArray ? [data.map(mapItem)] : mapItem(data);

            const [result] = await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
            
            const createdData = isArray 
                ? data.map((item, index) => ({ ...item, id: result.insertId + index })) 
                : { ...data, id: result.insertId };

            return successResponse(res, `${isArray ? 'Beberapa' : ''} form baru berhasil dibuat`, createdData, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data`
    );
};

const updateSingleForm = async (req, res) => {
    const { id } = req.params; 
    const dataToUpdate = req.body; 

    if (Object.keys(dataToUpdate).length === 0) {
        return errorResponse(res, "Request body tidak boleh kosong.", null, 400);
    }
    
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const allowedFields = ['released_by', 'checked_by', 'approved_by', 'shift', 'group', 'released_date', 'checked_date', 'approved_date'];
        const updateFields = [];
        const updateValues = [];

        allowedFields.forEach(field => {
            if (dataToUpdate.hasOwnProperty(field)) {
                updateFields.push(`\`${field}\` = ?`);
                updateValues.push(dataToUpdate[field]);
            }
        });

        if (updateFields.length === 0) {
            throw new Error("Tidak ada field valid yang dikirim untuk diupdate.");
        }

        updateValues.push(id);
        const SQLQuery = `UPDATE form SET ${updateFields.join(', ')} WHERE id = ?`;
        
        const [result] = await connection.execute(SQLQuery, updateValues);

        if (result.affectedRows === 0) {
            throw new Error(`Not found`);
        }

        await connection.commit();
        return successResponse(res, `Form dengan ID ${id} berhasil diperbarui`, dataToUpdate);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `Form dengan ID ${id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        const statusCode = error.message === "Not found" ? 404 : 500;
        return errorResponse(res, errorMsg, error.message, statusCode);
    } finally {
        connection.release();
    }
};

const updateMultipleForms = async (req, res) => {
    const data = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
        return errorResponse(res, "Input harus berupa array dan tidak boleh kosong.", null, 400);
    }
    if (data.some(item => !item.id)) {
        return errorResponse(res, "Setiap item dalam array harus memiliki 'id'.", null, 400);
    }

    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        await Promise.all(data.map(item => {
            const itemData = { ...item };
            const id = parseInt(itemData.id, 10);
            delete itemData.id;

            const fields = Object.keys(itemData);
            if(fields.length === 0) return;

            const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
            const values = fields.map(field => itemData[field]);
            values.push(id);

            return connection.execute(`UPDATE form SET ${setClause} WHERE id = ?`, values);
        }));
        
        await connection.commit();
        return successResponse(res, `${data.length} data form berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        return errorResponse(res, "Gagal memperbarui data, semua perubahan dibatalkan", error.message, 500);
    } finally {
        connection.release();
    }
};

const updateForm = async (req, res) => {
    const data = req.body;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();
        const isArray = Array.isArray(data);

        if ((isArray && (data.length === 0 || data.some(item => !item.id))) ||
            (!isArray && !data.id)) {
            return errorResponse(res, "Invalid input: Each item must have an 'id'", null, 400);
        }

        if (isArray) {
            await Promise.all(data.map(item => {
                const itemData = { ...item };
                const id = parseInt(itemData.id, 10);
                delete itemData.id; 

                const fields = Object.keys(itemData);
                if(fields.length === 0) return; 

                const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
                const values = fields.map(field => itemData[field]);
                values.push(id);
                return connection.execute(`UPDATE form SET ${setClause} WHERE id = ?`, values);
            }));
        } else {
            const dataToUpdate = { ...data };
            const id = parseInt(dataToUpdate.id, 10);
            delete dataToUpdate.id; 

            const fields = Object.keys(dataToUpdate);
            if(fields.length === 0) {
                 return successResponse(res, `Tidak ada field yang diubah untuk form ID ${id}`, data);
            }

            const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
            const values = fields.map(field => dataToUpdate[field]);
            values.push(id);
            const [result] = await connection.execute(`UPDATE form SET ${setClause} WHERE id = ?`, values);
            if (result.affectedRows === 0) { throw new Error("Not found"); }
        }
        await connection.commit();
        return successResponse(res, `Data form berhasil diperbarui`, data);
    } catch (error) {
        await connection.rollback();
        console.error(error);
        const errorMsg = error.message === "Not found"
            ? `Form dengan ID ${Array.isArray(data) ? 'salah satu' : data.id} tidak ditemukan`
            : "Gagal memperbarui data, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error.message, error.message === "Not found" ? 404 : 500);
    } finally {
        connection.release();
    }
};



const deleteForm = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    const intIds = ids.map(id => parseInt(id, 10));


    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM form WHERE id IN (?)', [intIds]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada data yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} data form berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus data"
    );
};

module.exports = {
    getAllForms,
    getFormById,
    createForm,
    
    deleteForm,
    updateSingleForm,
    updateMultipleForms,
    updateForm,
};