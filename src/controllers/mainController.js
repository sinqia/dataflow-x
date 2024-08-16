const { connectToSql, fetchData, closeConnection } = require('../models/sqlModel');
const { inferSchemaFromDb } = require('../services/schemaService');
const { ensureDatasetExists, loadToBigQuery } = require('../services/bigQueryService');
const { cloudSchedulerJobCreate, cloudSchedulerJobDelete } = require('../services/cloudScheduler');
const package = require('../../package.json');

async function processData(req, res) {
    var form = req.body;
    var data = [];
    // Inicializa o socket.io
    const io = req.app.get('socketio');
    io.log = function (...args) { io.emit('status', args.join(' ')); console.log(...args) }

    // Define o nome da tabela no BigQuery
    form.name = form.tableBq || `${form.origin}_${form.tableId}`;
    if (form.schemaDb !== 'dbo') form.name = `${form.origin}_${form.schemaDb}_${form.tableId}`;

    try {
        // Conecta ao banco de dados
        await connectToSql(form.origin, io);

        // Se não for apenas para criar o schema, busca os dados
        if(!form.isCreateOnlySchema){
            data = await fetchData(form.origin, form.schemaDb, form.tableId, io);
        }

        // Se o schema não foi definido, inferir o schema
        if (!form.schema) {
            var dataSchema = await inferSchemaFromDb(form.origin, form.schemaDb, form.tableId);
            form.schema = dataSchema.inferred;
            io.log(`[Database] Esquema inferido: ${form.schema.length} colunas`);
        }

        // Se o schema for manual, redireciona para a rota de schema manual
        if (form.isManualSchema) {
            io.log('[Database] Usando esquema manual');

            // redireciona para a rota de schema manual
            return res.send({
                message: 'Usando esquema manual',
                form,
                schema: dataSchema.base,
                status: true
            });
        }

        // Garante que o dataset no BigQuery exista
        await ensureDatasetExists(form.schemaBq);
        io.log('[Database] Dataset BigQuery garantido');

        // Parametro para o processamento do bigQuery ser async
        if(!form?.isAsync) {

            await loadToBigQuery(form, data, 20, io);
            io.log('[BigQuery] Dados carregados');
        } else {
            loadToBigQuery(form, data, 20, io);
        }

        // Se for agendamento, cria job no Cloud Scheduler
        if (form.isSchedule) {
            io.log('[Scheduler] Criando job no Cloud Scheduler');
            const jobData = {
                jobName: `${package.name}_${form.name}`,
                schedule: form.scheduleCron,
                uri: `${process.env.BASE_URL}/api/process-data`,
                body: {
                    tableId: form.tableId,
                    schemaDb: form.schemaDb,
                    schemaBq: form.schemaBq,
                    isDelete: form.isDelete,
                    isCreate: form.isCreate,
                    tableBq: form.tableBq,
                    origin: form.origin,
                    isCreateOnlySchema: form.isCreateOnlySchema,

                    // Schema só é enviado se tiver sido modificado
                    schema: form.isManualSchema ? form.schema : false,

                    // Sinaliza para integração ser async, permitido que a requisição 
                    // seja finalizada antes do processamento ser concluído
                    // evitando timeout
                    isAsync: true,
                }
            };

            jobData.jobName = jobData.jobName.replace(/_/g, '-');

            await cloudSchedulerJobDelete(jobData.jobName, io);
            io.log('[Scheduler] Job deletado');
            await cloudSchedulerJobCreate(jobData, io);
            io.log('[Scheduler] Job criado');
        }

        form.link = `https://console.cloud.google.com/bigquery?ws=!1m5!1m4!4m3!1sssot-391717!2sraw!3s${form.name}&project=ssot-391717`;

        io.log(`link: ${form.link}`);

        return res.json({
            message: 'Dados processados e carregados no BigQuery com sucesso.',
            form,
            status: true
        });
    } catch (err) {
        console.error(err); 
        closeConnection();
        return res.status(500).json({ error: err.message, status: false });
    }
}

module.exports = { processData };
