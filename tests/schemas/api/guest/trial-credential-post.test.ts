import { issueGuestTrialCredentialBodySchema } from '@/schemas/api/guest/trial-credential-post';
import { describe, expect, it } from 'vitest';

describe('issueGuestTrialCredentialBodySchema', () => {
  it('允许省略 turnstileToken', () => {
    expect(issueGuestTrialCredentialBodySchema.parse({})).toEqual({});
  });

  it('接受非空 turnstileToken', () => {
    expect(
      issueGuestTrialCredentialBodySchema.parse({ turnstileToken: ' tok ' }),
    ).toEqual({ turnstileToken: 'tok' });
  });

  it('拒绝空 turnstileToken', () => {
    expect(() => issueGuestTrialCredentialBodySchema.parse({ turnstileToken: '  ' })).toThrow();
  });
});
