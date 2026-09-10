/**
 * Mission overlay — opens a mission's brief over the dashboard.
 *
 * A mission row's title / arrow link keeps its href (the mission page is still
 * the no-JS route and the deep link); clicking it here fetches that page,
 * lifts its .brief-columns into the dialog (_mission_modal.html) and wires the
 * copy buttons and, for an active mission, the Recovered Data form. Any other
 * link to /agent/missions/<slug> — inside a brief, a debrief, or the welcome
 * message — opens the same way, so briefs chain without leaving the dashboard.
 *
 * Active mission: the brief and the submit form. Completed mission: debrief,
 * brief and the archived recovered data — exactly what the page renders.
 *
 * After a successful submission, OK reloads the dashboard with
 * `#mission=<slug>` so the overlay reopens showing the debrief and data.
 *
 * `loadMission` is the one place that knows where mission content comes from;
 * swap it for the JSON mission API once that exists.
 */
(function () {
  "use strict";

  var modal = document.querySelector("[data-mission-modal]");
  if (!modal) {
    return;
  }

  var bodyEl = modal.querySelector("[data-mission-body]");
  var titleEl = modal.querySelector("[data-mission-title]");
  var metaEl = modal.querySelector("[data-mission-meta]");
  var kickerEl = modal.querySelector("[data-mission-kicker]");
  var closeBtn = modal.querySelector(".mission-modal__close");
  var lastFocus = null;
  var requestId = 0;

  function clearHash() {
    if (window.history.replaceState && /^#mission=/.test(window.location.hash)) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function close() {
    requestId += 1; // abandons any fetch still in flight
    modal.hidden = true;
    document.body.classList.remove("has-mission-modal");
    bodyEl.innerHTML = "";
    clearHash();
    if (lastFocus) {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  function missionUrl(slug) {
    return "/agent/missions/" + encodeURIComponent(slug);
  }

  function textOf(doc, selector) {
    var el = doc.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function loadMission(slug) {
    return fetch(missionUrl(slug), {
      credentials: "same-origin",
      headers: { Accept: "text/html" },
    })
      .then(function (response) {
        if (!response.ok) {
          var error = new Error("mission request failed: " + response.status);
          error.status = response.status;
          throw error;
        }
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var columns = doc.querySelector(".brief-columns");
        if (!columns) {
          throw new Error("mission page has no brief");
        }
        return {
          title: textOf(doc, ".mission-detail__title"),
          status: textOf(doc, ".mission-detail__meta .status-badge"),
          columns: columns,
        };
      });
  }

  function setHeading(title, slug, status) {
    titleEl.textContent = title || "";
    kickerEl.textContent = status === "completed" ? "Mission File" : "Mission Brief";
    metaEl.innerHTML = "";
    metaEl.appendChild(document.createTextNode(status ? slug + " · " : slug));
    if (status) {
      var badge = document.createElement("span");
      badge.className = "status-badge status-badge--" + status;
      badge.textContent = status;
      metaEl.appendChild(badge);
    }
  }

  function reopenAfterCompletion(slug) {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
    window.location.hash = "mission=" + slug;
    window.location.reload();
  }

  function render(slug, mission) {
    setHeading(mission.title, slug, mission.status);
    bodyEl.innerHTML = "";
    bodyEl.appendChild(document.importNode(mission.columns, true));
    bodyEl.scrollTop = 0;

    // The page folds a completed mission's archived data away; in the overlay
    // it is one of the three things the agent came to see, so show it open.
    var archived = bodyEl.querySelector(".recover details.mission-panel__collapse");
    if (archived) {
      archived.open = true;
    }

    if (window.RadspionCopyData) {
      window.RadspionCopyData.wireWithin(bodyEl);
    }
    var form = bodyEl.querySelector(".recovered-data-form");
    if (form && window.RadspionMissionSubmit) {
      window.RadspionMissionSubmit.wire(form, { onSuccessOk: reopenAfterCompletion });
    }
  }

  function showLoading(slug, title, status) {
    setHeading(title, slug, status);
    bodyEl.innerHTML =
      '<p class="mission-modal__loading text-mono">Retrieving mission file…</p>';
  }

  // A brief may link to a mission the agent has no clearance for yet: the
  // page 404s, so say so here rather than bouncing to the sealed-channel page.
  function showLocked(slug) {
    setHeading("File Sealed", slug, "");
    kickerEl.textContent = "Mission File";
    bodyEl.innerHTML =
      '<div class="mission-modal__locked">' +
      '<p class="mission-modal__locked-lead">This mission is not on your list.</p>' +
      "<p>It becomes available once you hold the clearance it requires, " +
      "or complete the missions that lead to it.</p>" +
      "</div>";
  }

  function open(slug, trigger) {
    var title = trigger ? trigger.getAttribute("data-mission-open-title") : "";
    var status = trigger ? trigger.getAttribute("data-mission-open-status") : "";
    var id = (requestId += 1);

    lastFocus = trigger || null;
    showLoading(slug, title, status);
    modal.hidden = false;
    document.body.classList.add("has-mission-modal");
    closeBtn.focus();

    loadMission(slug)
      .then(function (mission) {
        if (id !== requestId) {
          return; // closed, or another mission opened meanwhile
        }
        render(slug, mission);
      })
      .catch(function (error) {
        if (id !== requestId) {
          return;
        }
        if (error && error.status === 404) {
          showLocked(slug);
          return;
        }
        // Anything else: fall back to the page itself rather than a broken dialog.
        if (trigger && trigger.href) {
          window.location.assign(trigger.href);
          return;
        }
        close();
      });
  }

  var MISSION_PATH = /^\/agent\/missions\/([A-Za-z0-9_-]+)\/?$/;

  // The mission a link points at: an explicit data-mission-open, or any
  // same-origin href to /agent/missions/<slug> — so a brief, a debrief or the
  // welcome message linking to another mission opens it here, not on a page.
  function missionSlugOf(link) {
    var explicit = link.getAttribute("data-mission-open");
    if (explicit) {
      return explicit;
    }
    var href = link.getAttribute("href");
    if (!href || /^(#|mailto:|tel:)/.test(href)) {
      return null;
    }
    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (err) {
      return null;
    }
    if (url.origin !== window.location.origin) {
      return null;
    }
    var match = MISSION_PATH.exec(url.pathname);
    return match ? match[1] : null;
  }

  document.addEventListener("click", function (event) {
    // Let modified clicks (new tab, etc.) reach the real page.
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    var link = event.target.closest ? event.target.closest("a[href], [data-mission-open]") : null;
    if (!link || (link.target && link.target !== "_self")) {
      return;
    }
    var slug = missionSlugOf(link);
    if (!slug) {
      return;
    }
    event.preventDefault();
    if (window.RadspionIntelModal) {
      window.RadspionIntelModal.close(); // e.g. the welcome message's link
    }
    open(slug, link);
  });

  modal.querySelectorAll("[data-mission-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  // Deep link / post-completion reopen: /agent/dashboard#mission=<slug>.
  var match = /^#mission=([A-Za-z0-9_-]+)$/.exec(window.location.hash);
  if (match) {
    var slug = match[1];
    var trigger = document.querySelector('[data-mission-open="' + slug + '"]');
    open(slug, trigger);
  }
})();
