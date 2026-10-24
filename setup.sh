#!/usr/bin/env bash
# Hacktober26 – installiert alle Claude-Code-Plugins und Skills aus diesem Repo.
#
#   bash setup.sh            # Team-Marketplace von GitHub (Passionate-about-Passion/Hacktober26)
#   bash setup.sh --local    # Team-Marketplace aus diesem Ordner (z. B. vor dem Merge auf main)
#
# Mehrfach ausführbar: Bereits Installiertes wird übersprungen.
# Windows: in Git Bash oder WSL ausführen.
#
# Woher die Namen kommen (nichts ist hart codiert):
#   .claude-plugin/marketplace.json   → Plugins dieses Repos
#   .claude/settings.json             → extraKnownMarketplaces + enabledPlugins (z. B. superpowers, context7)
#   **/SKILL.md außerhalb von Plugins → lose Skills, werden nach ~/.claude/skills/ kopiert

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARKETPLACE_JSON="$REPO_ROOT/.claude-plugin/marketplace.json"
SETTINGS_JSON="$REPO_ROOT/.claude/settings.json"
SKILLS_TARGET="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
GITHUB_REPO="Passionate-about-Passion/Hacktober26"
MARKER=".hacktober26-managed"

USE_LOCAL=0
for arg in "$@"; do
  case "$arg" in
    --local) USE_LOCAL=1 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unbekannte Option: $arg (erlaubt: --local)"; exit 2 ;;
  esac
done

# ---------- Ausgabe ----------
INSTALLED=(); SKIPPED=(); FAILED=()
ok()   { INSTALLED+=("$1"); echo "  ✅ $1"; }
skip() { SKIPPED+=("$1");   echo "  ⏭  $1"; }
fail() { FAILED+=("$1");    echo "  ❌ $1"; }

# ---------- Voraussetzungen ----------
if ! command -v claude >/dev/null 2>&1; then
  echo "❌ 'claude' nicht gefunden. Erst Claude Code installieren: https://docs.claude.com/en/docs/claude-code"
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 'node' nicht gefunden (wird zum Lesen der JSON-Dateien gebraucht). Node.js 18+ installieren."
  exit 1
fi
[ -f "$MARKETPLACE_JSON" ] || { echo "❌ $MARKETPLACE_JSON fehlt."; exit 1; }

# JSON-Helfer: node -e '<js>' <datei>  → gibt Zeilen aus
json() { node -e "$1" "${@:2}"; }

MP_NAME="$(json 'console.log(require(process.argv[1]).name)' "$MARKETPLACE_JSON")"

# ---------- 1. Marketplaces ----------
echo "▶ Marketplaces"

marketplace_names() {
  claude plugin marketplace list --json 2>/dev/null | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      try{const a=JSON.parse(s||"[]");(Array.isArray(a)?a:Object.values(a)).forEach(m=>console.log(m.name||m.id||""))}catch(e){}
    })'
}

ensure_marketplace() { # name source
  local name="$1" source="$2"
  if marketplace_names | grep -qx "$name"; then
    if claude plugin marketplace update "$name" >/dev/null 2>&1; then
      skip "Marketplace $name (schon da, aktualisiert)"
    else
      skip "Marketplace $name (schon da)"
    fi
  elif claude plugin marketplace add "$source" >/dev/null 2>&1; then
    ok "Marketplace $name ← $source"
  else
    fail "Marketplace $name ← $source"
  fi
}

# Team-Marketplace dieses Repos
if [ "$USE_LOCAL" = 1 ]; then ensure_marketplace "$MP_NAME" "$REPO_ROOT"
else ensure_marketplace "$MP_NAME" "$GITHUB_REPO"; fi

# Weitere Marketplaces aus .claude/settings.json (extraKnownMarketplaces)
if [ -f "$SETTINGS_JSON" ]; then
  while IFS=$'\t' read -r name source; do
    [ -n "$name" ] || continue
    [ "$name" = "$MP_NAME" ] && continue
    ensure_marketplace "$name" "$source"
  done < <(json '
    const s=require(process.argv[1]).extraKnownMarketplaces||{};
    for (const [n,v] of Object.entries(s)) {
      const src=v.source||{};
      const loc=src.repo||src.url||src.path||"";
      if (loc) console.log(n+"\t"+loc);
    }' "$SETTINGS_JSON")
fi

# ---------- 2. Plugins ----------
echo "▶ Plugins"

installed_ids() {
  claude plugin list --json 2>/dev/null | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      try{JSON.parse(s||"[]").forEach(p=>console.log(p.id))}catch(e){}
    })'
}

