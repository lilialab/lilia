import { formatMessage, getMessages } from '@/i18n/catalog';
import { describe, expect, it } from 'vitest';

describe('getMessages', () => {
  it('按语言返回对应目录', () => {
    expect(getMessages('en').settings.language).toBe('Language');
    expect(getMessages('zh').settings.language).toBe('语言');
  });
});

describe('formatMessage', () => {
  it('无 params 时原样返回', () => {
    expect(formatMessage('Hello')).toBe('Hello');
  });

  it('替换已有占位符', () => {
    expect(formatMessage('Added {name}', { name: 'Arbor' })).toBe('Added Arbor');
  });

  it('缺失的占位符保持原样', () => {
    expect(formatMessage('Hi {name}', {})).toBe('Hi {name}');
  });
});
