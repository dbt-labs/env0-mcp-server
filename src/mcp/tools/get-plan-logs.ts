import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Env0Service } from '../../env0-service/env0-service';
import {
  type GetPlanLogsParams,
  GetPlanLogsParamsSchema
} from '../schemas/get-plan-logs-params-schema';

export function registerGetPlanLogsTool(server: McpServer, env0Service: Env0Service): void {
  server.registerTool(
    'get-plan-logs',
    {
      title: 'Get Plan Logs',
      description:
        'Get plan logs for a specific environment from env0. ' +
        'Returns the last 150 log events by default (plan summary is always at the end). ' +
        'Set tail to a higher value to see more context (e.g. moved blocks, full refresh output). ' +
        'Optionally specify a deploymentId for a specific historical deployment (use get-deployments to find IDs).',
      inputSchema: GetPlanLogsParamsSchema.shape
    },
    async (params: GetPlanLogsParams) => {
      try {
        const logs = await env0Service.getPlanLogs(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(logs)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching plan logs: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
