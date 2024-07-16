const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const { jobsMapping } = require('../utils/jobsMapping');

async function cloudSchedulerJobsGet(pageSize, io = console) {
    const projectId = process.env.GCP_PROJECT_ID;
    const locationId = process.env.GCP_LOCATION_ID;
    const url = `https://cloudscheduler.googleapis.com/v1beta1/projects/${projectId}/locations/${locationId}/jobs?pageSize=${pageSize}`;

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
        // Faz a requisição GET para a API
        const response = await axios.get(url, { headers });
        io.log('Success:');
        return jobsMapping(response.data.jobs);
    } catch (error) {
        io.log('Error:');
        io.log(error.response.status, error.response.data);
        throw error;
    }
}

async function cloudSchedulerJobCreate(jobData, io = console) {
    const projectId = process.env.GCP_PROJECT_ID;
    const locationId = process.env.GCP_LOCATION_ID;
    const url = `https://cloudscheduler.googleapis.com/v1beta1/projects/${projectId}/locations/${locationId}/jobs`;

    // Monta o objeto job
    const job = {
        name: `projects/${projectId}/locations/${locationId}/jobs/${jobData.jobName}`,
        httpTarget: {
            uri: jobData.uri,
            httpMethod: jobData.httpMethod || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...jobData.headers // Adiciona cabeçalhos adicionais
            },
            body: Buffer.from(JSON.stringify(jobData.body)).toString('base64'),
            // oauthToken: {
            //     serviceAccountEmail: jobData.serviceAccountEmail,
            //     scope: 'https://www.googleapis.com/auth/cloud-platform'
            // }
        },
        schedule: jobData.schedule || '0 7 * * *',
        timeZone: jobData.timeZone || 'America/Sao_Paulo'
    };

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
        const response = await axios.post(url, job, { headers });
        io.log('Success:');
        return response.data;
    } catch (error) {
        io.log('Error:');
        io.log(error.response.status, error.response.data);
        throw error;
    }
} 

module.exports = { 
    cloudSchedulerJobsGet: cloudSchedulerJobsGet,
    cloudSchedulerJobCreate: cloudSchedulerJobCreate
};