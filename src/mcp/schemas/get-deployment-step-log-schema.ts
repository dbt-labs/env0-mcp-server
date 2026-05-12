import z from 'zod';

export const GetDeploymentStepLogSchema = z.object({
  deploymentId: z.string().describe('The ID of the deployment'),
  stepName: z
    .string()
    .describe('The name of the step to get logs for (e.g. "Init", "Plan", "Apply")'),
  tail: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Return only the last N log events. Defaults to 150. Set higher to see more context.')
});

export type GetDeploymentStepLogParams = z.infer<typeof GetDeploymentStepLogSchema>;
