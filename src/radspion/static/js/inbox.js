/**
 * Dashboard inbox — front-end mock of the messaging system.
 *
 * Messages are rendered by the template; this keeps their read state in the
 * browser (per agent) until the backend owns it, updates the unread badge, and
 * opens the first unread message on its own — the "Welcome, Agent" overlay a
 * new agent sees once, on first login. Reading goes through the intel modal.
 */
(function () {
  "use strict";

  var panel = document.querySelector("[data-inbox]");
  if (!panel) {
    return;
  }

  var storageKey = "radspion.inbox.read." + (panel.getAttribute("data-agent-id") || "");
  var badge = panel.querySelector("[data-inbox-badge]");
  var items = Array.prototype.slice.call(panel.querySelectorAll("[data-inbox-message]"));

  function loadRead() {
    try {
      var raw = window.localStorage.getItem(storageKey);
      var ids = raw ? JSON.parse(raw) : [];
      return Array.isArray(ids) ? ids : [];
    } catch (err) {
      return [];
    }
  }

  function saveRead(ids) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (err) {
      /* Private mode or storage disabled: the message simply stays unread. */
    }
  }

  var readIds = loadRead();

  function idOf(item) {
    return item.getAttribute("data-inbox-message");
  }

  function isRead(item) {
    return readIds.indexOf(idOf(item)) !== -1;
  }

  function render() {
    var unread = 0;
    items.forEach(function (item) {
      var read = isRead(item);
      item.classList.toggle("msg--read", read);
      item.classList.toggle("msg--unread", !read);
      var state = item.querySelector("[data-inbox-state]");
      if (state) {
        state.textContent = read ? "Read" : "New";
      }
      if (!read) {
        unread += 1;
      }
    });
    if (badge) {
      badge.textContent = String(unread);
      badge.hidden = unread === 0;
      badge.setAttribute("aria-label", unread + " unread");
    }
  }

  function markRead(item) {
    if (!isRead(item)) {
      readIds.push(idOf(item));
      saveRead(readIds);
    }
    render();
  }

  items.forEach(function (item) {
    var opener = item.querySelector("[data-inbox-open]");
    if (opener) {
      opener.addEventListener("click", function () {
        markRead(item);
      });
    }
  });

  render();

  // First login: the newest unread message presents itself, once.
  var firstUnread = null;
  for (var i = 0; i < items.length; i++) {
    if (!isRead(items[i])) {
      firstUnread = items[i];
      break;
    }
  }
  if (firstUnread && window.RadspionIntelModal) {
    var opener = firstUnread.querySelector("[data-intel-open]");
    if (opener) {
      window.RadspionIntelModal.open(opener);
      markRead(firstUnread);
    }
  }
})();
