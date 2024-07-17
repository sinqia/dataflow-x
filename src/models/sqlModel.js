const sql = require('mssql');
const { sqlConfig } = require('../config/config');

async function connectToSql(origin, io = console.log) {
    io.log(`Conectando ao SQL Server ${origin}`);
    try {
        await sql.connect(sqlConfig[origin]);
        io.log(`Conectado ao SQL Server ${origin}`);

        return
    } catch (err) {
        io.log('Erro ao conectar ao SQL Server');
        throw err;
    }
}

async function fetchTableSchema(schemadb, table) {
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
        const result = await sql.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Erro ao obter o esquema da tabela do SQL Server:', err);
        throw err;
    }
}

async function fetchData(schemadb, table, io = console.log) {
    io.log(`Buscando dados da tabela ${table}`);

    const query = `SELECT * FROM ${schemadb}.${table}`;
    try {
        const result = await sql.query(query);
        io.log(`Dados da tabela ${table} buscados com sucesso, ${result.recordset.length} linhas retornadas`);

        return result.recordset;
    } catch (err) {
        io.log(`Erro ao buscar dados da tabela ${table}`);
        throw err;
    }
}

module.exports = { connectToSql, fetchTableSchema, fetchData };
