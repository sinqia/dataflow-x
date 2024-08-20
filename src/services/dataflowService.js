const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const { sqlConfig } = require('../config/config');
const package = require('../../package.json');

async function dataflowPipelineCreate(pipeData, io = console) {

    io.log(`[Pipeline] Creating pipe ${pipeData.displayName}`);
    const projectId = process.env.GCP_PROJECT_ID;
    const locationId = process.env.GCP_LOCATION_ID;
    const url = `https://datapipelines.googleapis.com/v1/projects/${projectId}/locations/${locationId}/pipelines`

    // Cria uma instância do GoogleAuth
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });

    // Obtém um client authenticated
    const client = await auth.getClient();

    // Obtém o token de acesso
    const token = await client.getAccessToken();

    // Configura os headers da requisição
    const headers = {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
    };

    let data = JSON.stringify(pipeData);

    try {
        // Faz a requisição POST para a API
        const response = await axios.post(url,data, { headers });
        io.log(`[Pipeline] Success: Job ${pipeData.displayName} created`);
        return response.data;
    } catch (error) {
        io.log(`[Pipeline] Error: ${error.response.status}`);
        io.log(error.response.status, error.response.data);
        throw error;
    }
}

function dataflowPipelineData(form, io = console) {
    const connectionData = sqlConfig[form.origin];
    const projectId = process.env.GCP_PROJECT_ID;
    const locationId = process.env.GCP_LOCATION_ID;
    var jobName = `${package.name}-${form.name}`;
    jobName = jobName.replace(/_/g, '-');
    jobName = jobName.toLowerCase();

    const pipeline = {
        name: `projects/${projectId}/locations/${locationId}/pipelines/${jobName}`,
        "displayName": jobName,
        "type": "PIPELINE_TYPE_BATCH",
        "workload": {
            "dataflowFlexTemplateRequest": {
                "projectId": projectId,
                "location": locationId,
                "launchParameter": {
                    "jobName": jobName,
                    "containerSpecGcsPath": "gs://dataflow-templates-southamerica-east1/latest/flex/SQLServer_to_BigQuery",
                    "environment": {
                        "numWorkers": 2,
                        "tempLocation": "gs://dataflow-staging-southamerica-east1-172515849792/tmp",
                        "subnetwork": "https://www.googleapis.com/compute/v1/projects/prj-sinqia-network/regions/southamerica-east1/subnetworks/snet-nexuslake-poc",
                        "network": "https://www.googleapis.com/compute/v1/projects/prj-sinqia-network/global/networks/vpc-sinqia-hml"
                    },
                    "parameters": {
                        "connectionURL": `jdbc:sqlserver://;serverName=${connectionData.server};`,
                        "connectionProperties": "encrypt=false",
                        "username": connectionData.user,
                        "password": connectionData.password,
                        "query": `SELECT * FROM ${connectionData.database}.${form.schemaDb}.${form.tableId}`,
                        "outputTable": `${projectId}:${form.schemaBq}.${form.tableBq}`,
                        "bigQueryLoadingTemporaryDirectory": "gs://bckt-dataflow-temp",
                        "useColumnAlias": "false",
                        "isTruncate": "true",
                        "fetchSize": "50000",
                        "createDisposition": "CREATE_NEVER",
                        "useStorageWriteApi": "false",
                        "stagingLocation": "gs://dataflow-staging-southamerica-east1-172515849792/staging",
                        "autoscalingAlgorithm": "NONE",
                        "serviceAccount": "172515849792-compute@developer.gserviceaccount.com",
                        "usePublicIps": "false"
                    }
                }
            }
        },
        "scheduleInfo": {
            "schedule": form.scheduleCron || '0 7 * * *',
            "timeZone": "America/Sao_Paulo"
        }
    }

    return pipeline;
}

module.exports = {
    dataflowPipelineCreate: dataflowPipelineCreate,
    dataflowPipelineData: dataflowPipelineData
};