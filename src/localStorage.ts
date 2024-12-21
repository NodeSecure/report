// Import Node.js Dependencies
import { AsyncLocalStorage } from "node:async_hooks";

// Import Third-party Dependencies
import type { RC } from "@nodesecure/rc";

export const store = new AsyncLocalStorage<RC>();

export function getConfig(): RC {
  const runtimeConfig = store.getStore();
  if (runtimeConfig === undefined) {
    throw new Error("unable to fetch AsyncLocalStorage runtime config");
  }

  return runtimeConfig;
}
