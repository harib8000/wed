import { createClient, RedisClientType } from 'redis';
import { randomUUID } from 'crypto';
import type { DomainEvent, DomainEventType } from './index';

// ─── Types ───────────────────────────────────────────────────────────────────

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

interface EventBusOptions {
  redisUrl: string;
  serviceName: string;
  /** Channel prefix (default: 'wos') */
  prefix?: string;
}

// ─── Event Bus ───────────────────────────────────────────────────────────────

export class EventBus {
  private pub: RedisClientType;
  private sub: RedisClientType;
  private handlers = new Map<string, EventHandler[]>();
  private serviceName: string;
  private prefix: string;
  private connected = false;

  constructor(private opts: EventBusOptions) {
    this.serviceName = opts.serviceName;
    this.prefix = opts.prefix ?? 'wos';
    this.pub = createClient({ url: opts.redisUrl }) as RedisClientType;
    this.sub = this.pub.duplicate() as RedisClientType;
  }

  /** Connect both publisher and subscriber clients */
  async connect(): Promise<void> {
    if (this.connected) return;
    await Promise.all([this.pub.connect(), this.sub.connect()]);
    this.connected = true;
  }

  /** Disconnect gracefully */
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await Promise.all([this.pub.quit(), this.sub.quit()]);
    this.connected = false;
  }

  /** Publish a domain event to the bus */
  async publish<T>(
    type: DomainEventType,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const event: DomainEvent<T> = {
      id: randomUUID(),
      type,
      occurredAt: new Date().toISOString(),
      aggregateId,
      aggregateType,
      payload,
      metadata: {
        ...metadata,
        source: this.serviceName,
      },
    };

    const channel = `${this.prefix}:events:${type}`;
    await this.pub.publish(channel, JSON.stringify(event));
    return event.id;
  }

  /** Subscribe to a specific event type */
  async subscribe<T = unknown>(
    type: DomainEventType,
    handler: EventHandler<T>
  ): Promise<void> {
    const channel = `${this.prefix}:events:${type}`;
    const existing = this.handlers.get(channel) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(channel, existing);

    await this.sub.subscribe(channel, async (message) => {
      try {
        const event = JSON.parse(message) as DomainEvent<T>;
        // Skip events published by self to avoid loops
        if (event.metadata?.source === this.serviceName) return;
        await handler(event);
      } catch (err) {
        console.error(`[EventBus:${this.serviceName}] Error handling ${type}:`, err);
      }
    });
  }

  /** Subscribe to multiple event types at once */
  async subscribeMany(
    subscriptions: Array<{ type: DomainEventType; handler: EventHandler }>
  ): Promise<void> {
    await Promise.all(
      subscriptions.map(({ type, handler }) => this.subscribe(type, handler))
    );
  }

  /** Subscribe to all events matching a pattern (e.g., 'booking.*') */
  async subscribePattern(
    pattern: string,
    handler: EventHandler
  ): Promise<void> {
    const channel = `${this.prefix}:events:${pattern}`;
    await this.sub.pSubscribe(channel, async (message) => {
      try {
        const event = JSON.parse(message) as DomainEvent;
        if (event.metadata?.source === this.serviceName) return;
        await handler(event);
      } catch (err) {
        console.error(`[EventBus:${this.serviceName}] Error handling pattern ${pattern}:`, err);
      }
    });
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let _instance: EventBus | null = null;

export function createEventBus(opts: EventBusOptions): EventBus {
  _instance = new EventBus(opts);
  return _instance;
}

export function getEventBus(): EventBus {
  if (!_instance) {
    throw new Error('EventBus not initialized. Call createEventBus() first.');
  }
  return _instance;
}
