import z from 'zod';

export const GetDeploymentStepsSchema = z.object({
  deploymentId: z.string().describe('The ID of the deployment to get steps for')
});

export type GetDeploymentStepsParams = z.infer<typeof GetDeploymentStepsSchema>;
