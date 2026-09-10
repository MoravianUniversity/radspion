"""UC-025 / UC-026 / UC-029 / UC-031 — cast dashboard state (read-only)."""

from playwright.sync_api import Page, expect
from tests.acceptance.conftest import LiveApp
from tests.acceptance.helpers.dashboard import (
    STORYLINE_SLUGS,
    expect_group_titles_in_order,
    expect_mission_absent_from_dashboard,
    expect_mission_on_dashboard,
    expect_storyline_missions_absent,
    open_agent_dashboard,
)

BOB_STORYLINE_SLUGS = STORYLINE_SLUGS


def test_uc_025_diana_orientation_only(page: Page, live_app: LiveApp, login_as) -> None:
    """Diana sees basic-training only; no Testing Storyline missions."""
    open_agent_dashboard(page, live_app.base_url, login_as, "diana")

    expect(page.get_by_text("Testing Storyline")).to_have_count(0)
    expect_mission_on_dashboard(page, "basic-training", "active")
    expect_storyline_missions_absent(page)
    welcome = page.locator(".dashboard__welcome")
    expect(welcome).to_be_visible()
    expect(welcome.locator(".mission-markdown.markdown-body")).not_to_be_empty()
    expect(page.get_by_label("Show completed missions")).to_have_count(0)


def test_uc_026_alice_mid_progress_dashboard(page: Page, live_app: LiveApp, login_as) -> None:
    """Alice: es-alpha completed; es-beta and es-gamma active; es-delta hidden."""
    open_agent_dashboard(page, live_app.base_url, login_as, "alice")

    expect(page.locator(".dashboard__welcome")).to_have_count(0)
    expect(page.get_by_label("Show completed missions")).to_be_visible()
    expect_group_titles_in_order(page, ["Testing Storyline", "Orientation"])
    expect_mission_on_dashboard(page, "es-alpha", "completed")
    expect_mission_on_dashboard(page, "es-beta", "active")
    expect_mission_on_dashboard(page, "es-gamma", "active")
    expect_mission_absent_from_dashboard(page, "es-delta")
    expect_mission_absent_from_dashboard(page, "es-hidden")


def test_uc_029_charlie_partial_branch_dashboard(page: Page, live_app: LiveApp, login_as) -> None:
    """Charlie: es-beta completed; es-alpha active; es-gamma not listed."""
    open_agent_dashboard(page, live_app.base_url, login_as, "charlie")

    expect_mission_on_dashboard(page, "es-beta", "completed")
    expect_mission_on_dashboard(page, "es-alpha", "active")
    expect_mission_absent_from_dashboard(page, "es-gamma")
    expect_mission_absent_from_dashboard(page, "es-delta")
    expect_mission_absent_from_dashboard(page, "es-hidden")


def test_uc_031_bob_all_storyline_missions_completed(
    page: Page,
    live_app: LiveApp,
    login_as,
) -> None:
    """Bob: every es-* mission completed on the dashboard."""
    open_agent_dashboard(page, live_app.base_url, login_as, "bob")

    expect_mission_on_dashboard(page, "basic-training", "completed")
    for slug in BOB_STORYLINE_SLUGS:
        expect_mission_on_dashboard(page, slug, "completed")


def test_first_login_shows_welcome_overlay_once(page: Page, live_app: LiveApp, login_as) -> None:
    """A new agent's first dashboard visit opens the welcome message; later visits do not."""
    login_as("diana")
    page.goto(f"{live_app.base_url}/agent/dashboard")

    modal = page.locator("[data-intel-modal]")
    expect(modal).to_be_visible()
    expect(modal.locator("#intel-modal-title")).to_have_text("Welcome, Agent Diana")
    expect(modal.locator(".mission-markdown.markdown-body")).to_contain_text("Welcome to Radspion")

    # A mission link inside the message opens that brief in the overlay, not on a page.
    modal.get_by_role("link", name="Basic Training").click()
    expect(modal).to_be_hidden()
    mission_modal = page.locator("[data-mission-modal]")
    expect(mission_modal).to_be_visible()
    expect(mission_modal.locator("#mission-modal-title")).to_have_text("Welcome to Radspion")
    expect(page).to_have_url(f"{live_app.base_url}/agent/dashboard")
    mission_modal.locator(".mission-modal__close").click()
    expect(mission_modal).to_be_hidden()
    expect(page.locator(".msg--read")).to_have_count(1)

    page.reload()
    expect(page.get_by_role("heading", name="Mission Dashboard")).to_be_visible()
    expect(modal).to_be_hidden()
    # The message is still in the inbox, now marked read, and reopens on demand.
    page.locator("[data-inbox-open]").click()
    expect(modal).to_be_visible()
