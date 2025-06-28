import express, { Express } from 'express';
import { Server } from 'http';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class MockAtlassianServer {
  private app: Express;
  private server: Server | null = null;
  private port: number;
  private routes: Map<string, any> = new Map();

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.app.use(express.json());
    this.setupDefaultRoutes();
  }

  private setupDefaultRoutes() {
    // Note: Don't add default 404 handler here as it would intercept all routes
    // Instead, specific routes will be added first, then 404 handler if needed
  }

  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          const baseUrl = `http://localhost:${this.port}`;
          // Removed console.log to avoid race conditions in tests
          resolve(baseUrl);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            // Removed console.log to avoid race conditions in tests
            this.server = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async restart(): Promise<string> {
    if (this.server) {
      await this.stop();
    }
    return await this.start();
  }

  // Jira mock endpoints
  mockJiraIssue(issueKey: string, issueData: any, statusCode: number = 200) {
    this.app.get(`/rest/api/3/issue/${issueKey}`, (req, res) => {
      res.status(statusCode).json(issueData);
    });
  }

  mockJiraSearch(searchData: any, statusCode: number = 200) {
    this.app.post('/rest/api/3/search/jql', (req, res) => {
      res.status(statusCode).json(searchData);
    });
  }

  mockJiraCreateIssue(responseData: any, statusCode: number = 201) {
    this.app.post('/rest/api/3/issue', (req, res) => {
      res.status(statusCode).json(responseData);
    });
  }

  mockJiraUpdateIssue(issueKey: string, statusCode: number = 204) {
    this.app.put(`/rest/api/3/issue/${issueKey}`, (req, res) => {
      res.status(statusCode).send();
    });
  }

  mockJiraDeleteIssue(issueKey: string, statusCode: number = 204) {
    this.app.delete(`/rest/api/3/issue/${issueKey}`, (req, res) => {
      res.status(statusCode).send();
    });
  }

  // Confluence mock endpoints
  mockConfluencePage(pageId: string, pageData: any, statusCode: number = 200) {
    this.app.get(`/wiki/api/v2/pages/${pageId}`, (req, res) => {
      res.status(statusCode).json(pageData);
    });
  }

  mockConfluenceChildren(pageId: string, childrenData: any, statusCode: number = 200) {
    this.app.get(`/wiki/api/v2/pages/${pageId}/children`, (req, res) => {
      res.status(statusCode).json(childrenData);
    });
  }

  mockConfluenceSpaces(spacesData: any, statusCode: number = 200) {
    this.app.get('/wiki/api/v2/spaces', (req, res) => {
      res.status(statusCode).json(spacesData);
    });
  }

  mockConfluenceSpace(spaceId: string, spaceData: any, statusCode: number = 200) {
    this.app.get(`/wiki/api/v2/spaces/${spaceId}`, (req, res) => {
      res.status(statusCode).json(spaceData);
    });
  }

  mockConfluenceCreatePage(responseData: any, statusCode: number = 201) {
    this.app.post('/wiki/api/v2/pages', (req, res) => {
      res.status(statusCode).json(responseData);
    });
  }

  mockConfluenceUpdatePage(pageId: string, responseData: any, statusCode: number = 200) {
    this.app.put(`/wiki/api/v2/pages/${pageId}`, (req, res) => {
      res.status(statusCode).json(responseData);
    });
  }

  mockConfluenceDeletePage(pageId: string, statusCode: number = 204) {
    this.app.delete(`/wiki/api/v2/pages/${pageId}`, (req, res) => {
      res.status(statusCode).send();
    });
  }

  mockConfluenceSearch(searchData: any, statusCode: number = 200) {
    this.app.get('/wiki/rest/api/content/search', (req, res) => {
      res.status(statusCode).json(searchData);
    });
  }

  // Add CQL search endpoint (different from content search)
  mockConfluenceCqlSearch(searchData: any, statusCode: number = 200) {
    this.app.get('/wiki/rest/api/content/search', (req, res) => {
      res.status(statusCode).json(searchData);
    });
  }

  mockConfluenceFolder(folderId: string, folderData: any, statusCode: number = 200) {
    this.app.get(`/wiki/api/v2/folders/${folderId}`, (req, res) => {
      res.status(statusCode).json(folderData);
    });
  }

  // Generic error responses
  mockError(path: string, method: string, statusCode: number, errorData: any) {
    const methodLower = method.toLowerCase() as keyof Express;
    (this.app as any)[methodLower](path, (req: any, res: any) => {
      res.status(statusCode).json(errorData);
    });
  }

  // Clear all routes (useful for test isolation)
  async clearRoutes(): Promise<string> {
    // Restart the server completely to clear all routes
    if (this.server) {
      await this.stop();
    }
    
    // Create a fresh Express app
    this.app = express();
    this.app.use(express.json());
    this.setupDefaultRoutes();
    this.routes.clear();
    
    // Restart the server with the fresh app
    return await this.start();
  }

  // Add a catch-all 404 handler after all specific routes are set up
  addDefaultHandler() {
    this.app.use((req, res) => {
      res.status(404).json({
        errorMessages: ['Endpoint not mocked']
      });
    });
  }
}
