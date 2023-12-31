import { UtilWorker } from "./modules/UtilWorker";
import { WorkerBuilder } from "./modules/WorkerBuilder";
import { workerCleanupRegistry } from "./modules/workerCleanupRegistry";

type Result<Payload, ReturnValue> = Payload extends any[]
  ? (...payloads: Payload) => ReturnValue : (payload: Payload) => ReturnValue

export function background<Payload extends any[], ReturnValue = void>(
  fn: (...payloads: Payload) => ReturnValue
): Result<Payload, ReturnValue> {
  function createWorker(): UtilWorker<Payload, ReturnValue> {
    return WorkerBuilder.fromModule(
      UtilWorker<Payload, ReturnValue>,
      { module: fn }
    )
  }

  let worker: UtilWorker<Payload, ReturnValue> | null = null;
  function request(...payload: Payload) {
    if (typeof window === 'undefined') {
      throw new Error('[web-background] You must use background in browser');
    }
    if (worker == null) {
      worker = createWorker();
      workerCleanupRegistry.register(request, worker);
    }
    return worker.request.call(worker, payload.length > 1 ? payload : payload[0]);
  }

  return request as Result<Payload, ReturnValue>;
}

