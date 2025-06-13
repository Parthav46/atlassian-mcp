import { registerJiraTools } from "./registerJiraTools";
import { registerPageTools } from "./registerPageTools";
import { registerSpaceTools } from "./registerSpaceTools";
import { registerCqlTools } from "./registerCqlTools";

function getAtlassianConfig() {
  // Use --base-url, --user-token, --username for both
  let baseUrl = '';
  let userToken = '';
  let username = '';
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--base-url' && process.argv[i + 1]) {
      baseUrl = process.argv[i + 1];
    }
    if (process.argv[i] === '--user-token' && process.argv[i + 1]) {
      userToken = process.argv[i + 1];
    }
    if (process.argv[i] === '--username' && process.argv[i + 1]) {
      username = process.argv[i + 1];
    }
  }
  if (!baseUrl) baseUrl = process.env.BASE_URL || '';
  if (!userToken) userToken = process.env.USER_TOKEN || '';
  if (!username) username = process.env.USERNAME || '';
  return Object.freeze({ baseUrl, userToken, username });
}

export function registerTools(server: any) {
  const config = getAtlassianConfig();
  registerPageTools(server, config);
  registerSpaceTools(server, config);
  registerCqlTools(server, config);
  registerJiraTools(server, config);
}
