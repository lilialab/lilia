import { LoginForm } from '@/app/login/LoginForm';
import { I18nProvider } from '@/components/I18nProvider';
import { setLocale } from '@/i18n/locale-preference';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// vitest 未开 globals，RTL 的自动清理不会注册，得自己挂
afterEach(cleanup);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** 替身 widget：jsdom 跑不了真实 Turnstile，这里也不关心 token。 */
vi.mock('@/components/auth/TurnstileWidget', () => ({
  TurnstileWidget: () => null,
}));

function renderLoginForm() {
  // jsdom 的 navigator.language 是 en-US，不钉住语言偏好 I18nProvider 会渲染成英文
  setLocale('zh');

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <LoginForm turnstileSiteKey="test-site-key" />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe('登录页首屏', () => {
  it('默认折叠账号密码表单，只留匿名入口', () => {
    renderLoginForm();

    expect(screen.getByText('直接开始体验')).toBeTruthy();
    expect(screen.queryByPlaceholderText('请输入账号')).toBeNull();
    expect(screen.queryByPlaceholderText('请输入密码')).toBeNull();
  });

  it('点「已有账号？登录」展开表单，再点收起', () => {
    renderLoginForm();

    fireEvent.click(screen.getByText('已有账号？登录'));

    expect(screen.getByPlaceholderText('请输入账号')).toBeTruthy();
    expect(screen.getByPlaceholderText('请输入密码')).toBeTruthy();
    // 注册入口跟着登录表单一起折叠
    expect(screen.getByText('去注册')).toBeTruthy();

    fireEvent.click(screen.getByText('收起'));

    expect(screen.queryByPlaceholderText('请输入账号')).toBeNull();
  });
});
