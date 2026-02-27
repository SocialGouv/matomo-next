import type { PushArgs } from "./src/types";

declare global {
  interface Window {
    _paq?: PushArgs[] | null;
  }

  // Node 24+ uses globalThis instead of NodeJS.Global
  // eslint-disable-next-line no-var
  var _paq: PushArgs[] | null | undefined;
}

export {};
