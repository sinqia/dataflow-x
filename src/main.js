require('dotenv').config();

const sql = require('mssql');
const { BigQuery } = require('@google-cloud/bigquery');
const schemas = require('avro-js/lib/schemas');

// Carrega as variáveis de ambiente
const server = process.env.RENTSOFT_SERVER;
const database = process.env.RENTSOFT_DATABASE;
const username = process.env.RENTSOFT_USERNAME;
const password = process.env.RENTSOFT_PASSWORD;
const origem = "ssot";
const table = "admissao";
const schemadb = "jira";
const isDelete = true;
const isCreate = true;
const attemptsMax = 20;

const bigquery = new BigQuery();

// Configuração do banco de dados SQL Server
const sqlConfig = {
    user: username,
    password: password,
    server: server,
    database: database,
    options: {
        encrypt: true, // Certifique-se de que a criptografia está habilitada
        enableArithAbort: true,
        trustServerCertificate: true, // Adicione esta linha para ignorar o erro de certificado
    }
};

// Função para obter o esquema da tabela do SQL Server
async function getTableSchema() {
    try {
        await sql.connect(sqlConfig);
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
        const result = await sql.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Erro ao obter o esquema da tabela do SQL Server:', err);
    } finally {
        await sql.close();
    }
}

// Função para mapear tipos de dados do SQL Server para BigQuery
function mapSqlTypeToBigQueryType(sqlType) {
    switch (sqlType.toLowerCase()) {
        case 'bigint':
        case 'int':
        case 'smallint':
        case 'tinyint':
            return 'INT64';
        case 'bit':
            return 'BOOLEAN';
        case 'decimal':
        case 'numeric':
        case 'float':
        case 'real':
        case 'money':
        case 'smallmoney':
            return 'FLOAT64';
        case 'date':
        case 'datetime':
        case 'datetime2':
        case 'smalldatetime':
        case 'time':
        case 'timestamp':
        case 'datetimeoffset':
            return 'TIMESTAMP';
        case 'char':
        case 'varchar':
        case 'text':
        case 'nchar':
        case 'nvarchar':
        case 'ntext':
            return 'STRING';
        default:
            return 'STRING';
    }
}

// Função para inferir o esquema usando informações do banco de dados
async function inferSchemaFromDb() {
    const schema = [];
    const tableSchema = await getTableSchema();
    
    tableSchema.forEach(column => {
        const bigQueryType = mapSqlTypeToBigQueryType(column.DATA_TYPE);
        schema.push({ name: column.COLUMN_NAME, type: bigQueryType });
    });

    return schema;
}

// Função para conectar ao SQL Server e buscar dados da tabela centroCusto
async function fetchData() {
    try {
        await sql.connect(sqlConfig);
        var query = `SELECT * FROM ${schemadb}.${table}`;
        const result = await sql.query(query);
        console.log(`Encontrados ${result.recordset.length} registros na tabela ${table}.`);
        if(!result?.recordset.length){
            throw new Error('Nenhum registro encontrado na tabela.');
        }
        return result.recordset;
    } catch (err) {
        console.error('Erro ao conectar ao SQL Server ou buscar dados:', err);
    } finally {
        await sql.close();
    }
}

// Função para converter dados booleanos em strings
function convertDataTypes(data) {
    return data.map(row => {
        const newRow = { ...row };
        for (const key in newRow) {
            if (typeof newRow[key] === 'boolean') {
                newRow[key] = newRow[key].toString();
            }
        }
        return newRow;
    });
}

// Função para garantir que o dataset existe
async function ensureDatasetExists(datasetId) {
    const dataset = bigquery.dataset(datasetId);
    const [exists] = await dataset.exists();
    if (!exists) {
        await dataset.create();
        console.log(`Dataset ${datasetId} criado com sucesso.`);
    }
}

// Função para verificar se a tabela existe
async function ensureTableExists(dataset, tableId) {
    const table = dataset.table(tableId);
    const [exists] = await table.exists();
    return exists;
}

// Função para carregar dados no BigQuery
async function loadToBigQuery(data, schema) {
    const datasetId = 'raw';
    const tableId = `${origem}_${table}`;

    const dataset = bigquery.dataset(datasetId);
    const tablebq = dataset.table(tableId);

    if(isDelete){
        // Remove a tabela se ela existir
        try {
            await tablebq.delete({ ignoreNotFound: true });
            console.log(`Tabela ${tableId} excluída com sucesso.`);
        } catch (err) {
            console.error('Erro ao excluir a tabela no BigQuery:', err);
        }
    }

    if(isCreate){
        // Cria a nova tabela com o esquema inferido
        try {
            await dataset.createTable(tableId, { schema });
            console.log(`Tabela ${tableId} criada com sucesso.`);

            // Verifica se a tabela foi criada
            let tableExists = await ensureTableExists(dataset, tableId);
            let attempts = 0;

            while (!tableExists && attempts < attemptsMax) {
                console.log('Esperando pela criação da tabela...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                tableExists = await ensureTableExists(dataset, tableId);
                attempts++;
            }

            if (!tableExists) {
                throw new Error(`Tabela ${tableId} não foi encontrada após a criação.`);
            }
        } catch (err) {
            console.error('Erro ao criar a tabela no BigQuery:', err);
            return; // Saia da função se a tabela não foi criada
        }
    }

    // Converte tipos específicos para strings (exceto bigint)
    const convertedData = convertDataTypes(data);

    // Insere os dados na tabela
    try {
            var attempts = 0;
            while(attempts < 20){
                try{
                    await tablebq.insert(convertedData);
                    break;
                }catch(err){
                    console.error('Erro ao inserir dados no BigQuery:', err.message);
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            if(attempts >= 20){
                throw new Error('Erro ao inserir dados no BigQuery após 5 tentativas.');
            }
        console.log('Dados inseridos no BigQuery com sucesso.');
    } catch (err) {
        console.error('Erro ao inserir dados no BigQuery:', err);
    }
}



// Função principal
(async () => {
    const data = await fetchData();
    if (data) {
        const schema = await inferSchemaFromDb();
        await loadToBigQuery(data, schema);
        console.log('Dados importados para o BigQuery com sucesso!');
    }
})();
