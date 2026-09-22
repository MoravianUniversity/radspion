#!/bin/bash
# Preview redeploy on webapps as user radspiondev (dev.radspion.com).
# Requires passwordless sudo for systemctl — install deploy/sudoers-radspiondev.
# Does not touch the database.
#
# Usage: ./redeploy-preview.sh <pr_number>
set -euo pipefail

PR="${1:-}"
if [[ ! "$PR" =~ ^[0-9]+$ ]]; then
  echo "usage: $0 <pr_number>" >&2
  exit 1
fi

sudo systemctl stop radspiondev
git fetch origin "pull/${PR}/head:preview" --force
git checkout preview
git reset --hard preview
.venv/bin/pip install -r requirements.txt
.venv/bin/pip install -e .
sudo systemctl start radspiondev
echo "PR ${PR} @ $(git rev-parse --short HEAD)" | tee .preview-status
