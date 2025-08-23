import { CacheManager } from './cacheManager';
const keywordSet = new Set([
  'function', 'return', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
  'do', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch',
  'finally', 'throw', 'new', 'this', 'typeof', 'instanceof', 'in', 'of',
  'class', 'extends', 'super', 'async', 'await', 'yield', 'true', 'false',
  'null', 'undefined', 'delete', 'void', 'with', 'export', 'import', 'from'
]);

const builtInSet = new Set([
  'console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 
  'Boolean', 'RegExp', 'Error', 'Promise', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 
  'decodeURIComponent', 'encodeURIComponent', 'window', 'document', 'global', 
  'process', 'self', 'URL', 'URLSearchParams', 'fetch', 'XMLHttpRequest',
  'localStorage', 'sessionStorage', 'location', 'history', 'navigator',
  'Blob', 'File', 'FileReader', 'FormData', 'Headers', 'Request', 'Response',
  'AbortController', 'AbortSignal', 'crypto', 'performance', 'requestAnimationFrame',
  'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback'
]);

export function extractIdentifiers(funcStr: string): string[] {
  // 캐시 확인
  const cached = CacheManager.getIdentifiers(funcStr);
  if (cached) {
    return cached;
  }

  const identifiers = new Set<string>();
  
  // 최적화된 단일 패턴으로 통합
  const identifierPattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  let match: RegExpExecArray | null;
  
  while ((match = identifierPattern.exec(funcStr)) !== null) {
    const identifier = match[0];
    if (!isKeyword(identifier) && 
        !isParameter(identifier, funcStr) && 
        !isLocalVariable(identifier, funcStr)) {
      identifiers.add(identifier);
    }
  }
  
  const result = Array.from(identifiers);
  CacheManager.setIdentifiers(funcStr, result);
  return result;
}

export function isKeyword(identifier: string): boolean {
  return keywordSet.has(identifier);
}

export function isGlobalBuiltIn(identifier: string): boolean {
  return builtInSet.has(identifier);
}

export function isParameter(identifier: string, funcStr: string): boolean {
  const paramPatterns = [
    new RegExp(`function\\s*\\([^)]*\\b${identifier}\\b[^)]*\\)`),
    new RegExp(`\\([^)]*\\b${identifier}\\b[^)]*\\)\\s*=>`),
    new RegExp(`^\\s*${identifier}\\s*=>`),
    new RegExp(`async\\s+\\([^)]*\\b${identifier}\\b[^)]*\\)\\s*=>`),
    new RegExp(`async\\s+${identifier}\\s*=>`)
  ];
  
  return paramPatterns.some(pattern => pattern.test(funcStr));
}

export function isLocalVariable(identifier: string, funcStr: string): boolean {
  const localVarPatterns = [
    new RegExp(`(?:var|let|const)\\s+${identifier}\\b`),
    new RegExp(`(?:var|let|const)\\s+\\{[^}]*\\b${identifier}\\b[^}]*\\}`),
    new RegExp(`function\\s+${identifier}\\b`)
  ];
  
  return localVarPatterns.some(pattern => pattern.test(funcStr));
}

export function isSerializable(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return true;
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') return false;
  
  if (Array.isArray(value)) {
    return value.every(item => isSerializable(item));
  }
  
  if (typeof value === 'object') {
    try {
      JSON.stringify(value);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  return false;
}

export function getGlobalScope(): Record<string, any> {
  const scope: Record<string, any> = {};
  
  if (typeof window !== 'undefined') {
    Object.getOwnPropertyNames(window).forEach(key => {
      try {
        if (!isGlobalBuiltIn(key)) {
          const descriptor = Object.getOwnPropertyDescriptor(window, key);
          if (descriptor && descriptor.configurable) {
            const value = (window as any)[key];
            if (typeof value !== 'undefined') {
              scope[key] = value;
            }
          }
        }
      } catch (e) {
        // 무시
      }
    });
  }
  
  if (typeof globalThis !== 'undefined') {
    Object.getOwnPropertyNames(globalThis).forEach(key => {
      try {
        if (!isGlobalBuiltIn(key) && !(key in scope)) {
          scope[key] = (globalThis as any)[key];
        }
      } catch (e) {
        // 무시
      }
    });
  }
  
  return scope;
}

export function extractParametersFromFunction(funcStr: string): Set<string> {
  const paramPattern = /function[^(]*\(([^)]*)\)|^\s*\(([^)]*)\)\s*=>|^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/;
  const paramMatch = funcStr.match(paramPattern);
  const parameters = new Set<string>();
  
  if (paramMatch) {
    const paramStr = paramMatch[1] || paramMatch[2] || paramMatch[3] || '';
    paramStr.split(',').forEach(param => {
      const cleaned = param.trim().split('=')[0].trim();
      if (cleaned && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleaned)) {
        parameters.add(cleaned);
      }
    });
  }
  
  return parameters;
}

export function extractLocalVariables(funcStr: string): Set<string> {
  const localVars = new Set<string>();
  const localVarPattern = /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match: RegExpExecArray | null;
  
  while ((match = localVarPattern.exec(funcStr)) !== null) {
    localVars.add(match[1]);
  }
  
  return localVars;
}