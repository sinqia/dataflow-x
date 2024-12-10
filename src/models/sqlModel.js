const sql = require('mssql');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const { sqlConfig } = require('../config/config');

async function connectToSql(origin, io = console) {
    io.log(`[Database] Conectando... ${origin}`);
    try {
        if (sqlConfig[origin].sgbd === 'mssql') {
            await sql.connect(sqlConfig[origin]);
        } else if (sqlConfig[origin].sgbd === 'postgres') {
            const pool = new Pool(sqlConfig[origin]);
            sqlConfig[origin].pool = pool; // salvar pool para reutilizar
        } else if (sqlConfig[origin].sgbd === 'mysql') {
            const connection = await mysql.createConnection(sqlConfig[origin]);
            sqlConfig[origin].connection = connection; // salvar conexão para reutilizar
        }
        io.log(`[Database] Conectado ${origin}`);
        return;
    } catch (err) {
        io.log(`[Database] Erro ao conectar ${origin}:`, err.message);
        throw err;
    }
}

async function fetchTableSchema(form) {
    let query;
    if (sqlConfig[form.origin].sgbd === 'mssql') {
        connection = await sql.connect(sqlConfig[form.origin]);
        query = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE 
            FROM 
                INFORMATION_SCHEMA.COLUMNS 
            WHERE 
                TABLE_NAME = '${form.tableId}'
                AND TABLE_SCHEMA = '${form.schemaDb}'
        `;
    } else if (sqlConfig[form.origin].sgbd === 'postgres') {
        const pool = sqlConfig[form.origin].pool;
        query = `
            SELECT 
                column_name AS "COLUMN_NAME", 
                data_type AS "DATA_TYPE" 
            FROM 
                information_schema.columns 
            WHERE 
                table_name = '${form.tableId}' 
                AND table_schema = '${form.schemaDb}'
        `;
        connection = pool;
    } else if (sqlConfig[form.origin].sgbd === 'mysql') {
        connection = sqlConfig[form.origin].connection;
        query = `
            SELECT 
                column_name AS "COLUMN_NAME", 
                data_type AS "DATA_TYPE" 
            FROM 
                information_schema.columns 
            WHERE 
                table_name = '${form.tableId}' 
                AND table_schema = '${form.schemaDb}'
        `;
    }

    try {
        const result = await connection.query(query);
        // return sqlConfig[form.origin].sgbd === 'mssql' ? result.recordset : result.rows;
        switch (sqlConfig[form.origin].sgbd) {
            case 'mssql':
                return result.recordset;
            case 'postgres':
                return result.rows;
            case 'mysql':
                return result[0];
        }
    } catch (err) {
        console.error('[Database] Erro ao buscar schema da tabela', err);
        throw err;
    } finally {
        await closeConnection(form.origin);
    }
}

async function fetchData(form, io = console) {
    let query;
    if (sqlConfig[form.origin].sgbd === 'mssql') {
        connection = await sql.connect(sqlConfig[form.origin]);
        query = `SELECT * FROM ${form.schemaDb}.${form.tableId}`;
    } else if (sqlConfig[form.origin].sgbd === 'postgres') {
        const pool = sqlConfig[form.origin].pool;
        query = `SELECT * FROM ${form.schemaDb}.${form.tableId} limit 10`;
        connection = pool;
    } else if (sqlConfig[form.origin].sgbd === 'mysql') {
        connection = sqlConfig[form.origin].connection;
        query = `SELECT * FROM ${form.tableId}`;
    }

    if(form.query){
        query = form.query;
    }

    io.log(`[Database] Buscando dados da tabela ${form.tableId}`);

    try {
        const result = await connection.query(query);
        let rows = [];
        switch (sqlConfig[form.origin].sgbd) {
            case 'mssql':
                rows = result.recordset;
            case 'postgres':
                rows = result.rows;
            case 'mysql':
                rows = result[0];
        }

        // const rows = sqlConfig[form.origin].sgbd === 'mssql' ? result.recordset : result.rows;
        io.log(`[Database] Dados da tabela ${form.tableId} buscados com sucesso, ${rows.length} linhas retornadas`);
        return rows;
    } catch (err) {
        io.log(`[Database] Erro ao buscar dados da tabela ${form.tableId}`);
        throw err;
    } finally {
        await closeConnection(form.origin);
    }
}

async function closeConnection(origin) {
    if(!origin){
        return null;
    }
    if (sqlConfig[origin].sgbd === 'mssql') {
        await sql.close();
    } else if (sqlConfig[origin].sgbd === 'postgres') {
        // await sqlConfig[origin].pool.end();
    }
}

function isQuery(tableId) {
    if(!tableId){
        throw new Error('TableId is required');
    }

    tableId = tableId.toUpperCase();

    let isQuery = false;
    if (tableId.includes('SELECT')) {
        isQuery = true;
    }
    return isQuery;
}

function extractTableFromQuery(query) {
    const table = query.match(/FROM\s+([^\s]+)/i)[1];
    return table;
}

function extractFieldsFromQuery(query) {
    var fields = query.match(/SELECT\s+(.+)\s+FROM/i)[1];
    
    // verifica se tem * e retorna false
    if(fields.includes('*')){
        return false;
    }

    // Remove top
    fields = fields.replace(/TOP\s+\d+\s+/i, '');
    // remove espaços em branco
    fields = fields.replace(/\s/g, '');
    // separa os campos
    fields = fields.split(',');

    return fields;
}

module.exports = {
    connectToSql,
    fetchTableSchema,
    fetchData,
    closeConnection,
    isQuery,
    extractTableFromQuery,
    extractFieldsFromQuery
};
