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
        const response = await axios.post(url, data, { headers });
        io.log(`[Pipeline] Success: Job ${pipeData.displayName} created`);
        return {
            status: true,
            message: 'Pipeline created',
            data: response.data
        };
    } catch (error) {
        if (error.response.statusText === 'Conflict') {
            io.log('Pipeline already exists');
            return {
                status: false,
                message: 'Pipeline already exists'
            }
        }

        io.log(`[Pipeline] Error: ${error.response.status}`);
        io.log(error.response.status, error.response.data);
        throw error;
    }
}

async function dataflowPipelinePath(pipeData, io = console) {

    io.log(`[Pipeline] Creating pipe ${pipeData.displayName}`);
    const projectId = process.env.GCP_PROJECT_ID;
    const locationId = process.env.GCP_LOCATION_ID;
    // PATCH https://datapipelines.googleapis.com/v1/{pipeline.name=projects/*/locations/*/pipelines/*}
    const url = `https://datapipelines.googleapis.com/v1/${pipeData.name}`

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
        const response = await axios.patch(url, data, { headers });
        io.log(`[Pipeline] Success: Job ${pipeData.displayName} created`);
        return response.data;
    } catch (error) {
        io.log(`[Pipeline] Error: ${error?.response?.status}`);
        io.log(error?.response?.status, error?.response?.data);
        throw error;
    }
}

async function dataflowPipelineDelete(pipeData, io = console) {
    io.log(`[Pipeline] Delete pipe ${pipeData.displayName}`);
    const url = `https://datapipelines.googleapis.com/v1/${pipeData.name}`

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

    try {
        // Faz a requisição POST para a API
        const response = await axios.delete(url,{ headers });
        io.log(`[Pipeline] Success: Job ${pipeData.displayName} deleted`);
        return response.data;
    } catch (error) {
        io.log(`[Pipeline] Error: ${error?.response?.status}`);
    }
}

function dataflowPipelineData(form, io = console) {
    const connectionData = sqlConfig[form.origin];
    const projectId = process.env.GCP_PROJECT_ID;
    const locationId = process.env.GCP_LOCATION_ID;
    var jobName = `${package.name}-${form.name}`;
    jobName = jobName.replace(/_/g, '-');
    jobName = jobName.toLowerCase();
    jobName = jobName.substring(0, 60); // mais que isso da erro

    var containerSpecGcsPath = 'gs://dataflow-templates-southamerica-east1/latest/flex/SQLServer_to_BigQuery';
    var connectionURL = `jdbc:sqlserver://;serverName=${connectionData.server};`;
    
    if(connectionData.sgbd === 'postgres'){
        containerSpecGcsPath = 'gs://dataflow-templates-southamerica-east1/latest/flex/PostgreSQL_to_BigQuery';
        connectionURL = `jdbc:postgresql://${connectionData.host}:5432/${connectionData.database}`;
    }

    var query = `SELECT * FROM ${connectionData.database}.${form.schemaDb}.${form.tableId}`;

    // Se tiver query, usa a query
    if(form.query){
        query = form.query;
    }

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
                    "containerSpecGcsPath": containerSpecGcsPath,
                    "environment": {
                        "numWorkers": 2,
                        "tempLocation": "gs://dataflow-staging-southamerica-east1-172515849792/tmp",
                        "subnetwork": "https://www.googleapis.com/compute/v1/projects/prj-sinqia-network/regions/southamerica-east1/subnetworks/snet-nexuslake-poc",
                        "network": "https://www.googleapis.com/compute/v1/projects/prj-sinqia-network/global/networks/vpc-sinqia-hml"
                    },
                    "parameters": {
                        "connectionURL": connectionURL,
                        "connectionProperties": "encrypt=false",
                        "username": connectionData.user,
                        "password": connectionData.password,
                        "query": query,
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
    dataflowPipelineData: dataflowPipelineData,
    dataflowPipelinePath: dataflowPipelinePath,
    dataflowPipelineDelete: dataflowPipelineDelete
};