const { fetchTableSchema } = require('../models/sqlModel');
const { mapSqlTypeToBigQueryType } = require('../utils/typeMapping');

async function inferSchemaFromDb(schemadb, table) {
    const schema = [];
    const tableSchema = await fetchTableSchema(schemadb, table);
    
    tableSchema.forEach(column => {
        const bigQueryType = mapSqlTypeToBigQueryType(column.DATA_TYPE);
        schema.push({ name: column.COLUMN_NAME, type: bigQueryType });
    });

    return schema;
}

module.exports = { inferSchemaFromDb };
