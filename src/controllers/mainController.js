const { connectToSql, fetchData } = require('../models/sqlModel');
const { inferSchemaFromDb } = require('../services/schemaService');
const { ensureDatasetExists, loadToBigQuery } = require('../services/bigQueryService');

async function processData(req, res) {
    const { tableId, schemaDb, schemaBq, isDelete, isCreate, origin } = req.body;
    const io = req.app.get('socketio');
    io.log = function (...args) {
        io.emit('status', args.join(' '));
        console.log(...args);
    }

    try {
        await connectToSql(origin, io);

        const data = await fetchData(schemaDb, tableId, io);
        const schema = await inferSchemaFromDb(schemaDb, tableId);
        io.log(`Esquema inferido do SQL Server, ${schema.length} colunas`);

        await ensureDatasetExists(schemaBq);
        io.log('Dataset BigQuery garantido');

        await loadToBigQuery(schemaBq, `${origin}_${tableId}`, data, schema, isDelete, isCreate, 20, io);
        io.log('Dados carregados no BigQuery');
        io.log(`link: https://console.cloud.google.com/bigquery?ws=!1m5!1m4!4m3!1sssot-391717!2sraw!3s${origin}_${tableId}`);

        res.json({ message: 'Dados processados e carregados no BigQuery com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { processData };
