// / <reference types="next" />
// / <reference types="next/types/global" />

interface Dimensions {
  dimension1?: string;
  dimension2?: string;
  dimension3?: string;
  dimension4?: string;
  dimension5?: string;
  dimension6?: string;
  dimension7?: string;
  dimension8?: string;
  dimension9?: string;
  dimension10?: string;
}

interface Window {
  _paq?:
    | (
        | Dimensions
        | number[]
        | string[]
        | number
        | string
        | null
        | undefined
      )[][]
    | null;
}
declare namespace NodeJS {
  interface Global {
    _paq?:
      | (
          | Dimensions
          | number[]
          | string[]
          | number
          | string
          | null
          | undefined
        )[][]
      | null;
  }
}
