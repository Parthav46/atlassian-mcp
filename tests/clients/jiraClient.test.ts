
import { JiraClient } from '../../src/clients/jiraClient';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JiraClient', () => {
  const config = { baseUrl: 'https://example.atlassian.net', userToken: 'token', username: 'user' };
  let client: JiraClient;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios as any);
    client = new JiraClient(config);
  });

  it('should create an instance', () => {
    expect(client).toBeInstanceOf(JiraClient);
  });

  it('should call axios.get for getIssue', async () => {
    mockedAxios.get.mockResolvedValue({ data: { key: 'TEST-1' } });
    const result = await client.getIssue('TEST-1');
    expect(mockedAxios.get).toHaveBeenCalledWith('/rest/api/3/issue/TEST-1');
    expect(result.data.key).toBe('TEST-1');
  });

  it('should call axios.get for searchIssues', async () => {
    mockedAxios.get.mockResolvedValue({ data: { issues: [] } });
    await client.searchIssues('project=TEST', 0, 10);
    expect(mockedAxios.get).toHaveBeenCalledWith('/rest/api/3/search', { params: { jql: 'project=TEST', startAt: 0, maxResults: 10 } });
  });

  it('should call axios.post for createIssue', async () => {
    mockedAxios.post.mockResolvedValue({ data: { key: 'TEST-2' } });
    const data = { fields: { summary: 'Test', project: { key: 'TEST' } } };
    await client.createIssue(data);
    expect(mockedAxios.post).toHaveBeenCalledWith('/rest/api/3/issue', data);
  });

  it('should call axios.put for updateIssue', async () => {
    mockedAxios.put.mockResolvedValue({ data: { key: 'TEST-3' } });
    const data = { fields: { summary: 'Updated' } };
    await client.updateIssue('TEST-3', data);
    expect(mockedAxios.put).toHaveBeenCalledWith('/rest/api/3/issue/TEST-3', data);
  });

  it('should call axios.delete for deleteIssue', async () => {
    mockedAxios.delete.mockResolvedValue({ data: {} });
    await client.deleteIssue('TEST-4');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/rest/api/3/issue/TEST-4');
  });
});
