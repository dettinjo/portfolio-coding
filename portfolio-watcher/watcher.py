from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
GITHUB_USER = os.environ.get("GITHUB_USER", "dettinjo")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "300"))  # seconds
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


def load_state() -> dict:
    return json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def get_portfolio_repos() -> list[dict]:
    repos = gh(f"/user/repos?per_page=100&type=all")
    return [
        r
        for r in repos
        if "portfolio" in r.get("topics", []) and r["name"] != "portfolio-coding"
    ]


def get_latest_sha(repo_name: str) -> str | None:
    try:
        commits = gh(f"/repos/{GITHUB_USER}/{repo_name}/commits?per_page=1")
        return commits[0]["sha"] if commits else None
    except Exception:
        return None


def trigger_rebuild(repo_name: str) -> None:
    gh(
        "/repos/dettinjo/portfolio-coding/dispatches",
        method="POST",
        body={
            "event_type": "portfolio-data-changed",
            "client_payload": {"repo": f"{GITHUB_USER}/{repo_name}"},
        },
    )
    print(f"  ↑ dispatch triggered by {repo_name}", flush=True)


def poll() -> None:
    print("Polling GitHub for portfolio repo changes...", flush=True)
    state = load_state()
    triggered = False

    for repo in get_portfolio_repos():
        name = repo["name"]
        sha = get_latest_sha(name)
        if sha and state.get(name) != sha:
            print(f"  {name}: new commit {sha[:7]}", flush=True)
            if name in state:  # skip triggering on first run — just establish baseline
                trigger_rebuild(name)
                triggered = True
            state[name] = sha

    save_state(state)
    if not triggered:
        print("  no changes", flush=True)


if __name__ == "__main__":
    print(f"portfolio-watcher starting (poll interval={POLL_INTERVAL}s)", flush=True)
    while True:
        try:
            poll()
        except Exception as e:
            print(f"  error during poll: {e}", flush=True)
        time.sleep(POLL_INTERVAL)
