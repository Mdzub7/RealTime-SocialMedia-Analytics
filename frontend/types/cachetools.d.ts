declare module 'cachetools' {
  export interface CacheOptions {
    maxSize?: number
    ttl?: number
  }

  export class TTLCache<K, V> {
    constructor(options: CacheOptions)
    set(key: K, value: V): void
    get(key: K): V | undefined
    has(key: K): boolean
    delete(key: K): boolean
    clear(): void
  }
}