

import { extractIdentifiers, isGlobalBuiltIn, isSerializable } from './functionUtils';
import { CacheManager } from './cacheManager';

export function serializeFunction(func: Function, providedContext?: Record<string, any>): string {
  const funcStr = func.toString();
  const contextKey = JSON.stringify(providedContext || {});
  const cacheKey = `${funcStr}:${contextKey}`;
  
  // 캐시 확인
  const cachedResult = CacheManager.getSerialization(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  const context = providedContext || {};
  const result = createIsolatedFunction(func, context);
  
  // 캐시에 저장
  CacheManager.setSerialization(cacheKey, result);
  
  return result;
}

export function deserializeFunction(serializedFunc: string): Function {
  try {
    return new Function(`return ${serializedFunc}`)();
  } catch (error) {
    throw new Error(`함수 역직렬화 실패: ${(error as Error).message}`);
  }
}

export function extractClosureContext(func: Function): Record<string, any> {
  const funcStr = func.toString();
  const identifiers = extractIdentifiers(funcStr);
  const context: Record<string, any> = {};
  
  identifiers.forEach(identifier => {
    if (!isGlobalBuiltIn(identifier)) {
      try {
        const value = (globalThis as any)[identifier] || (typeof window !== 'undefined' ? (window as any)[identifier] : undefined);
        if (value !== undefined) {
          if (typeof value === 'function') {
            context[identifier] = value;
          } else if (isSerializable(value)) {
            context[identifier] = value;
          }
        }
      } catch (e) {
        // 접근할 수 없는 변수는 무시
      }
    }
  });
  
  return context;
}

function createIsolatedFunction(func: Function, context: Record<string, any>): string {
  const funcStr = func.toString();
  
  let result = '(function() {\n';
  
  const contextEntries = Object.entries(context);
  const variables = contextEntries.filter(([, value]) => typeof value !== 'function');
  const functions = contextEntries.filter(([, value]) => typeof value === 'function');
  
  variables.forEach(([name, value]) => {
    try {
      result += `  const ${name} = ${JSON.stringify(value)};\n`;
    } catch (e) {
      result += `  const ${name} = undefined;\n`;
    }
  });
  
  functions.forEach(([name, value]) => {
    if (typeof value === 'function') {
      result += `  const ${name} = ${value.toString()};\n`;
    }
  });
  
  if (contextEntries.length > 0) {
    result += '\n';
  }
  
  result += `  return ${funcStr};\n`;
  result += '})()';
  
  return result;
}