PLUGINS="$(
  json 'const m=require(process.argv[1]);(m.plugins||[]).forEach(p=>console.log(p.name+"@"+m.name))' "$MARKETPLACE_JSON"
  [ -f "$SETTINGS_JSON" ] && json '
    const e=require(process.argv[1]).enabledPlugins||{};
    Object.entries(e).filter(([,v])=>v).forEach(([k])=>console.log(k))' "$SETTINGS_JSON"
)"
PLUGINS="$(printf '%s\n' "$PLUGINS" | awk 'NF && !seen[$0]++')"

ALREADY="$(installed_ids)"
for id in $PLUGINS; do
  if printf '%s\n' "$ALREADY" | grep -qx "$id"; then
    skip "$id (schon installiert)"
  elif claude plugin install "$id" --scope user >/dev/null 2>&1; then
    ok "$id"
  else
    fail "$id (Installation fehlgeschlagen – 'claude plugin install $id' manuell versuchen)"
  fi
done

# ---------- 3. Lose Skills ----------
echo "▶ Lose Skills → $SKILLS_TARGET"

skill_name() { # SKILL.md → name aus Frontmatter, sonst Ordnername
  local n
  n="$(awk 'NR==1 && $0!="---"{exit} NR>1 && $0=="---"{exit} /^name:/{sub(/^name:[ \t]*/,"");gsub(/["'\'']/,"");print;exit}' "$1")"
  [ -n "$n" ] && echo "$n" || basename "$(dirname "$1")"
}

# Skill-Namen, die schon in einem Plugin stecken (Plugins im Repo + installierte Plugins)
PLUGIN_SKILLS="$(
  {
    find "$REPO_ROOT/plugins" -path '*/skills/*/SKILL.md' 2>/dev/null
    claude plugin list --json 2>/dev/null | node -e '
      let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        try{JSON.parse(s||"[]").forEach(p=>p.installPath&&console.log(p.installPath))}catch(e){}
      })' | while read -r p; do find "$p" -path '*/skills/*/SKILL.md' 2>/dev/null; done
  } | while read -r f; do skill_name "$f"; done | sort -u
)"

LOOSE="$(find "$REPO_ROOT" \
  \( -name node_modules -o -name .git -o -name .next -o -path "$REPO_ROOT/plugins" \) -prune -o \
  -name SKILL.md -type f -print 2>/dev/null | sort)"

mkdir -p "$SKILLS_TARGET"
if [ -z "$LOOSE" ]; then echo "  (keine losen Skills gefunden)"; fi
while IFS= read -r f; do
  [ -n "$f" ] || continue
  src="$(dirname "$f")"; name="$(skill_name "$f")"; dst="$SKILLS_TARGET/$name"
  if printf '%s\n' "$PLUGIN_SKILLS" | grep -qx "$name"; then
    skip "Skill $name (steckt schon in einem Plugin)"
  elif [ -d "$dst" ] && [ ! -f "$dst/$MARKER" ]; then
    skip "Skill $name (in $SKILLS_TARGET existiert ein eigener Skill mit diesem Namen – nicht überschrieben)"
  elif [ -d "$dst" ] && diff -rq -x "$MARKER" "$src" "$dst" >/dev/null 2>&1; then
    skip "Skill $name (aktuell)"
  else
    action="kopiert"; [ -d "$dst" ] && action="aktualisiert"
    rm -rf "$dst" && cp -R "$src" "$dst" && touch "$dst/$MARKER" \
      && ok "Skill $name ($action)" || fail "Skill $name (kopieren fehlgeschlagen)"
  fi
done <<< "$LOOSE"

# ---------- Zusammenfassung ----------
echo
echo "════════ Zusammenfassung ════════"
echo "Neu/aktualisiert: ${#INSTALLED[@]} · Übersprungen: ${#SKIPPED[@]} · Fehler: ${#FAILED[@]}"
[ ${#INSTALLED[@]} -gt 0 ] && printf '  ✅ %s\n' "${INSTALLED[@]}"
[ ${#FAILED[@]} -gt 0 ] && printf '  ❌ %s\n' "${FAILED[@]}"
echo
echo "Installierte Plugins:"
claude plugin list 2>/dev/null | sed 's/^/  /'
echo
echo "Claude Code neu starten, damit alles geladen wird."
[ ${#FAILED[@]} -eq 0 ]
