import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Env0Service } from '../../env0-service/env0-service';
import {
  type GetDeploymentStepLogParams,
  GetDeploymentStepLogSchema
} from '../schemas/get-deployment-step-log-schema';

export function registerGetDeploymentStepLogTool(
  server: McpServer,
  env0Service: Env0Service
): void {
  server.registerTool(
    'get-deployment-step-log',
    {
      title: 'Get Deployment Step Log',
      description:
        'Get logs for a specific step of a deployment (e.g. Init, Plan, Apply). ' +
        'Use get-deployment-steps to discover available step names. ' +
        'Returns the last 150 events by default — set tail higher for more context.',
      inputSchema: GetDeploymentStepLogSchema.shape
    },
    async (params: GetDeploymentStepLogParams) => {
      try {
        const defaultTail = 150;
        const tailCount = params.tail ?? defaultTail;

        const fullLog = (await env0Service.getDeploymentStepLog(
          params.deploymentId,
          params.stepName
        )) as { events: object[]; totalEvents: number };

        if (fullLog.totalEvents <= tailCount) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(fullLog)
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                events: fullLog.events.slice(-tailCount),
                totalEvents: fullLog.totalEvents,
                truncated: true,
                showing: `last ${tailCount} of ${fullLog.totalEvents} events (pass a higher tail value to see more)`
              })
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching step log: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
