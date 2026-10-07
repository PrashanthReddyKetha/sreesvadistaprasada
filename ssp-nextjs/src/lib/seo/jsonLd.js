/* Structured data goes inside a <script> tag on the page. JSON.stringify leaves "<" and ">" as they are, so text
   that customers can write (a review, a name) could close the tag and run as script for every visitor. Every
   JSON-LD block is serialised through this helper, which escapes those characters the way JSON allows. */
export function jsonLd(data) {
  return JSON.stringify(data)
    .replace(/[<]/g, '\\u003c')
    .replace(/[>]/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
