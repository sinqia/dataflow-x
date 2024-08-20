require('dotenv').config();
const dataflow = require(`./src/services/dataflowService`);

dataflow.dataflowPipelineCreate({ jobName: 'test-job' });