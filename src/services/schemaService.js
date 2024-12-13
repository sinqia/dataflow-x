const { fetchTableSchema } = require('../models/sqlModel');
const { mapSqlTypeToBigQueryType } = require('../utils/typeMapping');

async function inferSchemaFromDb(form) {
    const schema = [];
    const schemaBase = [];
    var tableSchema = await fetchTableSchema(form);
    if (form.fields) {
        const fieldMap = form.fields.reduce((map, field) => {
            map[field.original] = field.alias;
            return map;
        }, {});

        tableSchema = tableSchema
            .filter(column => fieldMap.hasOwnProperty(column.COLUMN_NAME))
            .map(column => {
                column.COLUMN_NAME = fieldMap[column.COLUMN_NAME];
                return column;
            });
    }

    tableSchema.forEach(column => {
        const bigQueryType = mapSqlTypeToBigQueryType(column.DATA_TYPE);
        schema.push({ name: column.COLUMN_NAME, type: bigQueryType });
        schemaBase.push({ name: column.COLUMN_NAME, type: column.DATA_TYPE });
    });

    // filtra todos os campos int64
    const int64Fields = schema.filter(column => column.type === 'INT64');
    console.log('int64Fields', int64Fields);

    return {
        base: schemaBase,
        inferred: schema
    };
}

module.exports = { inferSchemaFromDb };
