"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfluenceConfig = getConfluenceConfig;
/**
 * Extracts Confluence config from request headers or environment variables.
 * - X-Confluence-Base-Url: for base URL
 * - Authorization: Bearer <token> or X-Confluence-Token
 */
function getConfluenceConfig(req) {
    const baseUrl = req.headers['x-confluence-base-url'] || process.env.CONFLUENCE_BASE_URL || '';
    // Prefer Bearer token, fallback to X-Confluence-Token header
    let userToken = '';
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        userToken = authHeader.replace('Bearer ', '').trim();
    }
    else if (req.headers['x-confluence-token']) {
        userToken = req.headers['x-confluence-token'];
    }
    else if (process.env.CONFLUENCE_USER_TOKEN) {
        userToken = process.env.CONFLUENCE_USER_TOKEN;
    }
    return { baseUrl, userToken };
}
