function mapSqlTypeToBigQueryType(sqlType) {
    switch (sqlType.toLowerCase()) {
        case 'bigint':
        case 'int':
        case 'smallint':
        case 'tinyint':
        case 'integer':
            return 'INT64';
        case 'bit':
        case 'boolean':
            return 'BOOLEAN';
        case 'decimal':
        case 'numeric':
        case 'float':
        case 'real':
        case 'money':
        case 'smallmoney':
        case 'double precision':
            return 'FLOAT64';
        case 'date':
            return 'DATE';
        case 'datetime':
        case 'datetime2':
        case 'smalldatetime':
        case 'time':
        case 'timestamp':
        case 'datetimeoffset':
        case 'timestamp with time zone':
            return 'TIMESTAMP';
        case 'character varying':
        case 'char':
        case 'varchar':
        case 'text':
        case 'nchar':
        case 'nvarchar':
        case 'ntext':
            return 'STRING';
        default:
            return 'STRING';
    }
}

module.exports = { mapSqlTypeToBigQueryType };
