import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Env0Service } from '../../env0-service/env0-service';
import {
  type GetEnvironmentsParams,
  GetEnvironmentsParamsSchema
} from '../schemas/get-environments-params-schema';
import _ from 'lodash';

// Strip noisy fields from an environment object to reduce token usage.
// Removes: variables (large sensitive arrays), full latestDeploymentLog (replaced with summary),
// providerVersions (replaced with count+names), moduleVersions (replaced with count).
function slimEnvironment(env: Record<string, unknown>): Record<string, unknown> {
  const slim = { ...env };

  delete slim.variables;

  // Replace full latestDeploymentLog with a compact summary
  if (slim.latestDeploymentLog && typeof slim.latestDeploymentLog === 'object') {
    const log = slim.latestDeploymentLog as Record<string, unknown>;
    const comment = typeof log.comment === 'string' ? log.comment.slice(0, 200) : log.comment;
    slim.latestDeploymentLog = {
      id: log.id,
      status: log.status,
      planSummary: log.planSummary,
      createdAt: log.createdAt,
      finishedAt: log.finishedAt,
      type: log.type,
      comment,
      blueprintRevision: log.blueprintRevision,
      resourceCount: log.resourceCount,
      triggerName: log.triggerName,
      gitMetadata: env.gitMetadata
    };
  }

  // Collapse providerVersions to count + short names
  if (slim.providerVersions && typeof slim.providerVersions === 'object' && !Array.isArray(slim.providerVersions)) {
    const entries = Object.keys(slim.providerVersions as Record<string, string>);
    slim.providerVersions = {
      count: entries.length,
      providers: entries.map(k => k.replace(/^registry\.opentofu\.org\//, '').replace(/^registry\.terraform\.io\//, ''))
    };
  }

  // Collapse moduleVersions to count only
  if (slim.moduleVersions && typeof slim.moduleVersions === 'object' && !Array.isArray(slim.moduleVersions)) {
    slim.moduleVersions = { count: Object.keys(slim.moduleVersions as Record<string, string>).length };
  }

  return slim;
}

const getEnvironments = async (
  env0Service: Env0Service,
  params: GetEnvironmentsParams
): Promise<object[]> => {
  if (!_.isNil(params.environmentId)) {
    const environment = await env0Service.getEnvironment(params.environmentId);
    return [slimEnvironment(environment as Record<string, unknown>)];
  }

  const environments = await env0Service.getEnvironments(params);
  return (environments as Record<string, unknown>[]).map(slimEnvironment);
};

export function registerGetEnvironmentsTool(server: McpServer, env0Service: Env0Service): void {
  server.registerTool(
    'get-environments',
    {
      title: 'Get Environments',
      description: 'Get the environments from env0',
      inputSchema: GetEnvironmentsParamsSchema.shape
    },
    async (params: GetEnvironmentsParams) => {
      try {
        const environments = await getEnvironments(env0Service, params);

        if (environments.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No environments found.'
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Environments (${environments.length} found): ${JSON.stringify(environments)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching environments: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
