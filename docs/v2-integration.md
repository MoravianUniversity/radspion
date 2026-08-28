# v2 front-end — server-side integration

**For the developer wiring the Python side to the v2 front-end.**

The v2 restyle ([v2-frontend.md](v2-frontend.md)) is **view-only** — templates,
CSS, JS, images. The templates reference **one small piece of new controller
code** that is not part of that change and must be added for the signed-in pages
to work. Everything else is a drop-in re-skin: existing routes, context, and
model APIs are untouched.

Production already runs the equivalent controller; this is about getting a clean
checkout / CI to render the new pages.

---

## What to open / edit on the backend

One file needs edits for the pages to work; two test files need a small update.
**No new dependencies, no new endpoints beyond the one route, no model/storage/
schema changes.**

| File | Action | Section |
| --- | --- | --- |
| `src/radspion/web/agent.py` | **Add** the `GET /agent/data` (`mission_data`) route, and add an `intel_missions` dict to the existing dashboard context | §1 |
| `tests/test_personnel.py` | **Remove** one now-stale assertion (the removed CONFIDENTIAL stamp) | §2 |
| `tests/test_agent_dashboard.py` | *(optional)* **Add** tests for the new `/agent/data` route | §2 |
| `static/img/confidential_your_eyes_only.png` | *(optional)* delete — no longer referenced | §2 |

Nothing else in `web/`, `radspion.py`, `database.py`, the SQL, or the config is
touched. The route uses only facade methods that already exist.

---

## 1. Required: `mission_data` route + dashboard `intel_missions` context

`src/radspion/web/agent.py`. Without this, a clean checkout **500s on every
signed-in page** — the shared nav (`agent/_rail.html`, `agent/_mobile_nav.html`)
calls `url_for('agent.mission_data')`, and `dashboard.html` iterates
`intel_missions`.

```diff
@@ def dashboard():
     radspion.sync_mission_status(g.user.id)
     dashboard_groups = radspion.get_agent_dashboard(g.user.id)
     completed_total = dashboard_completed_total(dashboard_groups)
+    # Intel column: completed missions link their debrief and recovered data
+    # from the dashboard, so their rendered detail rides along.
+    intel_missions = {
+        mission.slug: detail
+        for group in dashboard_groups
+        for mission in group.missions
+        if mission.status == "completed"
+        and (detail := radspion.get_mission_detail(g.user.id, mission.slug)) is not None
+    }
     welcome_memo_html = None
     ...
     return render_template(
         "agent/dashboard.html",
         ...
+        intel_missions=intel_missions,
         post_login_clearance_result=pop_post_login_clearance_result(session),
     )


+@agent_bp.get("/data")
+@login_required
+def mission_data():
+    """Mission Data: recovered data and debriefs from every completed mission."""
+    radspion = current_app.extensions["radspion"]
+    radspion.sync_mission_status(g.user.id)
+    dashboard_groups = radspion.get_agent_dashboard(g.user.id)
+    completed_missions = [
+        {"group": group.name, "detail": detail}
+        for group in dashboard_groups
+        for mission in group.missions
+        if mission.status == "completed"
+        and (detail := radspion.get_mission_detail(g.user.id, mission.slug)) is not None
+    ]
+    return render_template(
+        "agent/mission_data.html",
+        user=g.user,
+        completed_missions=completed_missions,
+    )
```

Uses only existing facade methods (`sync_mission_status`, `get_agent_dashboard`,
`get_mission_detail`). No model, storage, or schema changes.

### Template ↔ context contract

| Template | Needs from the view |
| --- | --- |
| `agent/_rail.html`, `agent/_mobile_nav.html` | route **`agent.mission_data`** must exist |
| `agent/dashboard.html` | **`intel_missions`**: `dict[slug -> MissionDetail]` for completed missions (empty dict OK) |
| `agent/mission_data.html` | **`completed_missions`**: `list[{"group": str, "detail": MissionDetail}]`, dashboard order (arc grouping is derived in the template from first appearance) |

`MissionDetail` fields the templates read: `slug`, `title`, `status`,
`brief_html`, `debrief_html`, `recovered_data`. Top bar also reads
`user.codename` and `user.display_name`.

> **Perf note:** the dashboard and Mission Data render every completed mission's
> debrief markdown per request. Fine at classroom scale; if an agent can
> complete dozens of missions, consider an on-demand endpoint instead.

---

## 2. Two test assertions to drop

The v2 port intentionally removed two bits of markup. Update these tracked tests
alongside the templates:

- `tests/test_personnel.py` — remove `assert "confidential_your_eyes_only.png" in body`
  (the CONFIDENTIAL stamp was removed from the Personnel File). The image
  `static/img/confidential_your_eyes_only.png` is now unused.
- Add coverage for the new route if desired: `/agent/data` should render the
  completed missions' recovered data (`recovered-data__value`) and
  `data-intel-open="debrief:<slug>"` links, and an empty state (`datacard--empty`)
  for an agent with no completions.

Everything else in the existing suite passes against the v2 templates unchanged.

---

## 3. Verifying

With section 1 applied, on a checkout with a test DB (`create_test_db --force`):

```bash
make            # ruff + unit suite
make acceptance # Playwright browser tests
```

All the behaviour-bearing selectors the JS and tests rely on are preserved:
`clearance-form`, `name="clearance_code"`, `data-transmission-modal`,
`data-mission-group`, `data-show-completed`, `data-group-counts`,
`mission-list__item`, `mission-card__slug`, `status-badge`,
`recovered-data-form`, `recovered-data__value`, `mission-detail__title`,
`mission-detail__meta`, `mission-panel__collapse`, `site-header--public`,
`site-header__agent-link[--current]`, `page page--activity`,
`page page--personnel`. The `_mission_chevron.html` fragment is byte-for-byte
unchanged (a unit test pins it).
