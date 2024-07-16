function jobsMapping(jobs) {
    return jobs.map(job => {
        return {
            name: job.name.split('/').pop(),
            state: job.state,
            scheduleTime: new Date(job.scheduleTime).toLocaleString(),
            lastAttemptTime: new Date(job.lastAttemptTime).toLocaleString(),
            schedule: job.schedule,
            uri: job.httpTarget.uri,
        };
    });
}

module.exports = { jobsMapping: jobsMapping };