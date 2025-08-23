


export function serializeFunction(func: Function, providedContext?: Record<string, any>): string {
  const context = providedContext || {};
  
  return createIsolatedFunction(func, context);
}

export function deserializeFunction(serializedFunc: string): Function {
  try {
    return new Function(`return ${serializedFunc}`)();
  } catch (error) {
    throw new Error(`함수 역직렬화 실패: ${(error as Error).message}`);
  }
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

