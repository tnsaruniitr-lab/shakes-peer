#!/bin/bash
# Auto-sync shakes-peer to origin/main after Claude Code edits.
#
# Flow:
#   1. Read the edited file_path from the hook JSON on stdin
#   2. Bail if the file isn't inside serp-analyzer/
#   3. Bail if a merge/rebase/cherry-pick is in progress
#   4. Debounce: touch a dirty marker, async-sleep 4s, then commit+push
#      — if another hook fires in the meantime it wins the lock instead
#   5. Commit + push to origin main, all errors silent (hook mustn't block)

set -u

REPO_DIR="/Users/arunsharma/Documents/New project/serp-analyzer"
LOCK="$REPO_DIR/.git/.auto-sync.lock"
DIRTY="$REPO_DIR/.git/.auto-sync.dirty"
LOG="$REPO_DIR/.git/.auto-sync.log"

# Read hook input (JSON on stdin) and extract the edited file path
input=$(cat)
file_path=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    p = (d.get('tool_input') or {}).get('file_path') or (d.get('tool_response') or {}).get('filePath') or ''
    print(p)
except Exception:
    pass
" <<< "$input" 2>/dev/null)

# Bail if file isn't in this repo
if [[ -z "$file_path" ]] || [[ "$file_path" != "$REPO_DIR"/* ]]; then
  exit 0
fi

# Bail if we're inside .git itself (don't commit on our own lockfile writes)
if [[ "$file_path" == "$REPO_DIR/.git/"* ]]; then
  exit 0
fi

# Bail if a merge/rebase is in progress
for state in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
  if [[ -f "$REPO_DIR/.git/$state" ]]; then
    echo "[$(date +%H:%M:%S)] SKIP: $state exists" >> "$LOG"
    exit 0
  fi
done

# Mark the tree dirty and request a commit
touch "$DIRTY"

# Fork a debounced committer. Only one runs at a time.
(
  # Try to acquire the lock — if another committer is already running, bail
  if ! ( set -o noclobber; echo $$ > "$LOCK" ) 2>/dev/null; then
    exit 0
  fi
  trap 'rm -f "$LOCK"' EXIT

  # Wait for the debounce window. If more saves fire, DIRTY stays touched.
  sleep 4

  # Only commit if something changed since we started waiting.
  [[ ! -f "$DIRTY" ]] && exit 0
  rm -f "$DIRTY"

  cd "$REPO_DIR" || exit 0

  # Stage + check if there's anything to commit
  git add -A 2>/dev/null
  if git diff --cached --quiet 2>/dev/null; then
    echo "[$(date +%H:%M:%S)] No staged changes, skipping" >> "$LOG"
    exit 0
  fi

  # Build a commit message from the changed files
  files=$(git diff --cached --name-only | head -5 | sed 's/^/  /')
  count=$(git diff --cached --name-only | wc -l | tr -d ' ')
  msg="auto-sync: $count file(s) updated

$files"

  if git commit -m "$msg" --no-verify >> "$LOG" 2>&1; then
    git push origin main >> "$LOG" 2>&1 && \
      echo "[$(date +%H:%M:%S)] Pushed $count file(s)" >> "$LOG" || \
      echo "[$(date +%H:%M:%S)] Push failed" >> "$LOG"
  else
    echo "[$(date +%H:%M:%S)] Commit failed" >> "$LOG"
  fi
) >/dev/null 2>&1 &
disown

exit 0
