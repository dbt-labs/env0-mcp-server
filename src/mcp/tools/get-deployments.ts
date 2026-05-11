import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Env0Service } from '../../env0-service/env0-service';
import {
  type GetDeploymentsParams,
  GetDeploymentsParamsSchema
} from '../schemas/get-deployments-params-schema';

export function registerGetDeploymentsTool(server: McpServer, env0Service: Env0Service): void {
  server.registerTool(
    'get-deployments',
    {
      title: 'Get Deployments',
      description:
        'List deployments for a specific environment from env0. ' +
        'Returns deployment history including status, timestamps, and deployment IDs ' +
        'that can be used with get-plan-logs and get-error-analysis for historical lookups.',
      inputSchema: GetDeploymentsParamsSchema.shape
    },
    async (params: GetDeploymentsParams) => {
      try {
        const deployments = await env0Service.getDeployments(params);

        if ((deployments as unknown[]).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No deployments found for this environment.'
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Deployments (${(deployments as unknown[]).length} found): ${JSON.stringify(deployments)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching deployments: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
