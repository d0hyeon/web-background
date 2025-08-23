import { serializeFunction } from "./serializeFunction";

interface WorkerConstructor<Worker> {
  new(scriptURL: string | URL, options?: WorkerOptions): Worker;
  prototype: Worker;
}

interface Options extends WorkerOptions {
  module: (...args: any[]) => any;
  context?: Record<string, any>;
}



export class WorkerBuilder {
  static fromModule<W extends Worker>(
    Worker: WorkerConstructor<W>,
    { module, context, ...options }: Options
  ) {
  
    
    // 클로저를 포함한 완전한 함수 직렬화
    const serializedFunction = serializeFunction(module, context);
    console.log(serializedFunction)
    const code = `
      self.addEventListener('message', async event => {
        const func = ${serializedFunction};
        const result = await func(${module.length > 1 ? '...event.data' : 'event.data'});
        self.postMessage(result);
      });
    `.trim();

    const blob = new Blob([code]);
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, options);
    const originTerminate = worker.terminate;

    worker.terminate = () => {
      originTerminate.call(worker);
      URL.revokeObjectURL(url);
    }

    return worker;
  }
}