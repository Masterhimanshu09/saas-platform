import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lemonSqueezyWebhook } from './webhook';
import crypto from 'crypto';
import { getCustomer } from '@lemonsqueezy/lemonsqueezy.js';
import { parseWebhookPayload } from './webhookPayload';
import { updateUserLemonSqueezyPaymentDetails } from './paymentDetails';

// Mock dependencies
vi.mock('wasp/server', () => {
  class MockHttpError extends Error {
    constructor(public statusCode: number, message?: string) {
      super(message);
    }
  }
  return {
    HttpError: MockHttpError,
    env: {
      LEMONSQUEEZY_WEBHOOK_SECRET: 'test-secret',
      PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID: 'hobby-variant-123',
      PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID: 'pro-variant-123',
      PAYMENTS_CREDITS_10_PLAN_ID: 'credits-variant-123',
    },
  };
});

vi.mock('./webhookPayload', () => ({
  parseWebhookPayload: vi.fn(),
}));

vi.mock('./paymentDetails', () => ({
  updateUserLemonSqueezyPaymentDetails: vi.fn(),
}));

vi.mock('@lemonsqueezy/lemonsqueezy.js', () => ({
  getCustomer: vi.fn(),
}));

describe('Lemon Squeezy Webhook', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      body: Buffer.from('{"test":"body"}'),
      get: vi.fn((header) => {
        if (header === 'X-Signature') {
          return crypto
            .createHmac('sha256', 'test-secret')
            .update('{"test":"body"}')
            .digest('hex');
        }
        return null;
      }),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockContext = {
      entities: {
        User: {},
      },
    };
  });

  it('should reject tampered/invalid signature with 400', async () => {
    mockRequest.get = vi.fn((header) => {
      if (header === 'X-Signature') {
        return 'a'.repeat(64);
      }
      return null;
    });

    await lemonSqueezyWebhook(mockRequest, mockResponse, mockContext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid signature' })
    );
  });

  it('should handle order_created event correctly', async () => {
    const mockOrderPayload = {
      eventName: 'order_created',
      meta: { custom_data: { user_id: 'user-1' } },
      data: {
        attributes: {
          customer_id: 12345,
          status: 'paid',
          first_order_item: { variant_id: 'hobby-variant-123' },
          order_number: 1,
        },
      },
    };

    vi.mocked(parseWebhookPayload).mockResolvedValue(mockOrderPayload as any);
    vi.mocked(getCustomer).mockResolvedValue({
      data: {
        data: {
          attributes: {
            urls: {
              customer_portal: 'https://customer-portal-url.com',
            },
          },
        },
      },
    } as any);

    await lemonSqueezyWebhook(mockRequest, mockResponse, mockContext);

    expect(updateUserLemonSqueezyPaymentDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        lemonSqueezyId: '12345',
        userId: 'user-1',
        lemonSqueezyCustomerPortalUrl: 'https://customer-portal-url.com',
      }),
      mockContext.entities.User
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it('should handle subscription_created event correctly', async () => {
    const mockSubscriptionPayload = {
      eventName: 'subscription_created',
      meta: { custom_data: { user_id: 'user-1' } },
      data: {
        attributes: {
          customer_id: 12345,
          status: 'active',
          variant_id: 'pro-variant-123',
        },
      },
    };

    vi.mocked(parseWebhookPayload).mockResolvedValue(mockSubscriptionPayload as any);

    await lemonSqueezyWebhook(mockRequest, mockResponse, mockContext);

    expect(updateUserLemonSqueezyPaymentDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        lemonSqueezyId: '12345',
        userId: 'user-1',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
      }),
      mockContext.entities.User
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it('should handle subscription_updated event correctly', async () => {
    const mockSubscriptionPayload = {
      eventName: 'subscription_updated',
      meta: { custom_data: { user_id: 'user-1' } },
      data: {
        attributes: {
          customer_id: 12345,
          status: 'past_due',
          variant_id: 'pro-variant-123',
        },
      },
    };

    vi.mocked(parseWebhookPayload).mockResolvedValue(mockSubscriptionPayload as any);

    await lemonSqueezyWebhook(mockRequest, mockResponse, mockContext);

    expect(updateUserLemonSqueezyPaymentDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        lemonSqueezyId: '12345',
        userId: 'user-1',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'past_due',
      }),
      mockContext.entities.User
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it('should handle subscription_cancelled event correctly', async () => {
    const mockSubscriptionPayload = {
      eventName: 'subscription_cancelled',
      meta: { custom_data: { user_id: 'user-1' } },
      data: {
        attributes: {
          customer_id: 12345,
          status: 'cancelled',
          variant_id: 'pro-variant-123',
        },
      },
    };

    vi.mocked(parseWebhookPayload).mockResolvedValue(mockSubscriptionPayload as any);

    await lemonSqueezyWebhook(mockRequest, mockResponse, mockContext);

    expect(updateUserLemonSqueezyPaymentDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        lemonSqueezyId: '12345',
        userId: 'user-1',
        subscriptionStatus: 'cancel_at_period_end',
      }),
      mockContext.entities.User
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it('should handle subscription_expired event correctly', async () => {
    const mockSubscriptionPayload = {
      eventName: 'subscription_expired',
      meta: { custom_data: { user_id: 'user-1' } },
      data: {
        attributes: {
          customer_id: 12345,
          status: 'expired',
          variant_id: 'pro-variant-123',
        },
      },
    };

    vi.mocked(parseWebhookPayload).mockResolvedValue(mockSubscriptionPayload as any);

    await lemonSqueezyWebhook(mockRequest, mockResponse, mockContext);

    expect(updateUserLemonSqueezyPaymentDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        lemonSqueezyId: '12345',
        userId: 'user-1',
        subscriptionStatus: 'deleted',
      }),
      mockContext.entities.User
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
  });
});
