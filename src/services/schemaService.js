const { fetchTableSchema } = require('../models/sqlModel');
const { mapSqlTypeToBigQueryType } = require('../utils/typeMapping');

async function inferSchemaFromDb(form) {
    const schema = [];
    const schemaBase = [];
    var tableSchema = await fetchTableSchema(form);
    if (form.fields) {
        tableSchema = tableSchema.filter(column => form.fields.includes(column.COLUMN_NAME));
    }

    tableSchema.forEach(column => {
        const bigQueryType = mapSqlTypeToBigQueryType(column.DATA_TYPE);
        schema.push({ name: column.COLUMN_NAME, type: bigQueryType });
        schemaBase.push({ name: column.COLUMN_NAME, type: column.DATA_TYPE });
    });

    return {
        base: schemaBase,
        inferred: schema
    };
}

module.exports = { inferSchemaFromDb };
