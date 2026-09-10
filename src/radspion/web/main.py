"""Public pages blueprint."""

from flask import Blueprint, current_app, g, render_template, send_from_directory

from radspion.web.guards import resolve_optional_session_user

main_bp = Blueprint("main", __name__)


@main_bp.get("/favicon.ico")
def favicon():
    return send_from_directory(
        current_app.static_folder,
        "favicon.ico",
        mimetype="image/vnd.microsoft.icon",
    )


def _render_with_session_user(template: str):
    """Render a public page that adapts when an agent is signed in.

    The landing page swaps its sign-in card for a way into the dashboard; About
    and Privacy render inside the signed-in shell.
    """
    user = resolve_optional_session_user()
    if user is not None:
        g.user = user
    return render_template(template, user=user)


@main_bp.get("/")
def index():
    return _render_with_session_user("index.html")


@main_bp.get("/about")
def about():
    return _render_with_session_user("about.html")


@main_bp.get("/privacy")
def privacy():
    return _render_with_session_user("privacy.html")


@main_bp.get("/activity")
def activity():
    """Public Field Activity page."""
    radspion = current_app.extensions["radspion"]
    user = resolve_optional_session_user()
    if user is not None:
        g.user = user
    return render_template(
        "activity.html",
        user=user,
        activity=radspion.get_field_activity(),
    )
