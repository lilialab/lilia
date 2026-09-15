import { apiFetchJson } from '@/lib/client/api-fetch';
import { afterEach, describe, expect, it, vi } from 'vitest';

function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('json 写成 JSON body 和 Content-Type', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonOk({ ok: true })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetchJson('/api/x', { method: 'POST', json: { a: 1 } })).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/x',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ a: 1 }),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers;
    expect(new Headers(headers).get('Content-Type')).toBe('application/json');
  });

  it('FormData 不设 JSON Content-Type', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonOk({ ok: true })
    );
    vi.stubGlobal('fetch', fetchMock);

    const form = new FormData();
    form.append('file', new Blob(['x']), 'x.txt');
    await apiFetchJson('/api/x', { method: 'POST', body: form });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBe(form);
    expect(new Headers(init?.headers).get('Content-Type')).toBeNull();
  });
});
