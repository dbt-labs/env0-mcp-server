import type { AbortEnvironmentParams } from '../mcp/schemas/abort-environment-schema';
import type { ApproveEnvironmentParams } from '../mcp/schemas/approve-environment-schema';
import type { CancelEnvironmentParams } from '../mcp/schemas/cancel-environment-schema';
import type { DeployEnvironmentParams } from '../mcp/schemas/deploy-environment-schema';
import type { GetEnvironmentsParams } from '../mcp/schemas/get-environments-params-schema';
import type { GetDeploymentsParams } from '../mcp/schemas/get-deployments-params-schema';
import type { Env0Config } from './env0-client';
import type Env0Client from './env0-client';
import type { CloudConfiguration } from './models/cloud-configuration';
import type { CloudResourcesResponse } from './models/cloud-resource';
import type { GetCloudResourcesParams } from '../mcp/schemas/get-cloud-resources-params-schema';
import type { GetPlanLogsParams } from '../mcp/schemas/get-plan-logs-params-schema';
import type { GenerateIaCParams } from '../mcp/schemas/generate-iac-schema';
import type { CheckIaCJobStatusParams } from '../mcp/schemas/check-iac-job-status-schema';

export class Env0Service {
  private readonly config: Env0Config;
  private readonly env0Client: Env0Client;

  constructor(config: Env0Config, env0Client: Env0Client) {
    this.config = config;
    this.env0Client = env0Client;
  }

  async getCloudConfigurations(): Promise<CloudConfiguration[]> {
    return this.env0Client.request<CloudConfiguration[]>({
      url: '/mcp/cloud/configurations',
      params: { organizationId: this.config.organizationId || undefined }
    });
  }

  async getEnvironments(environmentParams: GetEnvironmentsParams): Promise<object[]> {
    return this.env0Client.request({
      url: '/mcp/environments',
      params: {
        organizationId: this.config.organizationId || undefined,
        projectId: environmentParams.projectId || undefined,
        name: environmentParams.name || undefined,
        limit: environmentParams.limit || undefined,
        offset: environmentParams.offset || undefined
      }
    });
  }

  async getEnvironment(environmentId: string): Promise<object> {
    return this.env0Client.request({
      url: `/mcp/environments/${environmentId}`
    });
  }

  async getCloudResources(params: GetCloudResourcesParams): Promise<CloudResourcesResponse> {
    return this.env0Client.request<CloudResourcesResponse>({
      url: '/mcp/cloud/resources',
      method: 'POST',
      data: {
        organizationId: this.config.organizationId || undefined,
        ...params
      }
    });
  }

  async getProjects(): Promise<object[]> {
    return this.env0Client.request({
      url: '/mcp/projects',
      params: {
        organizationId: this.config.organizationId || undefined
      }
    });
  }

  async getDeployments(params: GetDeploymentsParams): Promise<object[]> {
    return this.env0Client.request({
      url: `/environments/${params.environmentId}/deployments`,
      params: {
        limit: params.limit || undefined,
        offset: params.offset || undefined,
        statuses: params.statuses || undefined
      }
    });
  }

  async getDeploymentSteps(deploymentId: string): Promise<object[]> {
    return this.env0Client.request({
      url: `/deployments/${deploymentId}/steps`
    });
  }

  async getDeploymentStepLog(deploymentId: string, stepName: string): Promise<object> {
    return this.env0Client.request({
      url: `/deployments/${deploymentId}/steps/${encodeURIComponent(stepName)}/log`
    });
  }

  async getErrorAnalysis(environmentId: string, deploymentId?: string): Promise<object> {
    if (!deploymentId) {
      return this.env0Client.request({
        url: `/mcp/environments/${environmentId}/error-analysis`
      });
    }

    try {
      return await this.env0Client.request({
        url: `/deployments/${deploymentId}/error-analysis`
      });
    } catch {
      return this.env0Client.request({
        url: `/mcp/environments/${environmentId}/error-analysis`
      });
    }
  }

  async approveEnvironment({ environmentId }: ApproveEnvironmentParams): Promise<object> {
    return this.env0Client.request({
      url: `/mcp/environments/${environmentId}/resume`,
      method: 'PUT'
    });
  }

  async cancelEnvironment({ environmentId }: CancelEnvironmentParams): Promise<object> {
    return this.env0Client.request({
      url: `/mcp/environments/${environmentId}/cancel`,
      method: 'PUT'
    });
  }

  async abortEnvironment({ environmentId }: AbortEnvironmentParams): Promise<object> {
    return this.env0Client.request({
      url: `/mcp/environments/${environmentId}/abort`,
      method: 'POST'
    });
  }

  async deployEnvironment({
    environmentId,
    revision,
    comment
  }: DeployEnvironmentParams): Promise<object> {
    return this.env0Client.request({
      url: `/mcp/environments/${environmentId}/deployments`,
      method: 'POST',
      data: {
        revision,
        comment
      }
    });
  }

  async generateIaC(params: GenerateIaCParams): Promise<{ jobId: string }> {
    return this.env0Client.request<{ jobId: string }>({
      url: '/mcp/cloud/resources/generate-iac',
      method: 'POST',
      data: {
        organizationId: this.config.organizationId || undefined,
        cloudResourceIds: params.cloudResourceIds,
        iacType: params.iacType
      }
    });
  }

  async checkIaCJobStatus({ jobId }: CheckIaCJobStatusParams): Promise<object> {
    return this.env0Client.request({
      url: `/mcp/cloud/resources/generate-iac/${jobId}`,
      method: 'GET'
    });
  }

  async getPlanLogs({ environmentId, deploymentId }: GetPlanLogsParams): Promise<object> {
    if (!deploymentId) {
      return this.env0Client.request({
        url: `/mcp/environments/${environmentId}/plan/logs`
      });
    }

    const steps = await this.getDeploymentSteps(deploymentId);
    const planStep = (steps as { name: string }[]).find(
      s => s.name.toLowerCase() === 'plan' || s.name.toLowerCase().includes('plan')
    );

    if (!planStep) {
      return {
        error: 'No plan step found for this deployment',
        availableSteps: (steps as { name: string }[]).map(s => s.name)
      };
    }

    return this.getDeploymentStepLog(deploymentId, planStep.name);
  }
}
