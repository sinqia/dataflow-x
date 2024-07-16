const { cloudSchedulerJobsGet, cloudSchedulerJobCreate, cloudSchedulerJobDelete } = require('../services/cloudScheduler');


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

async function deleteCloudSchedulerJob(req, res) {
    try {
        const jobName = req.params.jobName;
        const job = await cloudSchedulerJobDelete(jobName);
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { fetchCloudSchedulerJobs, createCloudSchedulerJob, deleteCloudSchedulerJob };
