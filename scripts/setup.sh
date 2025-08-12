#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1) Node prüfen
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js nicht gefunden. Bitte Node 20+ installieren (z.B. via https://nodejs.org oder nvm)."
  exit 1
fi
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  echo "❌ Node >= 20 erforderlich. Gefunden: $(node -v)"
  exit 1
fi

# 2) pnpm bereitstellen
if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    echo "→ enabling corepack + pnpm@9"
    corepack enable || true
    corepack prepare pnpm@9 --activate
  else
    echo "→ installing pnpm globally via npm"
    npm i -g pnpm
  fi
fi

echo "→ Installing workspace deps"
pnpm install

echo "→ Building codex-cli"
pnpm -C "${ROOT_DIR}/codex-cli" build

echo "→ Linking codex-flow globally"
pnpm link -g "${ROOT_DIR}/codex-cli"

# 3) PATH sicherstellen
PNPM_BIN="$(pnpm bin -g)"
case ":$PATH:" in
  *":$PNPM_BIN:"*) : ;;
  *)
    echo "→ Adding PNPM_HOME to PATH in ~/.bashrc and ~/.zshrc"
    echo "export PNPM_HOME=\"${PNPM_BIN}\"" >> "${HOME}/.bashrc" || true
    echo "export PATH=\"\$PNPM_HOME:\$PATH\"" >> "${HOME}/.bashrc" || true
    echo "export PNPM_HOME=\"${PNPM_BIN}\"" >> "${HOME}/.zshrc" || true
    echo "export PATH=\"\$PNPM_HOME:\$PATH\"" >> "${HOME}/.zshrc" || true
    ;;
esac

echo
echo "✅ Setup fertig."
echo "Starte jetzt:"
echo "  codex-flow --help"
echo "  codex-flow                # REPL im aktuellen Ordner"
echo "  codex-flow chat flows/examples/code-assistant.flow.yaml"
