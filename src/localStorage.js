// Import Node.js Dependencies
import { AsyncLocalStorage } from "node:async_hooks";

export const store = new AsyncLocalStorage();

export function getConfig() {
  return store.getStore();
}
