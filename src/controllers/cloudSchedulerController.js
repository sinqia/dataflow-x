const { cloudSchedulerJobsGet, cloudSchedulerJobCreate } = require('../services/cloudScheduler');


async function fetchCloudSchedulerJobs(req, res) {
    try {
        const jobs = await cloudSchedulerJobsGet(500);
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function createCloudSchedulerJob(req, res) {
    try {
        const jobData = req.body;
        const job = await cloudSchedulerJobCreate(jobData);
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { fetchCloudSchedulerJobs, createCloudSchedulerJob };
