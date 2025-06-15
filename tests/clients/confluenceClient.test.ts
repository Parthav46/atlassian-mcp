import { ConfluenceClient, confluenceErrorHandler } from '../../src/clients/confluenceClient';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConfluenceClient', () => {
  const config = { baseUrl: 'https://example.atlassian.net', userToken: 'token', username: 'user' };
  let client: ConfluenceClient;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios as any);
    client = new ConfluenceClient(config);
  });

  it('should create an instance', () => {
    expect(client).toBeInstanceOf(ConfluenceClient);
  });

  it('should call axios.get for getPage', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: '123', body: { storage: { value: '<p>Test</p>' } }, title: 'Test Page' } });
    const result = await client.getPage('123');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/pages/123', { params: { 'body-format': 'storage' } });
    expect(result.data.id).toBe('123');
  });

  it('should call axios.put for updatePage', async () => {
    mockedAxios.put.mockResolvedValue({ data: { id: '123', title: 'Updated' } });
    const data = { title: 'Updated' };
    await client.updatePage('123', data);
    expect(mockedAxios.put).toHaveBeenCalledWith('/wiki/api/v2/pages/123', data);
  });

  it('should call axios.get for getChildren', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.getChildren('123');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/pages/123/children');
  });

  it('should call axios.get for getFolder', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 'folder1' } });
    await client.getFolder('folder1');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/folders/folder1');
  });

  it('should call axios.get for getSpace', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 'space1' } });
    await client.getSpace('space1');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces/space1');
  });

  it('should call axios.get for listSpaces', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.listSpaces(0, 10);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces', { params: { start: 0, limit: 10 } });
  });

  it('should call axios.post for createPage', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'newpage' } });
    const data = { spaceId: 'space1', title: 'New', body: '<p>Body</p>' };
    await client.createPage('space1', 'New', '<p>Body</p>');
    expect(mockedAxios.post).toHaveBeenCalledWith('/wiki/api/v2/pages', expect.any(Object));
  });

  it('should call axios.delete for deletePage', async () => {
    mockedAxios.delete.mockResolvedValue({ data: {} });
    await client.deletePage('delpage');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/wiki/api/v2/pages/delpage');
  });

  it('should call axios.get for searchPagesByTitle', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.searchPagesByTitle('Test');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/rest/api/content', { params: { title: 'Test' } });
  });

  it('should call axios.get for getPagesFromSpace', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.getPagesFromSpace('space1', 5, 'cursor1');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces/space1/pages', { params: { limit: 5, cursor: 'cursor1' } });
  });

  it('should call axios.get for searchWithCql', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.searchWithCql('type=page', 10, 0);
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/rest/api/content/search', { params: { cql: 'type=page', limit: 10, start: 0 } });
  });

  it('should call createPage with parentId', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: 'childpage' } });
    await client.createPage('space1', 'Child', '<p>Body</p>', 'parent1');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/wiki/api/v2/pages',
      expect.objectContaining({ parentId: 'parent1' })
    );
  });

  it('should call listSpaces with no params', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.listSpaces();
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces', { params: {} });
  });

  it('should call getPagesFromSpace with only spaceId', async () => {
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });
    await client.getPagesFromSpace('space1');
    expect(mockedAxios.get).toHaveBeenCalledWith('/wiki/api/v2/spaces/space1/pages', { params: {} });
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
      data: 'Not found',
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
