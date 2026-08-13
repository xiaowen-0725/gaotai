import type { GaotaiStore } from "@/domain/store";
import { defaultModel } from "./session";

export function clientState(store: GaotaiStore, loggedIn: boolean) {
  return {
    ...store.snapshot(),
    loggedIn,
    defaultModel: defaultModel(),
  };
}
