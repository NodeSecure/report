// Import Node.js Dependencies
import { type RC } from "@nodesecure/rc";
import { AsyncLocalStorage } from "node:async_hooks";

export const store = new AsyncLocalStorage<RC>();

export function getConfig(): RC {
  return store.getStore() as RC;
}
