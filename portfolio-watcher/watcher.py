from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "300"))  # seconds
# The portfolio repo to rebuild. Defaults to "<authenticated-user>/portfolio-coding".
PORTFOLIO_REPO = os.environ.get("PORTFOLIO_REPO", "")
STATE_FILE = Path("/data/state.json")


def gh(path: str, *, token: str = GITHUB_TOKEN, method: str = "GET", body=None):
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        data=json.dumps(body).encode() if body else None,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
        method=method,
    )
    with urllib.request.urlopen(req) as r:
        content = r.read()
        return json.loads(content) if content else {}


def get_authenticated_user() -> str:
    return gh("/user").get("login", "")


def resolve_portfolio_repo() -> str:
    if PORTFOLIO_REPO:
        return PORTFOLIO_REPO
    user = get_authenticated_user()
    return f"{user}/portfolio-coding"


def load_state() -> dict:
    return json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def get_portfolio_repos(portfolio_repo: str) -> list[dict]:
    repos = gh(f"/user/repos?per_page=100&type=all")
    return [
        r
        for r in repos
        if "portfolio" in r.get("topics", []) and r["full_name"] != portfolio_repo
    ]


def get_latest_sha(full_name: str) -> str | None:
    try:
        commits = gh(f"/repos/{full_name}/commits?per_page=1")
        return commits[0]["sha"] if commits else None
    except Exception:
        return None


def trigger_rebuild(portfolio_repo: str, source_repo: str) -> None:
    gh(
        f"/repos/{portfolio_repo}/dispatches",
        method="POST",
        body={
            "event_type": "portfolio-data-changed",
            "client_payload": {"repo": source_repo},
        },
    )
    print(f"  ↑ dispatch triggered by {source_repo}", flush=True)


def poll(portfolio_repo: str) -> None:
    print("Polling GitHub for portfolio repo changes...", flush=True)
    state = load_state()
    triggered = False

    for repo in get_portfolio_repos(portfolio_repo):
        full_name = repo["full_name"]
        sha = get_latest_sha(full_name)
        if sha and state.get(full_name) != sha:
            print(f"  {full_name}: new commit {sha[:7]}", flush=True)
            if full_name in state:  # skip triggering on first run — just establish baseline
                trigger_rebuild(portfolio_repo, full_name)
                triggered = True
            state[full_name] = sha

    save_state(state)
    if not triggered:
        print("  no changes", flush=True)


if __name__ == "__main__":
    portfolio_repo = resolve_portfolio_repo()
    print(
        f"portfolio-watcher starting (target={portfolio_repo}, poll interval={POLL_INTERVAL}s)",
        flush=True,
    )
    while True:
        try:
            poll(portfolio_repo)
        except Exception as e:
            print(f"  error during poll: {e}", flush=True)
        time.sleep(POLL_INTERVAL)
