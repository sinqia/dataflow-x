// __tests__/dataflowService.test.js
const { dataflowPipelineCreate } = require('../src/services/dataflowService');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

jest.mock('axios');
jest.mock('google-auth-library');

describe('dataflowPipelineCreate', () => {
    const jobData = {
        jobName: 'test-job'
    };

    const mockConsole = {
        log: jest.fn()
    };

    beforeEach(() => {
        process.env.GCP_PROJECT_ID = 'test-project';
        process.env.GCP_LOCATION_ID = 'test-location';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a pipeline successfully', async () => {
        const mockToken = { token: 'fake-token' };
        const mockClient = { getAccessToken: jest.fn().mockResolvedValue(mockToken) };
        GoogleAuth.mockImplementation(() => ({
            getClient: jest.fn().mockResolvedValue(mockClient)
        }));

        axios.post.mockResolvedValue({ data: { success: true } });

        const result = await dataflowPipelineCreate(jobData, mockConsole);

        expect(mockConsole.log).toHaveBeenCalledWith('[Pipeline] Creating pipe test-job');
        expect(mockConsole.log).toHaveBeenCalledWith('[Pipeline] Success: Job test-job created');
        expect(result).toEqual({ success: true });
        expect(axios.post).toHaveBeenCalledWith(
            'https://datapipelines.googleapis.com/v1/projects/test-project/locations/test-location/pipelines',
            expect.any(Object),
            { headers: { Authorization: 'Bearer fake-token', 'Content-Type': 'application/json' } }
        );
    });

    it('should handle API errors correctly', async () => {
        const mockToken = { token: 'fake-token' };
        const mockClient = { getAccessToken: jest.fn().mockResolvedValue(mockToken) };
        GoogleAuth.mockImplementation(() => ({
            getClient: jest.fn().mockResolvedValue(mockClient)
        }));

        axios.post.mockRejectedValue({
            response: {
                status: 500,
                data: { error: 'Internal Server Error' }
            }
        });

        await expect(dataflowPipelineCreate(jobData, mockConsole)).rejects.toThrow();

        expect(mockConsole.log).toHaveBeenCalledWith('[Pipeline] Creating pipe test-job');
        expect(mockConsole.log).toHaveBeenCalledWith('[Pipeline] Error: 500');
        expect(mockConsole.log).toHaveBeenCalledWith(500, { error: 'Internal Server Error' });
    });
});