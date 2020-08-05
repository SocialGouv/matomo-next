// / <reference types="next" />
// / <reference types="next/types/global" />

interface Window {
  _paq: (string | string[] | number | number[])[][]
}
declare namespace NodeJS {
  interface Global {
    _paq: (string | string[] | number | number[])[][]
  }
}
