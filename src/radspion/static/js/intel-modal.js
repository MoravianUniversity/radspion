/**
 * Intel modal — the dashboard's Recovered Data / Mission Debrief popups.
 *
 * Each completed mission row carries inert <template data-intel-content="...">
 * blocks (the inbox uses hidden inline elements instead); an intel link names
 * one via data-intel-open and this clones it into the shared dialog shell
 * (_intel_modal.html).
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
    if (modal.hidden) {
      return;
    }
    modal.hidden = true;
    document.body.classList.remove("has-intel-modal");
    bodyEl.innerHTML = "";
    if (lastFocus) {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  function findContent(key) {
    var candidates = document.querySelectorAll("[data-intel-content]");
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].getAttribute("data-intel-content") === key) {
        return candidates[i];
      }
    }
    return null;
  }

  // A <template> contributes its inert content; any other element (an inline,
  // hidden message body, say) contributes a copy of its children.
  function cloneContent(source) {
    if (source.tagName === "TEMPLATE") {
      return source.content.cloneNode(true);
    }
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < source.childNodes.length; i++) {
      fragment.appendChild(source.childNodes[i].cloneNode(true));
    }
    return fragment;
  }

  function open(trigger) {
    var source = findContent(trigger.getAttribute("data-intel-open"));
    if (!source) {
      return;
    }
    titleEl.textContent = trigger.getAttribute("data-intel-label") || "";
    bodyEl.innerHTML = "";
    bodyEl.appendChild(cloneContent(source));
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

  // For scripts that open a pop-out on their own (inbox.js auto-opens the
  // first unread message): pass the trigger element the click would have used.
  window.RadspionIntelModal = { open: open, close: close };
})();
