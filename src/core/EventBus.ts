// Enterprise Event Bus for decoupled communication
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private listeners = new Map<string, Set<EventHandler>>();
  private onceListeners = new Map<string, Set<EventHandler>>();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  once<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(handler);

    return () => {
      this.onceListeners.get(event)?.delete(handler);
    };
  }

  async emit<T>(event: string, data?: T): Promise<void> {
    const promises: Promise<void>[] = [];

    // Handle regular listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const handler of listeners) {
        const result = handler(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    // Handle once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      for (const handler of onceListeners) {
        const result = handler(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
      this.onceListeners.delete(event);
    }

    await Promise.all(promises);
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(handler);
      this.onceListeners.get(event)?.delete(handler);
    }
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}

export const eventBus = EventBus.getInstance();