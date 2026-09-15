import { updateCharacterListedBodySchema } from '@/schemas/api/characters/listed-patch';
import { describe, expect, it } from 'vitest';

describe('updateCharacterListedBodySchema', () => {
  it('接受布尔 isListed', () => {
    expect(updateCharacterListedBodySchema.parse({ isListed: false })).toEqual({
      isListed: false,
    });
    expect(updateCharacterListedBodySchema.parse({ isListed: true })).toEqual({
      isListed: true,
    });
  });

  it('拒绝非布尔', () => {
    expect(() => updateCharacterListedBodySchema.parse({ isListed: 'false' })).toThrow();
  });
});
