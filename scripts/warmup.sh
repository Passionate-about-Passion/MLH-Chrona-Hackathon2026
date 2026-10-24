#!/usr/bin/env bash
# Laedt Gemma in den Speicher und haelt es dort (keep_alive -1). Vor der Demo: npm run warmup
M="${OLLAMA_MODEL:-gemma4:e4b}"
H="${OLLAMA_HOST_URL:-http://localhost:11434}"
curl -sf "$H/api/tags" >/dev/null || { echo "Ollama laeuft nicht ($H). Ollama-App starten."; exit 1; }
curl -s "$H/api/tags" | grep -q "\"$M\"" || { echo "Modell $M fehlt: ollama pull $M"; exit 1; }
if [ "$(uname)" = Darwin ]; then
  launchctl setenv OLLAMA_KEEP_ALIVE -1
  echo "OLLAMA_KEEP_ALIVE=-1 gesetzt. Gilt erst nach Neustart der Ollama-App (einmal beenden und neu oeffnen)."
fi
echo "Lade $M ..."
s=$(date +%s)
curl -sf "$H/api/generate" -d "{\"model\":\"$M\",\"prompt\":\"Hi\",\"stream\":false,\"keep_alive\":-1,\"options\":{\"num_predict\":1}}" >/dev/null || { echo "Anfrage fehlgeschlagen"; exit 1; }
echo "Warmup: $(( $(date +%s) - s )) s"
ollama ps
