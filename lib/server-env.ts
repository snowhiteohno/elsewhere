import { AsyncLocalStorage } from 'node:async_hooks';

const runtime = new AsyncLocalStorage<Record<string, unknown>>();
export function withServerEnv<T>(env: Record<string, unknown>, callback: () => T): T {
  return runtime.run(env, callback);
}
export function serverEnv(name: string): string | undefined {
  const value = runtime.getStore()?.[name];
  return typeof value === 'string' ? value : process.env[name];
}

export function serverBinding<T>(name: string): T | undefined {
  return runtime.getStore()?.[name] as T | undefined;
}
