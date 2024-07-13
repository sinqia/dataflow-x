const { connectToSql, fetchData } = require('../models/sqlModel');
const { inferSchemaFromDb } = require('../services/schemaService');

async function getSqlData(req, res) {
    const { schemadb, table } = req.query;

    try {
        await connectToSql();
        const data = await fetchData(schemadb, table);
        const schema = await inferSchemaFromDb(schemadb, table);
        res.json({ data, schema: schema.inferred });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getSqlData };
