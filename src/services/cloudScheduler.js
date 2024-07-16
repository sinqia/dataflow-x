const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const { jobsMapping } = require('../utils/jobsMapping');

async function cloudSchedulerJobs(pageSize, io = console) {
    const projectId = 'ssot-391717';
    const locationId = 'southamerica-east1';
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

module.exports = { cloudSchedulerJobs: cloudSchedulerJobs };