"""Tests for the Mission Data archive page."""

from radspion.web.session_keys import SESSION_USER_ID
from tests.helpers import SAMPLE_AGENTS


def test_mission_data_requires_login(testing_storyline_client):
    response = testing_storyline_client.get("/agent/data")

    assert response.status_code == 302
    assert response.location.endswith("/")


def test_mission_data_empty_when_no_completions(testing_storyline_client):
    with testing_storyline_client.session_transaction() as sess:
        sess[SESSION_USER_ID] = SAMPLE_AGENTS["diana"]["id"]

    response = testing_storyline_client.get("/agent/data")
    body = response.data.decode()

    assert response.status_code == 200
    assert "Mission Data" in body
    assert "datacard--empty" in body
    assert "recovered-data__value" not in body


def test_mission_data_lists_completed_recovered_data(testing_storyline_client):
    with testing_storyline_client.session_transaction() as sess:
        sess[SESSION_USER_ID] = SAMPLE_AGENTS["alice"]["id"]

    response = testing_storyline_client.get("/agent/data")
    body = response.data.decode()

    assert response.status_code == 200
    assert "datacard--empty" not in body
    assert "COMPLETE es-alpha" in body
    assert 'data-intel-open="debrief:es-alpha"' in body
    assert "recovered-data__value" in body
    assert "ES: Alpha" in body
    assert "Welcome to Radspion" in body
