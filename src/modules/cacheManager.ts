// 제네릭 캐시 클래스
class Cache<T> {
  protected store = new Map<string, T>();

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  set(key: string, value: T): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

class SerializationCache extends Cache<string> {
  deleteByPrefix(prefix: string): void {
    for (const [key, _] of this.store) {
      if (key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }
}

// 캐시 인스턴스들
const contextCache = new Cache<Record<string, any>>();
const serializationCache = new SerializationCache();  // Prefix 삭제가 필요한 캐시
const identifierCache = new Cache<string[]>();
const usageCountCache = new Cache<number>();

// 사용 추적 유틸리티
class UsageTracker {
  static increment(funcStr: string): void {
    const current = usageCountCache.get(funcStr) || 0;
    usageCountCache.set(funcStr, current + 1);
  }

  static decrement(funcStr: string): boolean {
    const current = usageCountCache.get(funcStr) || 0;
    if (current <= 1) {
      usageCountCache.delete(funcStr);
      return true; // 정리 필요
    } else {
      usageCountCache.set(funcStr, current - 1);
      return false; // 정리 불필요
    }
  }

  static getCount(funcStr: string): number {
    return usageCountCache.get(funcStr) || 0;
  }
}

// 통합 캐시 관리자 (기존 API 호환성 유지)
export class CacheManager {
  // 컨텍스트 캐시
  static getContext(funcStr: string): Record<string, any> | undefined {
    return contextCache.get(funcStr);
  }

  static setContext(funcStr: string, context: Record<string, any>): void {
    contextCache.set(funcStr, context);
    UsageTracker.increment(funcStr);
  }

  // 직렬화 캐시
  static getSerialization(cacheKey: string): string | undefined {
    return serializationCache.get(cacheKey);
  }

  static setSerialization(cacheKey: string, result: string): void {
    serializationCache.set(cacheKey, result);
    // 함수 문자열 부분 추출 (':'로 분리된 첫 번째 부분)
    const funcStr = cacheKey.split(':')[0];
    UsageTracker.increment(funcStr);
  }

  // 식별자 캐시
  static getIdentifiers(funcStr: string): string[] | undefined {
    return identifierCache.get(funcStr);
  }

  static setIdentifiers(funcStr: string, identifiers: string[]): void {
    identifierCache.set(funcStr, identifiers);
    UsageTracker.increment(funcStr);
  }

  // 사용 횟수 감소 및 정리
  static decrementUsage(funcStr: string): void {
    const shouldCleanup = UsageTracker.decrement(funcStr);
    
    if (shouldCleanup) {
      // 모든 관련 캐시 정리
      contextCache.delete(funcStr);
      identifierCache.delete(funcStr);
      serializationCache.deleteByPrefix(funcStr + ':');
      
      console.log(`'${funcStr.substring(0, 50)}...' 함수 캐시 정리 완료`);
    }
  }

  // 전체 캐시 통계
  static getCacheStats(): {
    contextCacheSize: number;
    serializationCacheSize: number;
    identifierCacheSize: number;
    activeFunctions: number;
  } {
    return {
      contextCacheSize: contextCache.size(),
      serializationCacheSize: serializationCache.size(),
      identifierCacheSize: identifierCache.size(),
      activeFunctions: usageCountCache.size()
    };
  }

  // 수동 캐시 정리 (개발/디버깅용)
  static clearAllCaches(): void {
    contextCache.clear();
    serializationCache.clear();
    identifierCache.clear();
    usageCountCache.clear();
    console.log('모든 캐시가 정리되었습니다');
  }
}