#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract data from JSON
cwd=$(echo "$input" | jq -r '.workspace.current_dir')
model=$(echo "$input" | jq -r '.model.display_name')
session_name=$(echo "$input" | jq -r '.session_name // empty')
remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
used_tokens=$(echo "$input" | jq -r '.context_window.total_input_tokens // empty')
total_tokens=$(echo "$input" | jq -r '.context_window.context_window_size // empty')

# Get short directory name (basename)
dir_name=$(basename "$cwd")

# Git information
git_info=""
if git -C "$cwd" rev-parse --git-dir > /dev/null 2>&1; then
  branch=$(git -C "$cwd" -c core.useBuiltinFSMonitor=false -c core.fsmonitor=false symbolic-ref --short HEAD 2>/dev/null || echo "detached")

  # Check for uncommitted changes
  if ! git -C "$cwd" -c core.useBuiltinFSMonitor=false -c core.fsmonitor=false diff --quiet 2>/dev/null || \
     ! git -C "$cwd" -c core.useBuiltinFSMonitor=false -c core.fsmonitor=false diff --cached --quiet 2>/dev/null; then
    status="✗"
  else
    status=""
  fi

  git_info=" git:($(printf '\033[31m')${branch}$(printf '\033[0m'))${status}"
fi

# Format token information
format_token_count() {
  local value=$1
  if (( value >= 1000 )); then
    printf "%.1fk" "$(bc <<< "scale=1; $value / 1000")"
  else
    echo "$value"
  fi
}

# Get color based on usage percentage
get_color_for_percentage() {
  local percentage=$1
  if (( percentage >= 90 )); then
    printf '\033[31m'  # red
  elif (( percentage >= 70 )); then
    printf '\033[33m'  # yellow
  else
    printf '\033[0m'   # reset (no color)
  fi
}

# Build status line in robbyrussell style
status_line="$(printf '\033[36m')${dir_name}$(printf '\033[0m')${git_info}"

# Add context percentage if available
if [ -n "$remaining" ]; then
  # Calculate usage percentage (100 - remaining)
  usage=$((100 - remaining))
  color=$(get_color_for_percentage "$usage")
  status_line="${status_line} | ctx:${color}${usage}%$(printf '\033[0m')"
fi

# Add token information if available
if [ -n "$used_tokens" ] && [ -n "$total_tokens" ]; then
  used_formatted=$(format_token_count "$used_tokens")
  total_formatted=$(format_token_count "$total_tokens")
  # Calculate token usage percentage
  token_usage=$(echo "scale=0; $used_tokens * 100 / $total_tokens" | bc)
  color=$(get_color_for_percentage "$token_usage")
  status_line="${status_line} | token:${color}${used_formatted}/${total_formatted}$(printf '\033[0m')"
fi

# Add model info
status_line="${status_line} | ${model}"

# Add session name if set
if [ -n "$session_name" ]; then
  status_line="${status_line} [${session_name}]"
fi

printf "%s" "$status_line"
