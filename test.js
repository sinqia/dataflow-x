require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

async function callCloudSchedulerAPI() {
  const projectId = 'ssot-391717';
  const locationId = 'southamerica-east1';
  const pageSize = 500;
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
    console.log('Success:');
    console.log(response.data.jobs.length);
  } catch (error) {
    console.error('Error:');
    console.error(error.response.status, error.response.data);
  }
}

callCloudSchedulerAPI();
