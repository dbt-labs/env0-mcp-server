import z from 'zod';

export const GetDeploymentsParamsSchema = z.object({
  environmentId: z.string().describe('The ID of the environment to list deployments for'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Maximum number of deployments to return (default 10)'),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of deployments to skip for pagination'),
  statuses: z
    .string()
    .optional()
    .describe(
      'Comma-separated deployment statuses to filter by (e.g. "SUCCESS,FAILURE,IN_PROGRESS")'
    )
});

export type GetDeploymentsParams = z.infer<typeof GetDeploymentsParamsSchema>;
