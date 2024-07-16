const { ensureDatasetExists, loadToBigQuery } = require('../services/bigQueryService');
const { cloudSchedulerJobs } = require('../services/cloudScheduler');


async function loadDataToBigQuery(req, res) {
    const { datasetId, tableId, data, schema, isDelete, isCreate, attemptsMax } = req.body;

    try {
        await ensureDatasetExists(datasetId);
        await loadToBigQuery(datasetId, tableId, data, schema, isDelete, isCreate, attemptsMax);
        res.json({ message: 'Dados carregados com sucesso no BigQuery' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { loadDataToBigQuery };
