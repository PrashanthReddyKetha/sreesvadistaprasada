/* Runs before the page becomes interactive. The Deliveroo kitchen tablet is locked to Chrome 88 (owner, 9 Nov 2026):
   package.json "browserslist" lowers the syntax for it, and these fill in the few built-ins it lacks. Each is added
   only where missing, so every newer browser runs its own. */

const define = (proto, name, fn) => {
  if (proto && !proto[name]) Object.defineProperty(proto, name, { value: fn, writable: true, configurable: true });
};

function at(n) {                         // Chrome 92
  const len = this.length;
  let i = Math.trunc(n) || 0;
  if (i < 0) i += len;
  return i < 0 || i >= len ? undefined : this[i];
}
define(Array.prototype, 'at', at);
define(String.prototype, 'at', function stringAt(n) { return at.call(String(this), n); });
if (typeof Int8Array !== 'undefined') define(Object.getPrototypeOf(Int8Array.prototype), 'at', at);

define(Array.prototype, 'findLast', function findLast(fn, self) {            // Chrome 97
  for (let i = this.length - 1; i >= 0; i--) if (fn.call(self, this[i], i, this)) return this[i];
  return undefined;
});
define(Array.prototype, 'findLastIndex', function findLastIndex(fn, self) {
  for (let i = this.length - 1; i >= 0; i--) if (fn.call(self, this[i], i, this)) return i;
  return -1;
});

if (!Object.hasOwn) {                    // Chrome 93
  Object.defineProperty(Object, 'hasOwn', {
    value: (obj, key) => Object.prototype.hasOwnProperty.call(Object(obj), key), writable: true, configurable: true,
  });
}
