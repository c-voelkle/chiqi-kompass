#!/bin/bash
# PostToolUse hook: after an edit to an app file under deploy/, run the
# design-system guard so violations surface immediately (docs/DESIGN_LANGUAGE.md).
input=$(cat)
file=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&(j.tool_input.file_path||j.tool_input.path))||"")}catch(e){}})')
case "$file" in
  */deploy/*.html|*/deploy/*.js|*/deploy/*.css) ;;
  *) exit 0 ;;
esac
root="$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null)" || exit 0
out=$(node "$root/deploy/test_design_system.mjs" 2>&1) || {
  printf 'Design-system check failed after editing %s (see docs/DESIGN_LANGUAGE.md §6):\n%s\n' "$file" "$out" | head -60 >&2
  exit 2
}
case "$file" in
  */deploy/ui/kompass.css)
    out=$(node "$root/deploy/ui/test_contrast.mjs" 2>&1) || { printf 'Token contrast check failed:\n%s\n' "$out" >&2; exit 2; } ;;
esac
exit 0
