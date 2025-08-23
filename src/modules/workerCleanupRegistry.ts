
export const workerCleanupRegistry = new FinalizationRegistry(
  (heldWorker: Worker) => heldWorker.terminate()
);