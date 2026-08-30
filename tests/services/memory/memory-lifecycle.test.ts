import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUpdateMany,
  mockUpdate,
  mockCreate,
  mockCreateMany,
  mockDeleteMemories,
  mockAddMemories,
  mockTransactionUpdateMany,
  mockTransactionCreateMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockUpdateMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
  mockDeleteMemories: vi.fn(),
  mockAddMemories: vi.fn(),
  mockTransactionUpdateMany: vi.fn(),
  mockTransactionCreateMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    userMemory: {
      updateMany: mockUpdateMany,
      update: mockUpdate,
      create: mockCreate,
      createMany: mockCreateMany,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/services/memory/vector.service', () => ({
  VectorService: vi.fn().mockImplementation(function MockVectorService() {
    return {
      deleteMemories: mockDeleteMemories,
      addMemories: mockAddMemories,
    };
  }),
}));

import {
  applyMaintainMerge,
  createUserMemories,
  markMemoryMaintained,
  softDeleteMemories,
} from '@/services/memory/memory-lifecycle.service';

describe('softDeleteMemories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockDeleteMemories.mockResolvedValue(undefined);
  });

  it('updates mysql and deletes chroma vectors', async () => {
    await softDeleteMemories(['a', 'b']);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] }, isDeleted: false },
      data: { isDeleted: true },
    });
    expect(mockDeleteMemories).toHaveBeenCalledWith(['a', 'b']);
  });

  it('skips when ids empty', async () => {
    await softDeleteMemories([]);
    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockDeleteMemories).not.toHaveBeenCalled();
  });
});

describe('markMemoryMaintained', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('sets isMaintained true for active memory', async () => {
    await markMemoryMaintained('mem-1');

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'mem-1', isDeleted: false, isMaintained: false },
      data: { isMaintained: true },
    });
  });
});

describe('createUserMemories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMany.mockResolvedValue({ count: 2 });
    mockAddMemories.mockResolvedValue(undefined);
  });

  it('returns empty ids when inputs empty', async () => {
    const result = await createUserMemories([]);

    expect(result).toEqual({ ids: [] });
    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(mockAddMemories).not.toHaveBeenCalled();
  });

  it('creates batch with isMaintained false and syncs chroma', async () => {
    const result = await createUserMemories(
      [
        {
          userId: 'default',
          characterId: 'char-a',
          text: '用户喜欢跑步',
          type: 'preference',
          confidence: 0.9,
        },
        {
          userId: 'default',
          characterId: 'char-a',
          text: '用户是工程师',
          type: 'fact',
          confidence: 0.85,
        },
      ],
      { isMaintained: false },
    );

    expect(result.ids).toHaveLength(2);
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'default',
          characterId: 'char-a',
          text: '用户喜欢跑步',
          type: 'preference',
          confidence: 0.9,
          isMaintained: false,
        }),
        expect.objectContaining({
          userId: 'default',
          characterId: 'char-a',
          text: '用户是工程师',
          type: 'fact',
          confidence: 0.85,
          isMaintained: false,
        }),
      ]),
    });
    expect(mockAddMemories).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'default',
        characterId: 'char-a',
        text: '用户喜欢跑步',
        type: 'preference',
      }),
      expect.objectContaining({
        userId: 'default',
        characterId: 'char-a',
        text: '用户是工程师',
        type: 'fact',
      }),
    ]);
  });
});

describe('applyMaintainMerge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionUpdateMany.mockResolvedValue({ count: 2 });
    mockTransactionCreateMany.mockResolvedValue({ count: 1 });
    mockTransaction.mockImplementation(async (fn) =>
      fn({
        userMemory: {
          updateMany: mockTransactionUpdateMany,
          createMany: mockTransactionCreateMany,
        },
      })
    );
    mockDeleteMemories.mockResolvedValue(undefined);
    mockAddMemories.mockResolvedValue(undefined);
  });

  it('soft-deletes and creates in one mysql transaction, then syncs chroma', async () => {
    const result = await applyMaintainMerge({
      deleteIds: ['old-1', 'old-2'],
      newMemories: [
        {
          userId: 'default',
          characterId: 'char-a',
          text: '用户喜欢跑步',
          type: 'preference',
          confidence: 0.9,
        },
      ],
    });

    expect(result.ids).toHaveLength(1);
    expect(result.ids[0]).toBeTruthy();
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-1', 'old-2'] }, isDeleted: false },
      data: { isDeleted: true },
    });
    expect(mockTransactionCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'default',
          characterId: 'char-a',
          text: '用户喜欢跑步',
          isMaintained: true,
        }),
      ],
    });
    expect(mockDeleteMemories).toHaveBeenCalledWith(['old-1', 'old-2']);
    expect(mockAddMemories).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'default',
        characterId: 'char-a',
        text: '用户喜欢跑步',
        type: 'preference',
        confidence: 0.9,
      }),
    ]);
    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it('creates multiple maintained memories in one transaction', async () => {
    mockTransactionCreateMany.mockResolvedValue({ count: 2 });

    const result = await applyMaintainMerge({
      deleteIds: ['old-1', 'old-2', 'old-3'],
      newMemories: [
        {
          userId: 'default',
          characterId: 'char-a',
          text: '用户喜欢跑步',
          type: 'preference',
          confidence: 0.9,
        },
        {
          userId: 'default',
          characterId: 'char-a',
          text: '用户住在上海',
          type: 'fact',
          confidence: 0.85,
        },
      ],
    });

    expect(result.ids).toHaveLength(2);
    expect(mockTransactionCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          text: '用户喜欢跑步',
          characterId: 'char-a',
          isMaintained: true,
        }),
        expect.objectContaining({
          text: '用户住在上海',
          characterId: 'char-a',
          isMaintained: true,
        }),
      ]),
    });
    expect(mockAddMemories).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'default',
        characterId: 'char-a',
        text: '用户喜欢跑步',
      }),
      expect.objectContaining({
        userId: 'default',
        characterId: 'char-a',
        text: '用户住在上海',
      }),
    ]);
  });
});
