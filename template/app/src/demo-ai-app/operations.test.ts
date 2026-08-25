import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTask, updateTask, deleteTask } from './operations';

// Mock openai module
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn(),
        },
      };
    },
  };
});

// Mock Wasp server module
vi.mock('wasp/server', () => {
  class MockHttpError extends Error {
    constructor(public statusCode: number, message?: string) {
      super(message);
    }
  }
  return {
    HttpError: MockHttpError,
    prisma: {
      $transaction: vi.fn(),
    },
    env: {},
  };
});

// Mock validation helper
vi.mock('../server/validation', () => ({
  ensureArgsSchemaOrThrowHttpError: vi.fn((schema, args) => args),
}));

describe('Task Operations', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      user: { id: 'user-1' },
      entities: {
        Task: {
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
      },
    };
  });

  describe('createTask', () => {
    it('should create a task successfully when authenticated', async () => {
      const taskData = { description: 'Test Task' };
      const expectedTask = { id: 'task-1', description: 'Test Task', isDone: false, userId: 'user-1' };
      mockContext.entities.Task.create.mockResolvedValue(expectedTask);

      const result = await createTask(taskData, mockContext);

      expect(mockContext.entities.Task.create).toHaveBeenCalledWith({
        data: {
          description: 'Test Task',
          user: { connect: { id: 'user-1' } },
        },
      });
      expect(result).toEqual(expectedTask);
    });

    it('should throw 401 HttpError when context.user is missing', async () => {
      mockContext.user = null;
      await expect(createTask({ description: 'Test Task' }, mockContext)).rejects.toThrowError(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully when authenticated', async () => {
      const taskData = { id: 'task-1', isDone: true };
      const expectedTask = { id: 'task-1', description: 'Test Task', isDone: true, userId: 'user-1' };
      mockContext.entities.Task.update.mockResolvedValue(expectedTask);

      const result = await updateTask(taskData, mockContext);

      expect(mockContext.entities.Task.update).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          user: { id: 'user-1' },
        },
        data: {
          isDone: true,
          time: undefined,
        },
      });
      expect(result).toEqual(expectedTask);
    });

    it('should throw 401 HttpError when context.user is missing', async () => {
      mockContext.user = null;
      await expect(updateTask({ id: 'task-1', isDone: true }, mockContext)).rejects.toThrowError(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully when authenticated', async () => {
      const taskData = { id: 'task-1' };
      const expectedTask = { id: 'task-1', description: 'Test Task', isDone: false, userId: 'user-1' };
      mockContext.entities.Task.delete.mockResolvedValue(expectedTask);

      const result = await deleteTask(taskData, mockContext);

      expect(mockContext.entities.Task.delete).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          user: { id: 'user-1' },
        },
      });
      expect(result).toEqual(expectedTask);
    });

    it('should throw 401 HttpError when context.user is missing', async () => {
      mockContext.user = null;
      await expect(deleteTask({ id: 'task-1' }, mockContext)).rejects.toThrowError(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });
});
