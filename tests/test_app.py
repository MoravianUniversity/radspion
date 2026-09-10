"""Tests for HTTP routes."""


def test_favicon(client):
    response = client.get("/favicon.ico")
    assert response.status_code == 200
    assert response.mimetype == "image/vnd.microsoft.icon"
    assert response.data[:4] == b"\x00\x00\x01\x00"


def test_index(client):
    response = client.get("/")
    assert response.status_code == 200
    html = response.data.decode()
    assert 'rel="icon"' in html
    assert "/static/favicon.ico" in html
    assert "Radspion" in html
    assert "Agent Authentication" in html
    assert "Sign in with Google" in html
    assert "@moravian.edu" not in html
    assert 'href="/about"' in html
    assert 'href="/privacy"' in html
    assert "transmission-modal.js" in html
    assert "data-transmission-modal" in html


def test_about(client):
    response = client.get("/about")
    assert response.status_code == 200
    html = response.data.decode()
    assert "What is Radspion?" in html
    assert "Moravian University" in html
    assert 'href="/"' in html


def test_privacy(client):
    response = client.get("/privacy")
    assert response.status_code == 200
    html = response.data.decode()
    assert "Privacy Policy" in html
    assert "Google" in html
    assert 'href="/privacy"' in html
    assert 'href="mailto:colemanb@moravian.edu"' in html


def test_unknown_route_returns_themed_404(client):
    response = client.get("/no-such-channel")
    assert response.status_code == 404
    html = response.data.decode()
    assert "Transmission Terminated" in html
    assert "ERR-NO-SIGNAL" in html
    assert "Return to secure channel" in html
    assert 'href="/"' in html


def test_api_unknown_route_returns_json_404(client):
    response = client.get("/api/no-such-endpoint")
    assert response.status_code == 404
    assert response.is_json
    assert response.get_json() == {"error": "Not found"}


def test_about_and_privacy_use_signed_in_shell_for_agents(testing_storyline_client):
    """Signed in, About / Privacy render in the agent shell with the rail and codename."""
    from radspion.web.session_keys import SESSION_USER_ID
    from tests.helpers import SAMPLE_AGENTS

    with testing_storyline_client.session_transaction() as sess:
        sess[SESSION_USER_ID] = SAMPLE_AGENTS["alice"]["id"]

    for path, active in (("/about", "What is Radspion?"), ("/privacy", "Privacy Policy")):
        html = testing_storyline_client.get(path).data.decode()
        assert 'class="topbar"' in html
        assert "Alice" in html
        assert "site-header--public" not in html
        assert 'href="/agent/dashboard"' in html
        assert "Return to sign-in" not in html
        assert f'data-tooltip="{active}"' in html
        assert "rail__link--active" in html


def test_about_and_privacy_use_public_shell_when_signed_out(client):
    for path in ("/about", "/privacy"):
        html = client.get(path).data.decode()
        assert "site-header--public" in html
        assert 'class="topbar"' not in html
        assert "Return to sign-in" in html


def test_index_offers_dashboard_when_signed_in(testing_storyline_client):
    """A signed-in agent landing on / gets the dashboard, not the Google button."""
    from radspion.web.session_keys import SESSION_USER_ID
    from tests.helpers import SAMPLE_AGENTS

    with testing_storyline_client.session_transaction() as sess:
        sess[SESSION_USER_ID] = SAMPLE_AGENTS["alice"]["id"]

    html = testing_storyline_client.get("/").data.decode()

    assert "Session Active" in html
    assert "Alice" in html
    assert 'href="/agent/dashboard"' in html
    assert "Enter Mission Dashboard" in html
    assert 'action="/auth/logout"' in html
    assert "Sign in with Google" not in html
    assert "Agent Authentication" not in html
