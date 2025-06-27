import { ConfluenceClient, confluenceErrorHandler } from '../../src/clients/confluenceClient';
import axios, { AxiosInstance } from 'axios';
import { UpdatePageRequest } from '../../src/types/confluenceClient.type';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConfluenceClient', () => {
  const config = { baseUrl: 'https://example.atlassian.net', token: 'token', username: 'user' };
  let client: ConfluenceClient;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios as unknown as AxiosInstance);
    client = new ConfluenceClient(config);
  });

  it('should create an instance', () => {
    expect(client).toBeInstanceOf(ConfluenceClient);
  });

  it('should call axios.get for getPage', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 123, body: { storage: { value: '<p>Test</p>' } }, title: 'Test Page' } });
    const result = await client.getPage({ id: '123'});
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/pages/123', { data: { id: '123' } });
    expect(result.data.id).toBe(123);
  });

  it('should call axios.put for updatePage', async () => {
    mockedAxios.put.mockResolvedValue({ data: { id: 123, title: 'Updated' } });
    const data: UpdatePageRequest = {
      id: '123',
      title: 'Updated',
      body: { representation: 'storage', value: '<p>Updated</p>' },
      version: { number: 2 },
      status: 'current'
    };
    await client.updatePage(123, data);
    expect(mockedAxios.put).toHaveBeenCalledWith('/wiki/api/v2/pages/123', data);
  });

  it('should call axios.get for getChildren', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.getChildren(123);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/pages/123/children');
  });

  it('should call axios.get for getFolder', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 1 } });
    await client.getFolder(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/folders/1');
  });

  it('should call axios.get for getSpace', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 1 } });
    await client.getSpace(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces/1');
  });

  it('should call axios.get for listSpaces', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.listSpaces(0, 10);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces', { params: { start: 0, limit: 10 } });
  });

  it('should call axios.post for createPage', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'newpage' } });
    await client.createPage({ spaceId: '1', title: 'New', body: { representation: 'storage', value: '<p>Body</p>' } });
    expect(mockedAxios.post).toHaveBeenCalledWith('/wiki/api/v2/pages', expect.any(Object));
  });

  it('should call axios.delete for deletePage', async () => {
    mockedAxios.delete.mockResolvedValue({ data: {} });
    await client.deletePage(123);
    expect(mockedAxios.delete).toHaveBeenCalledWith('/wiki/api/v2/pages/123');
  });

  it('should call axios.get for searchWithCql', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.searchWithCql('type=page', 10, 0);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/rest/api/content/search', { params: { cql: 'type=page', limit: 10, start: 0 } });
  });

  it('should call createPage with parentId', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'childpage' } });
    await client.createPage({ spaceId: '1', title: 'Child', body: { representation: 'storage', value: '<p>Body</p>' }, parentId: '123' });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/wiki/api/v2/pages',
      expect.objectContaining({ parentId: '123' })
    );
  });

  it('should call listSpaces with no params', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.listSpaces();
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces', { params: {} });
  });

  it('should call searchWithCql with only cql', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.searchWithCql('type=page');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/rest/api/content/search', { params: { cql: 'type=page' } });
  });
});

describe('confluenceErrorHandler', () => {
  it('logs error with response', async () => {
    const error = {
      response: { status: 404, data: 'Not found' },
      config: { url: '/wiki/api/v2/pages/404' }
    };
    const spy = jest.spyOn(console, 'error').mockImplementation();
    await expect(confluenceErrorHandler(error)).rejects.toBe(error);
    expect(spy).toHaveBeenCalledWith('[Confluence API Error]', {
      url: '/wiki/api/v2/pages/404',
      status: 404,
      data: '"Not found"',
    });
    spy.mockRestore();
  });
  it('logs error without response', async () => {
    const error = { message: 'Network Error' };
    const spy = jest.spyOn(console, 'error').mockImplementation();
    await expect(confluenceErrorHandler(error)).rejects.toBe(error);
    expect(spy).toHaveBeenCalledWith('[Confluence API Error]', 'Network Error');
    spy.mockRestore();
  });
});
