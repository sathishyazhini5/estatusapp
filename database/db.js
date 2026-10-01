/******************** PostgreSQL Connection ********************/ 

const { Client } = require('pg');

const client = new Client({
    host: ''+process.env.DB_HOST+'',
    port: process.env.DB_PORT,
    database: ''+process.env.DB_NAME+'',
    user: ''+process.env.DB_USERNAME+'',
    password: ''+process.env.DB_PASSWORD+'',
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect().then(()=> {
    console.log('Database connected');
}).catch(error=> {
    console.log("Database can't be connected: " + error)
})

module.exports = client;