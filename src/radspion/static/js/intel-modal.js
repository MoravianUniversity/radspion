/**
 * Intel modal — the dashboard's Recovered Data / Mission Debrief popups.
 *
 * Each completed mission row carries inert <template data-intel-content="...">
 * blocks; an intel link names one via data-intel-open and this clones it into
 * the shared dialog shell (_intel_modal.html).
 */
(function () {
  "use strict";

  var modal = document.querySelector("[data-intel-modal]");
  if (!modal) {
    return;
  }

  var bodyEl = modal.querySelector("[data-intel-body]");
  var titleEl = modal.querySelector("[data-intel-title]");
  var closeBtn = modal.querySelector(".intel-modal__close");
  var lastFocus = null;

  function close() {
    modal.hidden = true;
    document.body.classList.remove("has-intel-modal");
    bodyEl.innerHTML = "";
    if (lastFocus) {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  function open(trigger) {
    var key = trigger.getAttribute("data-intel-open");
    var template = null;
    var candidates = document.querySelectorAll("template[data-intel-content]");
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].getAttribute("data-intel-content") === key) {
        template = candidates[i];
        break;
      }
    }
    if (!template) {
      return;
    }
    titleEl.textContent = trigger.getAttribute("data-intel-label") || "";
    bodyEl.innerHTML = "";
    bodyEl.appendChild(template.content.cloneNode(true));
    if (window.RadspionCopyData) {
      window.RadspionCopyData.wireWithin(bodyEl);
    }
    lastFocus = trigger;
    modal.hidden = false;
    document.body.classList.add("has-intel-modal");
    closeBtn.focus();
  }

  document.querySelectorAll("[data-intel-open]").forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      open(trigger);
    });
  });

  modal.querySelectorAll("[data-intel-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });
})();
