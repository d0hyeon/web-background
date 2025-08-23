import { extractIdentifiers, isKeyword, isGlobalBuiltIn, isSerializable, getGlobalScope, extractParametersFromFunction, extractLocalVariables } from './functionUtils';
import { CacheManager } from './cacheManager';

export function captureCallerContext(fn: Function): Record<string, any> {
  const funcStr = fn.toString();
  
  // 캐시 확인
  const cachedContext = CacheManager.getContext(funcStr);
  if (cachedContext) {
    console.log('캐시된 컨텍스트 사용:', cachedContext);
    return cachedContext;
  }
  const context: Record<string, any> = {};
  
  console.log('함수 문자열:', funcStr);
  
  const identifiers = extractIdentifiers(funcStr);
  const parameters = extractParametersFromFunction(funcStr);
  const localVars = extractLocalVariables(funcStr);
  const callerScope = getGlobalScope();
  
  console.log('추출된 식별자들:', identifiers);
  console.log('매개변수들:', Array.from(parameters));
  console.log('로컬 변수들:', Array.from(localVars));
  console.log('호출자 스코프:', Object.keys(callerScope));
  
  identifiers.forEach(id => {
    if (isKeyword(id) || isGlobalBuiltIn(id) || parameters.has(id) || localVars.has(id)) {
      return;
    }
    
    console.log(`'${id}' 검사 중...`);
    
    // 호출자 스코프에서 먼저 찾기
    if (id in callerScope) {
      const value = callerScope[id];
      console.log(`호출자 스코프에서 '${id}' 발견:`, typeof value);
      if (typeof value === 'function') {
        context[id] = value;
      } else if (isSerializable(value)) {
        context[id] = value;
      }
      return;
    }
    
    // 전역 스코프에서 찾기
    try {
      let value: any;
      if (typeof window !== 'undefined' && id in window) {
        value = (window as any)[id];
        console.log(`window에서 '${id}' 발견:`, typeof value);
      } else if (typeof globalThis !== 'undefined' && id in globalThis) {
        value = (globalThis as any)[id];
        console.log(`globalThis에서 '${id}' 발견:`, typeof value);
      }
      
      if (value !== undefined) {
        if (typeof value === 'function') {
          context[id] = value;
        } else if (isSerializable(value)) {
          context[id] = value;
        }
      }
    } catch (e) {
      console.log(`'${id}' 접근 실패:`, e);
    }
  });
  
  console.log('최종 컨텍스트:', context);
  
  // 캐시에 저장
  CacheManager.setContext(funcStr, context);
  
  return context;
}

