import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Env0Service } from '../../env0-service/env0-service';
import {
  type GetDeploymentStepsParams,
  GetDeploymentStepsSchema
} from '../schemas/get-deployment-steps-schema';

export function registerGetDeploymentStepsTool(server: McpServer, env0Service: Env0Service): void {
  server.registerTool(
    'get-deployment-steps',
    {
      title: 'Get Deployment Steps',
      description:
        'List the steps (init, plan, apply, etc.) for a specific deployment. ' +
        'Each step has a name, status, and timestamps. Use the step name with ' +
        'get-deployment-step-log to fetch logs for any step — not just the plan.',
      inputSchema: GetDeploymentStepsSchema.shape
    },
    async (params: GetDeploymentStepsParams) => {
      try {
        const steps = await env0Service.getDeploymentSteps(params.deploymentId);

        if ((steps as unknown[]).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No steps found for this deployment.'
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Steps (${(steps as unknown[]).length} found): ${JSON.stringify(steps)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching deployment steps: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
