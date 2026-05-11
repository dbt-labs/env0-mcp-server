import { z } from 'zod';

export const GetPlanLogsParamsSchema = z.object({
  environmentId: z.string().describe('The ID of the environment to get plan logs for'),
  deploymentId: z
    .string()
    .optional()
    .describe(
      'The ID of a specific deployment to get plan logs for. If omitted, returns logs for the latest deployment.'
    )
});

export type GetPlanLogsParams = z.infer<typeof GetPlanLogsParamsSchema>;
