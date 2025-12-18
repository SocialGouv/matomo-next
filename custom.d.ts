import type { PushArgs } from "./src/types";

declare global {
  interface Window {
    _paq?: PushArgs[] | null;
  }

  namespace NodeJS {
    interface Global {
      _paq?: PushArgs[] | null;
    }
  }
}

export {};
