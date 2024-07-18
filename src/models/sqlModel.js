var sql = require('mssql');
const { sqlConfig } = require('../config/config');

async function connectToSql(origin, io = console) {
    io.log(`[Database] Conectando... ${origin}`);
    try {
       await sql.connect(sqlConfig[origin]);
        io.log(`[Database] Conectado ${origin}`);

        return
    } catch (err) {
        io.log(`[Database] Erro ao conectar ${origin}:`, err.message);
        throw err;
    }
}

async function fetchTableSchema(origin, schemadb, table) {
    connection = await sql.connect(sqlConfig[origin]);

    const query = `
        SELECT 
            COLUMN_NAME, 
            DATA_TYPE 
        FROM 
            INFORMATION_SCHEMA.COLUMNS 
        WHERE 
            TABLE_NAME = '${table}'
            AND TABLE_SCHEMA = '${schemadb}'
    `;
    try {
        const result = await connection.query(query);
        return result.recordset;
    } catch (err) {
        console.error('[Database] Erro ao buscar schema da tabela', err);
        throw err;
    } finally {
        closeConnection();
    }
}

async function fetchData(origin, schemadb, table, io = console) {
    connection = await sql.connect(sqlConfig[origin]);

    io.log(`[Database] Buscando dados da tabela ${table}`);

    const query = `SELECT * FROM ${schemadb}.${table}`;
    try {
        const result = await connection.query(query);
        io.log(`[Database] Dados da tabela ${table} buscados com sucesso, ${result.recordset.length} linhas retornadas`);
        return result.recordset;
    } catch (err) { 
        io.log(`[Database] Erro ao buscar dados da tabela ${table}`);
        throw err;
    } finally {
        closeConnection();
    }

}

async function closeConnection() {
    await sql.close();
}

module.exports = { connectToSql, fetchTableSchema, fetchData, closeConnection };
