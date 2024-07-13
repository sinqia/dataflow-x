function mapSqlTypeToBigQueryType(sqlType) {
    switch (sqlType.toLowerCase()) {
        case 'bigint':
        case 'int':
        case 'smallint':
        case 'tinyint':
            return 'INT64';
        case 'bit':
            return 'BOOLEAN';
        case 'decimal':
        case 'numeric':
        case 'float':
        case 'real':
        case 'money':
        case 'smallmoney':
            return 'FLOAT64';
        case 'date':
        case 'datetime':
        case 'datetime2':
        case 'smalldatetime':
        case 'time':
        case 'timestamp':
        case 'datetimeoffset':
            return 'TIMESTAMP';
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
