
import { CacheManager } from './cacheManager';

export const workerCleanupRegistry = new FinalizationRegistry(
  (heldData: { worker: Worker; funcStr: string }) => {
    // 워커 종료
    heldData.worker.terminate();
    
    // 해당 함수의 캐시 사용 횟수 감소 (및 필요시 정리)
    CacheManager.decrementUsage(heldData.funcStr);
    
    console.log('워커 정리 및 캐시 정리 완료');
  }
);