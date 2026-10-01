const client = require('../database/db');

const authUser = async (email) => {
    const query = 'SELECT * FROM estatus.confreres_dtl WHERE personal_mailid1 = $1';
    const values = [email];
    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

module.exports = { authUser };