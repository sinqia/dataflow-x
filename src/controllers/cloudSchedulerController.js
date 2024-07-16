const { cloudSchedulerJobs } = require('../services/cloudScheduler');


async function fetchCloudSchedulerJobs(req, res) {
    try {
        const jobs = await cloudSchedulerJobs(500);
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { fetchCloudSchedulerJobs };
