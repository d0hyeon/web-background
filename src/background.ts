import { UtilWorker } from "./modules/UtilWorker";
import { WorkerBuilder } from "./modules/WorkerBuilder";
import { workerCleanupRegistry } from "./modules/workerCleanupRegistry";
import { captureCallerContext } from "./modules/captureContext";


export type FunctionInBackground<Callback extends (params: any) => any> = (...params: Parameters<Callback>) => Promise<ReturnType<Callback>>;

export function background<Payload, ReturnValue>(fn: (payload: Payload) => ReturnValue): FunctionInBackground<typeof fn>;
export function background<Payload, ReturnValue>(fn: (payload: Payload) => ReturnValue, context?: Record<string, any>): FunctionInBackground<typeof fn>;
export function background<Payload extends any[], ReturnValue = void>(
  fn: (...payloads: Payload) => ReturnValue,
  context?: Record<string, any>
) {
  // 컨텍스트가 명시적으로 제공되지 않은 경우 자동 캡처 시도
  const finalContext = context !== undefined ? context : captureCallerContext(fn);
  console.log('최종 사용될 컨텍스트:', finalContext)
  function createWorker(): UtilWorker<Payload, ReturnValue> {
    // 전달된 컨텍스트를 우선 사용하고, 없으면 자동 캡처 시도
    
    return WorkerBuilder.fromModule(
      UtilWorker<Payload, ReturnValue>,
      { module: fn, context: finalContext }
    )
  }

  let worker: UtilWorker<Payload, ReturnValue> | null = null;
  function request(...payload: Payload): Promise<ReturnValue> {
    if (typeof window === 'undefined') {
      throw new Error('[web-background] You must use background in browser');
    }
    if (worker == null) {
      worker = createWorker();
      workerCleanupRegistry.register(request, { 
        worker: worker,
        funcStr: fn.toString() 
      });
    }
    return worker.request.call(worker, payload.length > 1 ? payload : payload[0]);
  }

  return request;
}

