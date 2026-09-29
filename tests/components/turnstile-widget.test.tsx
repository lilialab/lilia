import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `next/script` 的 `onReady` 只在脚本这次加载完成时触发一次。
 * 这里刻意照这个语义 mock：加载完成前什么都不做，加载完成时只触发一次 `onReady`。
 */
const { onReadyCalls, scriptState } = vi.hoisted(() => ({
  onReadyCalls: { count: 0 },
  scriptState: { loaded: false },
}));

vi.mock('next/script', () => ({
  default: ({ onReady }: { onReady?: () => void }) => {
    if (scriptState.loaded && onReadyCalls.count === 0 && onReady) {
      onReadyCalls.count += 1;
      onReady();
    }

    return null;
  },
}));

/** 模拟 api.js：`render` 记录调用、`remove` 清掉容器内容。 */
function installFakeTurnstile() {
  const renderMock = vi.fn((container: HTMLElement) => {
    container.textContent = 'widget';
    return `widget-${renderMock.mock.calls.length}`;
  });

  window.turnstile = {
    render: renderMock,
    reset: vi.fn(),
    remove: vi.fn(),
  };

  return renderMock;
}

function renderWidget() {
  return render(
    createElement(TurnstileWidget, {
      siteKey: 'test-site-key',
      action: 'login',
      onTokenChange: vi.fn(),
    }),
  );
}

describe('TurnstileWidget 挂载', () => {
  beforeEach(() => {
    onReadyCalls.count = 0;
    scriptState.loaded = false;
    delete window.turnstile;
  });

  afterEach(() => {
    delete window.turnstile;
  });

  it('脚本加载完成时挂载 widget', () => {
    scriptState.loaded = true;
    const renderMock = installFakeTurnstile();

    const { container } = renderWidget();

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('widget');
  });

  it('客户端路由再进来时（脚本已在、onReady 不再触发）仍能挂载', () => {
    // 上一页已经把 api.js 加载完，且 onReady 已经消耗掉
    scriptState.loaded = true;
    onReadyCalls.count = 1;
    const renderMock = installFakeTurnstile();

    const first = renderWidget();
    expect(renderMock).toHaveBeenCalledTimes(1);

    // 换页：组件卸载后重新挂载，onReady 不会再触发
    first.unmount();
    renderWidget();

    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  it('脚本尚未加载时轮询等待，就绪后自动挂载', async () => {
    vi.useFakeTimers();
    const renderMock = installFakeTurnstile();

    // 把 api.js 藏起来，模拟脚本还在下载
    const api = window.turnstile;
    delete window.turnstile;

    const { container } = renderWidget();
    expect(renderMock).not.toHaveBeenCalled();

    window.turnstile = api;
    await vi.advanceTimersByTimeAsync(200);

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('widget');

    vi.useRealTimers();
  });

  it('脚本始终未就绪时不会留下跑不停的定时器', async () => {
    vi.useFakeTimers();
    const renderMock = installFakeTurnstile();
    delete window.turnstile;

    renderWidget().unmount();
    await vi.advanceTimersByTimeAsync(1000);

    expect(renderMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
  });
});
