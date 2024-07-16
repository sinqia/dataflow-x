document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/cloud-scheduler')
        .then(response => response.json())
        .then(data => displayJobs(data))
        .catch(error => console.error('Error fetching jobs:', error));
});

function displayJobs(jobs) {
    const tbody = document.querySelector('#jobs-container tbody');
    jobs.forEach(job => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = job.name;
        row.appendChild(nameCell);

        const stateCell = document.createElement('td');
        stateCell.textContent = job.state;
        row.appendChild(stateCell);

        const scheduleTimeCell = document.createElement('td');
        scheduleTimeCell.textContent = job.scheduleTime
        row.appendChild(scheduleTimeCell);

        const lastAttemptTimeCell = document.createElement('td');
        lastAttemptTimeCell.textContent = job.lastAttemptTime
        row.appendChild(lastAttemptTimeCell);

        const scheduleCell = document.createElement('td');
        scheduleCell.textContent = job.schedule;
        row.appendChild(scheduleCell);


        tbody.appendChild(row);
    });
}
