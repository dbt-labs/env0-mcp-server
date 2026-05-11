import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Env0Service } from '../../env0-service/env0-service';
import {
  type GetErrorAnalysisParams,
  GetErrorAnalysisSchema
} from '../schemas/get-error-analysis-schema';

export function registerGetErrorAnalysisTool(server: McpServer, env0Service: Env0Service): void {
  server.registerTool(
    'get-error-analysis',
    {
      title: 'Get Error Analysis',
      description:
        "Analyzes errors in an environment's deployment. " +
        'Optionally specify a deploymentId to analyze a specific historical deployment. ' +
        'Use get-deployments to find deployment IDs. If omitted, analyzes the latest deployment.',
      inputSchema: GetErrorAnalysisSchema.shape
    },
    async ({ environmentId, deploymentId }: GetErrorAnalysisParams) => {
      try {
        const errorAnalysis = await env0Service.getErrorAnalysis(environmentId, deploymentId);

        return {
          content: [
            {
              type: 'text',
              text: `Got error analysis result: ${JSON.stringify(errorAnalysis)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting error analysis result: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
