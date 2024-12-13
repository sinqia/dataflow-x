const { connectToSql, fetchData, closeConnection, isQuery, extractTableFromQuery, extractFieldsFromQuery } = require('../models/sqlModel');
const { inferSchemaFromDb } = require('../services/schemaService');
const { ensureDatasetExists, loadToBigQuery } = require('../services/bigQueryService');
const { cloudSchedulerJobCreate, cloudSchedulerJobDelete } = require('../services/cloudScheduler');
const { dataflowPipelineData, dataflowPipelineCreate, dataflowPipelineDelete } = require('../services/dataflowService');
const package = require('../../package.json');

async function processData(req, res) {
    var form = req.body;
    var data = [];
    var arrLinks = [];
    // Inicializa o socket.io
    const io = req.app.get('socketio');
    io.log = function (...args) { io.emit('status', args.join(' ')); console.log(...args) }


    form.isQuery = isQuery(form.tableId);

    // Verifica se foi passado uma tabela ou query
    if (form.isQuery) {
        form.query = form.tableId;
        form.tableId = extractTableFromQuery(form.tableId);
        form.fields = extractFieldsFromQuery(form.query);
    }

    // Define o nome da tabela no BigQuery
    form.name = form.tableBq || `${form.origin}_${form.tableId}`;
    if (form.schemaDb !== 'dbo' && form.schemaDb !== 'public') form.name = `${form.origin}_${form.schemaDb}_${form.tableId}`;

    try {
        // Conecta ao banco de dados
        await connectToSql(form.origin, io);

        // Se não for apenas para criar o schema, busca os dados
        if (!form.isCreateOnlySchema) {
            data = await fetchData(form, io);
        }

        // Se o schema não foi definido, inferir o schema
        if (!form.schema) {
            var dataSchema = await inferSchemaFromDb(form);
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
        if (!form?.isAsync) {

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

        if (form.isDataflow) {
            io.log('[Dataflow] Criando pipeline no Dataflow');
            const pipelineData = dataflowPipelineData(form, io);
            await dataflowPipelineDelete(pipelineData, io);
            await dataflowPipelineCreate(pipelineData, io);

            arrLinks.push({
                name: 'Dataflow',
                link: `https://console.cloud.google.com/dataflow/pipelines/${process.env.GCP_LOCATION_ID}/${pipelineData.displayName}/info?project=${process.env.GCP_PROJECT_ID}`
            });
        }

        arrLinks.push({
            name: 'BigQuery',
            link: `https://console.cloud.google.com/bigquery?project=${process.env.GCP_PROJECT_ID}&p=${process.env.GCP_PROJECT_ID}&d=${form.schemaBq}&t=${form.name}&page=table`
        });

        return res.json({
            message: 'Dados processados e carregados no BigQuery com sucesso.',
            arrLinks: arrLinks,
            status: true
        });
    } catch (err) {
        console.error(err);
        closeConnection();
        return res.status(500).json({ error: err.message, status: false });
    }
}

module.exports = { processData };
