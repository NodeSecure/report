// Import Node.js Dependencies
import { AsyncLocalStorage } from "async_hooks";

export const store = new AsyncLocalStorage();

export function getConfig() {
  return store.getStore();
}

export async function run(data, mainExecutor) {
  store.run(data, () => {
    mainExecutor().catch(console.error);
  });
}
