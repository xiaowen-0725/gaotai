import fs from "fs";
import path from "path";
import { GaotaiStore } from "@/domain/store";
import type { StoreSnapshot } from "@/domain/types";

const DATA_PATH = path.join(process.cwd(), ".data", "store.json");

function readDisk(): Partial<StoreSnapshot> {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) as StoreSnapshot;
    }
  } catch {
    /* empty */
  }
  return {};
}

export function loadStore(): GaotaiStore {
  const store = new GaotaiStore();
  store.load(readDisk());
  return store;
}

export function persist(store: GaotaiStore) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(store.snapshot()));
}

export function withStore<T>(fn: (store: GaotaiStore) => T): T {
  const store = loadStore();
  const result = fn(store);
  persist(store);
  return result;
}
