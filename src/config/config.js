require('dotenv').config();

const sqlConfig = {
    ssot: {
        user: process.env.SSOT_USERNAME,
        password: process.env.SSOT_PASSWORD,
        server: process.env.SSOT_SERVER,
        database: process.env.SSOT_DATABASE,
        sgbd: 'mssql',
        options: {
            encrypt: true,
            enableArithAbort: true,
            trustServerCertificate: true,
        }
    },
    rentsoft: {
        user: process.env.RENTSOFT_USERNAME,
        password: process.env.RENTSOFT_PASSWORD,
        server: process.env.RENTSOFT_SERVER,
        database: process.env.RENTSOFT_DATABASE,
        sgbd: 'mssql',
        options: {
            encrypt: true,
            enableArithAbort: true,
            trustServerCertificate: true,
            requestTimeout: 5 * 60 * 1000
        }
    },
    salesforce: {
        user: process.env.SALESFORCE_USERNAME,
        password: process.env.SALESFORCE_PASSWORD,
        server: process.env.SALESFORCE_SERVER,
        database: process.env.SALESFORCE_DATABASE,
        sgbd: 'mssql',
        options: {
            encrypt: true,
            enableArithAbort: true,
            trustServerCertificate: true,
        }
    },
    protheus: {
        user: process.env.PROTHEUS_USERNAME,
        password: process.env.PROTHEUS_PASSWORD,
        server: process.env.PROTHEUS_SERVER,
        database: process.env.PROTHEUS_DATABASE,
        sgbd: 'mssql',
        options: {
            encrypt: true,
            enableArithAbort: true,
            trustServerCertificate: true,
        }
    },
    jira:{
        user: process.env.JIRA_USERNAME,
        password: process.env.JIRA_PASSWORD,
        server: process.env.JIRA_SERVER,
        database: process.env.JIRA_DATABASE,
        sgbd: 'mssql',
        options: {
            encrypt: true,
            enableArithAbort: true,
            trustServerCertificate: true,
            requestTimeout: 5 * 60 * 1000 // 5 minutes
        } 
    },
    defectdojo: {
        user: process.env.DEFECTDOJO_USERNAME,
        password: process.env.DEFECTDOJO_PASSWORD,
        host: process.env.DEFECTDOJO_SERVER,
        database: process.env.DEFECTDOJO_DATABASE,
        port: process.env.DEFECTDOJO_PORT,
        sgbd: 'postgres',
        max: 10,               // Número máximo de clientes na pool
        idleTimeoutMillis: 30000,
        ssl: { rejectUnauthorized: false }
    }
};

const bigQueryConfig = {
    projectId: process.env.BIGQUERY_PROJECT_ID,
    keyFilename: process.env.BIGQUERY_KEY_FILE,
};

module.exports = { sqlConfig, bigQueryConfig };
