import { z } from 'zod';

export const issueGuestTrialCredentialBodySchema = z.object({
  turnstileToken: z.string().trim().min(1).optional(),
});

export type IssueGuestTrialCredentialBody = z.infer<typeof issueGuestTrialCredentialBodySchema>;
