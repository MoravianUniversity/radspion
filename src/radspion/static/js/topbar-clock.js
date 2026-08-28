/**
 * Live Date | Time readout in the top bar, in the viewer's local timezone —
 * "07.22.2026 | EST 22:16:57" (Figma's format, real values).
 */
(function () {
  "use strict";

  var el = document.querySelector("[data-topbar-clock]");
  if (!el) {
    return;
  }

  var tzFormat;
  try {
    tzFormat = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" });
  } catch (e) {
    tzFormat = null;
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function zoneAbbreviation(now) {
    if (!tzFormat) {
      return "";
    }
    var parts = tzFormat.formatToParts(now);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === "timeZoneName") {
        return parts[i].value;
      }
    }
    return "";
  }

  function tick() {
    var now = new Date();
    var zone = zoneAbbreviation(now);
    el.dateTime = now.toISOString();
    el.textContent =
      pad(now.getMonth() + 1) + "." + pad(now.getDate()) + "." + now.getFullYear() +
      " | " + (zone ? zone + " " : "") +
      pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  }

  tick();
  setInterval(tick, 1000);
})();
