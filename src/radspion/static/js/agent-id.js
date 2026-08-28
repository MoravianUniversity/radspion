/**
 * Agent ID readout — the decorative hex identifier under the codename in the
 * top bar (Figma shows "071b9a91-41dc" there). Generated client-side from the
 * codename, so it is stable for an agent across pages and reloads.
 */
(function () {
  "use strict";

  var el = document.querySelector("[data-agent-id]");
  if (!el) {
    return;
  }

  var seed = el.getAttribute("data-agent-seed") || "";

  /** FNV-1a 32-bit over the seed, from a caller-chosen offset basis. */
  function fnv(str, hash) {
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
  }

  function hex(value, width) {
    var s = value.toString(16);
    while (s.length < width) {
      s = "0" + s;
    }
    return s;
  }

  var head = fnv(seed, 0x811c9dc5);
  var tail = fnv(seed, 0x9dc5811c) & 0xffff;
  el.textContent = hex(head, 8) + "-" + hex(tail, 4);
})();
