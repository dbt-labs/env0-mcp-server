import { z } from 'zod';

export const GetPlanLogsParamsSchema = z.object({
  environmentId: z.string().describe('The ID of the environment to get plan logs for'),
  deploymentId: z
    .string()
    .optional()
    .describe(
      'The ID of a specific deployment to get plan logs for. If omitted, returns logs for the latest deployment.'
    ),
  tail: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Return only the last N log events (the plan summary is always at the end). ' +
        'Defaults to 150. Set higher to see more context, e.g. moved blocks or full refresh output. ' +
        'Use get-deployment-steps to see all available steps if you need init or apply logs.'
    )
});

export type GetPlanLogsParams = z.infer<typeof GetPlanLogsParamsSchema>;
