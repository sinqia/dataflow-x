const express = require('express');
const { getSqlData } = require('../controllers/sqlController');
const { loadDataToBigQuery } = require('../controllers/bigQueryController');
const { fetchCloudSchedulerJobs } = require('../controllers/cloudSchedulerController');
const { processData } = require('../controllers/mainController');


const router = express.Router();

// Rota para obter dados do SQL Server
router.get('/sql-data', getSqlData);

// Rota para carregar dados no BigQuery
router.post('/bigquery-load', loadDataToBigQuery);

// Rota para processar dados do SQL Server e carregar no BigQuery
router.post('/process-data', processData);

// Rota para obter jobs do Cloud Scheduler
router.get('/jobs', fetchCloudSchedulerJobs);

module.exports = router;
