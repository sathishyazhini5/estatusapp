const client = require('../database/db');

const authCountry = async () => {
    const query = 'SELECT * FROM estatus.country_mst ORDER BY country_code ASC';
    try {
        const result = await client.query(query);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

module.exports = { authCountry };