const dbPool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const bcrypt = require('bcrypt');

const handleDatabaseOperation = async (operation, res, errorMsg) => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        return errorResponse(res, errorMsg, error);
    }
};

const getAllUser = (req, res) =>
    handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.query('SELECT id, username, name, email, status, id_role, id_department FROM user');
            return successResponse(res, "Data user berhasil diambil", data);
        },
        res,
        "Terjadi kesalahan pada server"
    );

const getUserById = (req, res) => {
    const { id } = req.params;
    return handleDatabaseOperation(
        async () => {
            const [data] = await dbPool.execute('SELECT id, username, name, email, status, id_role, id_department FROM user WHERE id = ?', [id]);
            if (data.length === 0) {
                return errorResponse(res, `User dengan ID ${id} tidak ditemukan`, null, 404);
            }
            return successResponse(res, "Data user berhasil diambil", data[0]);
        },
        res,
        `Terjadi kesalahan pada server saat mengambil user ID ${id}`
    );
};

const createUser = async (req, res) => {
    const data = req.body;
    const isArray = Array.isArray(data);

    const requiredFields = ['username', 'name', 'password', 'email', 'id_role', 'id_department'];

    if ((isArray && data.some(item => requiredFields.some(field => !item[field]))) ||
        (!isArray && requiredFields.some(field => !data[field]))) {
        return errorResponse(res, "Bad Request: Semua field wajib diisi", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const saltRounds = 10;

            if (isArray) {
                const hashedData = await Promise.all(data.map(async (item) => {
                    const hashedPassword = await bcrypt.hash(item.password, saltRounds);
                    return [
                        item.username,
                        item.name,
                        hashedPassword,
                        item.email,
                        item.status || 'active',
                        item.id_role,
                        item.id_department
                    ];
                }));

                const SQLQuery = 'INSERT INTO user (username, name, password, email, status, id_role, id_department) VALUES ?';
                await dbPool.query(SQLQuery, [hashedData]);
            } else {
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);
                const SQLQuery = 'INSERT INTO user (username, name, password, email, status, id_role, id_department) VALUES (?, ?, ?, ?, ?, ?, ?)';
                const values = [data.username, data.name, hashedPassword, data.email, data.status || 'active', data.id_role, data.id_department];
                await dbPool.execute(SQLQuery, values);
            }

            return successResponse(res, `${isArray ? 'Beberapa' : ''} user berhasil dibuat`, data, 201);
        },
        res,
        `Terjadi kesalahan pada server saat membuat ${isArray ? 'banyak ' : ''}user`
    );
};

const updateUser = async (req, res) => {
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
            await Promise.all(data.map(async (item) => {
                const fields = [];
                const values = [];

                if (item.username) { fields.push('username = ?'); values.push(item.username); }
                if (item.name) { fields.push('name = ?'); values.push(item.name); }
                if (item.password) {
                    const hashedPassword = await bcrypt.hash(item.password, 10);
                    fields.push('password = ?');
                    values.push(hashedPassword);
                }
                if (item.email) { fields.push('email = ?'); values.push(item.email); }
                if (item.status !== undefined) { fields.push('status = ?'); values.push(item.status); }
                if (item.id_role) { fields.push('id_role = ?'); values.push(item.id_role); }
                if (item.id_department) { fields.push('id_department = ?'); values.push(item.id_department); }

                values.push(item.id);

                return connection.execute(
                    `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }));
            await connection.commit();
            return successResponse(res, `${data.length} user berhasil diperbarui`, data);
        }

        const fields = [];
        const values = [];

        if (data.username) { fields.push('username = ?'); values.push(data.username); }
        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            fields.push('password = ?');
            values.push(hashedPassword);
        }
        if (data.email) { fields.push('email = ?'); values.push(data.email); }
        if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
        if (data.id_role) { fields.push('id_role = ?'); values.push(data.id_role); }
        if (data.id_department) { fields.push('id_department = ?'); values.push(data.id_department); }

        values.push(data.id);

        const [result] = await connection.execute(
            `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error("Not found");
        }

        await connection.commit();
        return successResponse(res, `User dengan ID ${data.id} berhasil diperbarui`, data);

    } catch (error) {
        await connection.rollback();
        const errorMsg = error.message === "Not found"
            ? `User dengan ID ${data.id} tidak ditemukan`
            : "Gagal memperbarui user, semua perubahan dibatalkan";
        return errorResponse(res, errorMsg, error, error.message === "Not found" ? 404 : 400);
    } finally {
        connection.release();
    }
};

const deleteUser = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, "Bad Request: Body harus berisi properti 'ids' dalam bentuk array dan tidak boleh kosong", null, 400);
    }

    return handleDatabaseOperation(
        async () => {
            const [result] = await dbPool.query('DELETE FROM user WHERE id IN (?)', [ids]);
            if (result.affectedRows === 0) {
                return errorResponse(res, "Tidak ada user yang cocok dengan ID yang diberikan untuk dihapus", null, 404);
            }
            return successResponse(res, `${result.affectedRows} user berhasil dihapus`);
        },
        res,
        "Terjadi kesalahan pada server saat menghapus user"
    );
};

module.exports = {
    getAllUser,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
