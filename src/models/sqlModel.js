const sql = require('mssql');
const { Pool } = require('pg');
const { sqlConfig } = require('../config/config');

async function connectToSql(origin, io = console) {
    io.log(`[Database] Conectando... ${origin}`);
    try {
        if (sqlConfig[origin].sgbd === 'mssql') {
            await sql.connect(sqlConfig[origin]);
        } else if (sqlConfig[origin].sgbd === 'postgres') {
            const pool = new Pool(sqlConfig[origin]);
            sqlConfig[origin].pool = pool; // salvar pool para reutilizar
        }
        io.log(`[Database] Conectado ${origin}`);
        return;
    } catch (err) {
        io.log(`[Database] Erro ao conectar ${origin}:`, err.message);
        throw err;
    }
}

async function fetchTableSchema(origin, schemadb, table) {
    let query;
    if (sqlConfig[origin].sgbd === 'mssql') {
        connection = await sql.connect(sqlConfig[origin]);
        query = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE 
            FROM 
                INFORMATION_SCHEMA.COLUMNS 
            WHERE 
                TABLE_NAME = '${table}'
                AND TABLE_SCHEMA = '${schemadb}'
        `;
    } else if (sqlConfig[origin].sgbd === 'postgres') {
        const pool = sqlConfig[origin].pool;
        query = `
            SELECT 
                column_name AS "COLUMN_NAME", 
                data_type AS "DATA_TYPE" 
            FROM 
                information_schema.columns 
            WHERE 
                table_name = '${table}' 
                AND table_schema = '${schemadb}'
        `;
        connection = pool;
    }

    try {
        const result = await connection.query(query);
        return sqlConfig[origin].sgbd === 'mssql' ? result.recordset : result.rows;
    } catch (err) {
        console.error('[Database] Erro ao buscar schema da tabela', err);
        throw err;
    } finally {
        await closeConnection(origin);
    }
}

async function fetchData(origin, schemadb, table, io = console) {
    let query;
    if (sqlConfig[origin].sgbd === 'mssql') {
        connection = await sql.connect(sqlConfig[origin]);
        query = `SELECT * FROM ${schemadb}.${table}`;
    } else if (sqlConfig[origin].sgbd === 'postgres') {
        const pool = sqlConfig[origin].pool;
        query = `SELECT * FROM ${schemadb}.${table} limit 10`;
        connection = pool;
    }

    io.log(`[Database] Buscando dados da tabela ${table}`);

    try {
        const result = await connection.query(query);
        const rows = sqlConfig[origin].sgbd === 'mssql' ? result.recordset : result.rows;
        io.log(`[Database] Dados da tabela ${table} buscados com sucesso, ${rows.length} linhas retornadas`);
        return rows;
    } catch (err) {
        io.log(`[Database] Erro ao buscar dados da tabela ${table}`);
        throw err;
    } finally {
        await closeConnection(origin);
    }
}

async function closeConnection(origin) {
    if (sqlConfig[origin].sgbd === 'mssql') {
        await sql.close();
    } else if (sqlConfig[origin].sgbd === 'postgres') {
        // await sqlConfig[origin].pool.end();
    }
}

module.exports = { connectToSql, fetchTableSchema, fetchData, closeConnection };
