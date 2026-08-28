# Radspion v2 front-end

A full restyle of every Radspion page to the **v2 design language** — the
near-black / gold "field operations" theme ported from the Figma designs. This
change is **view-layer only**: Jinja templates, CSS, JS, and images. It does not
include controller or model changes (see
[v2-integration.md](v2-integration.md) for the small server-side surface the new
pages depend on).

## Design language

- **Background** near-black `#000` with a soft gold radial glow top-left.
- **Accent** gold `#b5842c` (`--color-gold`), with dim/light variants.
- **Type** the `slight-chance` display face (Adobe Fonts kit) for headings and
  UI, a mono stack for slugs/codes/data. Gold uppercase headings over white body.
- **Geometry** 2px radii, hairline gold-wash panels (`--color-panel-fill` /
  `--color-panel-stroke`), a fixed 1728px canvas for signed-in pages that goes
  fluid then stacked below it.

The three screens with a Figma source (landing, mission dashboard, mission
brief) are pixel-ported; every other screen was brought into the same vocabulary
by extension.

## Stylesheets

`static/css/radspion-v2.css` is the single theme. It supersedes the V1
`radspion.css`, which is now unused (see "Cleanup" below). Mission markdown adds
a fourth layer, `static/css/markdown/radspion-v2.css`, over the existing three
(`github-markdown-dark` + `radspion-overrides` + `pygments-native`).

## Shells and partials

| Shell | Used by |
| --- | --- |
| `agent/base_agent_v2.html` | dashboard, mission detail, mission data (signed-in) |
| `agent/personnel.html` | standalone (pins `body.page--personnel` for a test) |
| `base_public_v2.html` | About, Privacy, 404 |
| `index.html`, `clearance.html`, `activity.html` | standalone (landing / hero / dual-mode) |

Shared partials: `agent/_topbar.html` (header bar), `agent/_rail.html` (sidebar
section nav), `agent/_mobile_nav.html` (fixed bottom tab bar < 760px),
`_public_header_v2.html`, `_site_footer_v2.html`, `_intel_modal.html`,
`_mission_markdown_styles_v2.html`.

## JavaScript

New, all in `static/js/`:

- `intel-modal.js` — Recovered Data / Mission Debrief pop-outs (dashboard + Mission Data)
- `agent-id.js` — top-bar hex identifier, generated client-side from the codename
- `topbar-clock.js` — live local-time clock in the top bar

`mission-detail-copy-data.js` gained `window.RadspionCopyData.wireWithin(root)`
so injected modal content wires its own copy buttons. Existing behaviour scripts
(transmission modal, clearance, personnel codename) are unchanged and still
loaded.

## Navigation

Signed-in pages share a section nav in two forms:

- **Desktop** — the left rail: Mission Dashboard, Mission Data, Personnel File.
  A gold segment marks the active section.
- **Mobile (< 760px)** — a fixed bottom tab bar with the same destinations; the
  rail is hidden and the Network/Uplink readouts are dropped to save space.

## New page: Mission Data

`/agent/data` — an archive of every completed mission's recovered data (with a
copy button) and its debrief (pop-out modal), grouped by story arc as an
accordion. This page needs a route + context that are **not** in this change;
see [v2-integration.md](v2-integration.md).

## What every page looks like now

Landing, clearance, dashboard, mission brief, mission data, personnel file,
field activity, about, privacy, and the 404 are all on v2. All share the gold
glow, the footer band, and a sticky footer.

## Cleanup (optional, not done here)

These V1 files are now unreferenced and can be deleted once this lands:
`templates/base.html`, `agent/base_agent.html`, `agent/_header.html`,
`_public_header.html`, `_site_footer.html`, `agent/_mission_back_nav.html`,
`_mission_markdown_styles.html`, `static/css/radspion.css`, and
`static/img/radspion_mark_white.svg` (old logo) +
`static/img/confidential_your_eyes_only.png` (removed from the Personnel File).
