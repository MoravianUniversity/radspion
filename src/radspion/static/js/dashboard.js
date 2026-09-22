/**
 * Agent dashboard: show/hide completed missions, collapse empty groups, and
 * cap long story packs behind a "Show all" control.
 *
 * Two things can hide a row: the Show-completed toggle (completed rows) and
 * the per-pack cap (rows past `data-collapse-after` on the missions panel,
 * counted among the rows the toggle leaves visible, until the pack is
 * expanded). Both are recomputed together so they never disagree.
 */
(function () {
  "use strict";

  var panel = document.querySelector("[data-collapse-after]");
  var toggle = document.querySelector("[data-show-completed]");
  var groups = document.querySelectorAll("[data-mission-group]");
  if (!groups.length) {
    return;
  }

  var collapseAfter = panel ? parseInt(panel.getAttribute("data-collapse-after"), 10) : 0;
  if (!(collapseAfter > 0)) {
    collapseAfter = Infinity;
  }

  function showCompleted() {
    return !toggle || toggle.checked;
  }

  function updateGroupCounts(group) {
    var countsEl = group.querySelector("[data-group-counts]");
    if (!countsEl) {
      return;
    }
    var items = group.querySelectorAll("[data-mission-status]");
    var active = 0;
    var completed = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute("data-mission-status") === "active") {
        active += 1;
      } else if (items[i].getAttribute("data-mission-status") === "completed") {
        completed += 1;
      }
    }
    var parts = [];
    if (active) {
      parts.push(active + " active");
    }
    if (completed) {
      parts.push(completed + " completed" + (showCompleted() ? "" : " (hidden)"));
    }
    countsEl.textContent = parts.join(" · ");
  }

  function moreButton(group) {
    var button = group.querySelector("[data-mission-more]");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "mission-list__more";
      button.setAttribute("data-mission-more", "");
      button.addEventListener("click", function () {
        group.setAttribute(
          "data-expanded",
          group.getAttribute("data-expanded") === "true" ? "false" : "true"
        );
        applyGroup(group);
      });
      var table = group.querySelector(".mission-table");
      (table ? table.parentNode : group).appendChild(button);
    }
    return button;
  }

  function applyGroup(group) {
    var items = group.querySelectorAll(".mission-list__item");
    var expanded = group.getAttribute("data-expanded") === "true";
    var shown = 0;
    var eligible = 0;
    var visibleActive = false;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var completed = item.getAttribute("data-mission-status") === "completed";
      var hide = completed && !showCompleted();
      if (!hide) {
        eligible += 1;
        if (!expanded && eligible > collapseAfter) {
          hide = true;
        } else {
          shown += 1;
          if (item.getAttribute("data-mission-status") === "active") {
            visibleActive = true;
          }
        }
      }
      item.hidden = hide;
    }

    var button = moreButton(group);
    if (eligible > collapseAfter) {
      button.hidden = false;
      button.textContent = expanded
        ? "Show fewer"
        : "Show all " + eligible + " missions";
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
    } else {
      button.hidden = true;
    }

    // A pack stays open while it has something active to do, or once the
    // agent has asked to see all of it.
    group.open = visibleActive || (expanded && shown > 0);
    updateGroupCounts(group);
  }

  function applyAll() {
    for (var g = 0; g < groups.length; g++) {
      applyGroup(groups[g]);
    }
  }

  if (toggle) {
    toggle.addEventListener("change", applyAll);
  }
  applyAll();
})();
