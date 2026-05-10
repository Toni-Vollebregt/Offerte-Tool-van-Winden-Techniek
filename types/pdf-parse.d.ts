declare module 'pdf-parse/lib/pdf-parse.js' {
  import type { default as pdfParse } from 'pdf-parse'
  const fn: typeof pdfParse
  export = fn
}
