import z from 'zod';

export const GetErrorAnalysisSchema = z.object({
  environmentId: z.string().describe('The ID of the environment to get error analysis for'),
  deploymentId: z
    .string()
    .optional()
    .describe(
      'The ID of a specific deployment to get error analysis for. If omitted, analyzes the latest deployment.'
    )
});

export type GetErrorAnalysisParams = z.infer<typeof GetErrorAnalysisSchema>;
