document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const form = document.createElement('form');
    form.innerHTML = `
        <label>
            Origem:
            <select id="origin">
                <option value="ssot">ssot</option>
                <option value="rentsoft" disabled>rentsoft</option>
                <option value="salesforce" disabled>salesforce</option>
            </select>
        </label>
        <label>
            Table ID:
            <input type="text" id="tableId" required>
        </label>
        <label>
            Schema DB:
            <input type="text" id="schemaDb" required>
        </label>
        <label>
            Schema BQ:
            <input type="text" id="schemaBq" value="raw" disabled>
        </label>
        <label>
            Delete Existing:
            <input type="checkbox" id="isDelete">
        </label>
        <label>
            Create New:
            <input type="checkbox" id="isCreate">
        </label>
        <button type="submit">Submit</button>
    `;

    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';

    const saveToLocalStorage = () => {
        const formData = {
            tableId: document.getElementById('tableId').value,
            schemaDb: document.getElementById('schemaDb').value,
            schemaBq: document.getElementById('schemaBq').value,
            isDelete: document.getElementById('isDelete').checked,
            isCreate: document.getElementById('isCreate').checked,
            origin: document.getElementById('origin').value,
        };
        localStorage.setItem('formData', JSON.stringify(formData));
    };

    const loadFromLocalStorage = () => {
        const savedData = localStorage.getItem('formData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            document.getElementById('tableId').value = formData.tableId || '';
            document.getElementById('schemaDb').value = formData.schemaDb || '';
            document.getElementById('schemaBq').value = formData.schemaBq || '';
            document.getElementById('isDelete').checked = formData.isDelete || false;
            document.getElementById('isCreate').checked = formData.isCreate || false;
            document.getElementById('origin').value = formData.origin || 'ssot';
        }
    };

    document.getElementById('root').appendChild(form);
    document.getElementById('root').appendChild(statusDiv);

    loadFromLocalStorage();

    form.addEventListener('input', saveToLocalStorage);
    form.addEventListener('change', saveToLocalStorage);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tableId = document.getElementById('tableId').value;
        const schemaDb = document.getElementById('schemaDb').value;
        const schemaBq = document.getElementById('schemaBq').value;
        const isDelete = document.getElementById('isDelete').checked;
        const isCreate = document.getElementById('isCreate').checked;
        const origin = document.getElementById('origin').value;

        const response = await fetch('/api/process-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableId, schemaDb, schemaBq, isDelete, isCreate, origin }),
        });

        const data = await response.json();
        console.log(data);
    });

    socket.on('status', (message) => {
        var newLine = document.createElement('div');
        newLine.textContent = message;
        // statusDiv.textContent += message + '\n';
        statusDiv.appendChild(newLine);
    });
});
