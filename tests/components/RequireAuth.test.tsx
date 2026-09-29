import { LoginForm } from '@/app/login/LoginForm';
import type { AuthUser } from '@/client-api/auth';
import { I18nProvider } from '@/components/I18nProvider';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { useRequiredUser } from '@/hooks/useRequiredUser';
import { queryKeys } from '@/lib/client/query-keys';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, refreshMock, currentUser, loginMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  loginMock: vi.fn(),
  currentUser: { value: null as AuthUser | null },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/client-api/auth', () => ({
  login: loginMock,
  createAnonymousAccount: vi.fn(),
  fetchCurrentUser: async () => currentUser.value,
}));

/** 替身 widget：jsdom 跑不了真实 Turnstile，挂载后直接交出 token。 */
vi.mock('@/components/auth/TurnstileWidget', () => ({
  TurnstileWidget: ({ onTokenChange }: { onTokenChange: (token: string | null) => void }) => {
    useEffect(() => {
      onTokenChange('test-token');
    }, [onTokenChange]);

    return null;
  },
}));

const anonymousUser: AuthUser = {
  id: 'user-anon',
  account: 'u_K7M3PQ2XB9',
  nickname: '安静的猫',
  hasAvatar: false,
  hasPassword: false,
  locale: 'zh',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

const savedUser: AuthUser = {
  ...anonymousUser,
  id: 'user-saved',
  account: 'realaccount',
  nickname: '真人',
  hasPassword: true,
};

/** 模拟「保存账号」引导条：判据与 ContactsScreen 一致。 */
function SaveAccountBanner() {
  const { user } = useAuth();

  return user?.hasPassword === false ? <p>保存账号</p> : null;
}

/** 门闸下的假页面：像真实页面一样在渲染期直接解引用 user。 */
function FakePage() {
  const user = useRequiredUser();
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push('/login')}>
      {user.nickname}
    </button>
  );
}

function renderWithProviders(ui: React.ReactNode, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );
}

describe('RequireAuth 门闸', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    loginMock.mockReset();
    currentUser.value = anonymousUser;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // 直接写缓存喂出「已登录」态，避免真实请求 /api/auth/me
    queryClient.setQueryData(queryKeys.authMe, anonymousUser);
  });

  it('已有用户时放行子树，且 user 可直接解引用', async () => {
    renderWithProviders(
      <RequireAuth>
        <FakePage />
      </RequireAuth>,
      queryClient,
    );

    expect(screen.getByText('安静的猫')).toBeTruthy();

    await act(async () => {
      screen.getByText('安静的猫').click();
    });

    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('登录成功后丢弃上一个用户的缓存，换页重挂不再显示其「保存账号」引导条', async () => {
    loginMock.mockImplementation(async () => {
      currentUser.value = savedUser;
    });

    // 受保护页（上一会话）此刻显示引导条
    const banner = renderWithProviders(<SaveAccountBanner />, queryClient);
    expect(screen.getByText('保存账号')).toBeTruthy();
    banner.unmount();

    // 走真实的登录表单：成功后 LoginForm 会调用 useResetAuthCache
    renderWithProviders(<LoginForm turnstileSiteKey="test-site-key" />, queryClient);

    // 登录表单默认折叠（首屏只留匿名入口），先展开再填
    fireEvent.click(screen.getByText('已有账号？登录'));

    fireEvent.change(screen.getByPlaceholderText('请输入账号'), {
      target: { value: 'realaccount' },
    });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), {
      target: { value: 'password123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('登录', { selector: 'button[type="submit"]' }));
    });

    expect(loginMock).toHaveBeenCalledWith({
      account: 'realaccount',
      password: 'password123',
      turnstileToken: 'test-token',
    });
    // 上一个用户的缓存必须已被整条丢弃（否则受保护页重挂时会先渲染旧账号）
    expect(queryClient.getQueryData(queryKeys.authMe)).toBeUndefined();

    // 换页重挂受保护页：读到的是新会话，不该再出现引导条
    renderWithProviders(<SaveAccountBanner />, queryClient);

    await waitFor(() => {
      expect(screen.queryByText('保存账号')).toBeNull();
    });
  });
});
