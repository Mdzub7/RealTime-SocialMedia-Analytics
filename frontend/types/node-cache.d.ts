declare module 'node-cache' {
  interface NodeCacheOptions {
    stdTTL?: number
    checkperiod?: number
    maxKeys?: number
  }

  class NodeCache {
    constructor(options?: NodeCacheOptions)
    set<T>(key: string, value: T, ttl?: number): boolean
    get<T>(key: string): T | undefined
    has(key: string): boolean
    del(key: string): number
    clear(): void
  }

  export = NodeCache
}