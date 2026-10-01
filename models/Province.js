const client = require('../database/db');

const authProvince = async () => {
    const query = 'SELECT * FROM estatus.province_mst ORDER BY province_code ASC';
    try {
        const result = await client.query(query);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

module.exports = { authProvince };