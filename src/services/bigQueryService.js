const { BigQuery } = require('@google-cloud/bigquery');
const { bigQueryConfig } = require('../config/config');

const bigquery = new BigQuery(bigQueryConfig);

async function ensureDatasetExists(datasetId) {
    const dataset = bigquery.dataset(datasetId);
    const [exists] = await dataset.exists();
    if (!exists) {
        await dataset.create();
        console.log(`Dataset ${datasetId} criado com sucesso.`);
    }
}

async function ensureTableExists(dataset, tableId) {
    const table = dataset.table(tableId);
    const [exists] = await table.exists();
    return exists;
}

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

async function loadToBigQuery(datasetId, tableId, data, schema, isDelete, isCreate, attemptsMax, io = console.log) {
    const dataset = bigquery.dataset(datasetId);
    const tablebq = dataset.table(tableId);

    if (isDelete) {
        try {
            io.log(`Excluindo tabela ${tableId}...`);
            await tablebq.delete({ ignoreNotFound: true });
            io.log(`Tabela ${tableId} excluída com sucesso.`);
        } catch (err) {
            io.log('Erro ao excluir a tabela no BigQuery:', err);
        }
    }

    if (isCreate) {
        try {
            await dataset.createTable(tableId, { schema });
            io.log(`Tabela ${tableId} criada com sucesso.`);

            let tableExists = await ensureTableExists(dataset, tableId);
            let attempts = 0;

            while (!tableExists && attempts < attemptsMax) {
                io.log('Esperando pela criação da tabela...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                tableExists = await ensureTableExists(dataset, tableId);
                attempts++;
            }

            if (!tableExists) {
                throw new Error(`Tabela ${tableId} não foi encontrada após a criação.`);
            }
        } catch (err) {
            io.log('Erro ao criar a tabela no BigQuery:', err);
            return;
        }
    }

    const convertedData = convertDataTypes(data);

    try {
        let attempts = 0;
        while (attempts < 20) {
            try {
                await tablebq.insert(convertedData);
                break;
            } catch (err) {
                io.log('Erro ao inserir dados no BigQuery:', err.message, 'Tentando novamente...');
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        if (attempts >= 20) {
            throw new Error('Erro ao inserir dados no BigQuery após 20 tentativas.');
        }
        io.log('Dados inseridos no BigQuery com sucesso.');
    } catch (err) {
        io.log('Erro ao inserir dados no BigQuery:', err);
    }
}

module.exports = { ensureDatasetExists, loadToBigQuery };
