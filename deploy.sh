#!/usr/bin/env bash
# books を Cloudflare Pages（プロジェクト soranoshita-books）へ公開する。
# 公開するのはコミット済みの内容（git archive HEAD）。GitHub Pages と同じものが出る。
# 使い方: node build.js → git commit → bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d)
git archive HEAD | tar -x -C "$TMP"
npx --yes wrangler@latest pages deploy "$TMP" --project-name soranoshita-books --branch main --commit-hash "$(git rev-parse HEAD)" --commit-message "$(git log -1 --pretty=%s | head -c 300)"
rm -rf "$TMP"
