// Enterprise Dependency Injection Container
export class Container {
  private static instance: Container;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  resolve<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    if (this.factories.has(key)) {
      const service = this.factories.get(key)!();
      this.services.set(key, service);
      return service;
    }

    throw new Error(`Service ${key} not found`);
  }

  singleton<T>(key: string, factory: () => T): T {
    if (!this.services.has(key)) {
      this.services.set(key, factory());
    }
    return this.services.get(key);
  }
}

// Service registration
export const container = Container.getInstance();