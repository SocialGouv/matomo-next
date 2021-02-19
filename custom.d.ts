// / <reference types="next" />
// / <reference types="next/types/global" />

interface Window {
  _paq?: null | (string | string[] | number | number[])[][];
}
declare namespace NodeJS {
  interface Global {
    _paq?: null | (string | string[] | number | number[])[][];
  }
}
