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

    const getAllWorkinProcess = (req, res) => 
        handleDatabaseOperation(
            async () => {
                const [data] = await dbPool.query('SELECT * FROM table_workin_process');
                return successResponse(res, "Data workin process berhasil diambil", data);
            },
            res,
            "Terjadi kesalahan pada server"
        );

    const getWorkinProcessById = (req, res) => {
        const { id } = req.params;
        return handleDatabaseOperation(
            async () => {
                const [data] = await dbPool.execute('SELECT * FROM table_workin_process WHERE id = ?', [id]);
                if (data.length === 0) {
                    return errorResponse(res, `Workin process dengan ID ${id} tidak ditemukan`, null, 404);
                }
                return successResponse(res, "Data workin process berhasil diambil", data[0]);
            },
            res,
            `Terjadi kesalahan pada server saat mengambil workin process ID ${id}`
        );
    };

    const createWorkinProcess = async (req, res) => {
        const data = req.body;
        const isArray = Array.isArray(data);
        
        const requiredFields = ['id_list_table', 'id_form', 'no', 'line', 'batch', 'product_type', 'wip', 'filling'];
        
        if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) || 
            (!isArray && requiredFields.some(field => !data[field]))) {
            return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
        }

        return handleDatabaseOperation(
            async () => {
                const SQLQuery = isArray 
                    ? 'INSERT INTO table_workin_process (id_list_table, id_form, no, line, batch, product_type, wip, filling) VALUES ?'
                    : 'INSERT INTO table_workin_process (id_list_table, id_form, no, line, batch, product_type, wip, filling) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                
                const values = isArray 
                    ? [data.map(item => [item.id_list_table, item.id_form, item.no, item.line, item.batch, item.product_type, item.wip, item.filling])]
                    : [data.id_list_table, data.id_form, data.no, data.line, data.batch, data.product_type, data.wip, data.filling];
                
                await (isArray ? dbPool.query(SQLQuery, values) : dbPool.execute(SQLQuery, values));
                return successResponse(res, `${isArray ? 'Beberapa' : ''} data workin process berhasil dibuat`, data, 201);
            },
            res,
            `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}data workin process`
        );
    };

    const updateWorkinProcess = async (req, res) => {
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
                    if (item.no) { fields.push('no = ?'); values.push(item.no); }
                    if (item.line) { fields.push('line = ?'); values.push(item.line); }
                    if (item.batch) { fields.push('batch = ?'); values.push(item.batch); }
                    if (item.product_type) { fields.push('product_type = ?'); values.push(item.product_type); }
                    if (item.wip !== undefined) { fields.push('wip = ?'); values.push(item.wip); }
                    if (item.filling) { fields.push('filling = ?'); values.push(item.filling); }
                    
                    values.push(item.id);
                    
                    return connection.execute(
                        `UPDATE table_workin_process SET ${fields.join(', ')} WHERE id = ?`,
                        values
                    );
                }));
                await connection.commit();
                return successResponse(res, `${data.length} data workin process berhasil diperbarui`, data);
            }

            const fields = [];
            const values = [];
            
            if (data.id_list_table) { fields.push('id_list_table = ?'); values.push(data.id_list_table); }
            if (data.id_form) { fields.push('id_form = ?'); values.push(data.id_form); }
            if (data.no) { fields.push('no = ?'); values.push(data.no); }
            if (data.line) { fields.push('line = ?'); values.push(data.line); }
            if (data.batch) { fields.push('batch = ?'); values.push(data.batch); }
            if (data.product_type) { fields.push('product_type = ?'); values.push(data.product_type); }
            if (data.wip !== undefined) { fields.push('wip = ?'); values.push(data.wip); }
            if (data.filling) { fields.push('filling = ?'); values.push(data.filling); }
            
            values.push(data.id);

            const [result] = await connection.execute(
                `UPDATE table_workin_process SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            if (result.affectedRows === 0) {
                throw new Error("Not found");
            }

            await connection.commit();
            return successResponse(res, `Data workin process dengan ID ${data.id} berhasil diperbarui`, data);

        } catch (error) {
            await connection.rollback();
            const errorMsg = error.message === "Not found" 
                ? `Data workin process dengan ID ${data.id} tidak ditemukan`
                : "Gagal memperbarui data workin process, semua perubahan dibatalkan";
            return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 500);
        } finally {
            connection.release();
        }
    };

    const deleteWorkinProcess = async (req, res) => {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 2) {
            return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
        }

        return handleDatabaseOperation(
            async () => {
                const [result] = await dbPool.query('DELETE FROM table_workin_process WHERE id IN (?)', [ids]);
                if (result.affectedRows === 0) {
                    return errorResponse(res, "Tidak ada data workin process yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
                }
                return successResponse(res, `${result.affectedRows} data workin process berhasil dihapus`);
            },
            res,
            "Terjadi kesalahan pada server saat menghapus data workin process"
        );
    };

    module.exports = {
        getAllWorkinProcess,
        getWorkinProcessById,
        createWorkinProcess,
        updateWorkinProcess,
        deleteWorkinProcess
    };
