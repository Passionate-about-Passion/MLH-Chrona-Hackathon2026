// HTTPS-Reverse-Proxy fürs iPhone (Mikro braucht sicheren Kontext). Start: npm run phone
import https from "node:https";
import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PORT = Number(process.env.PHONE_PORT || 3443);
const TARGET = { host: "localhost", port: 3000 };
const DIR = path.join(process.cwd(), ".data", "https");
const f = (n) => path.join(DIR, n);
const DAYS = "825";

const ips = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

const openssl = (...args) => execFileSync("openssl", args, { stdio: "pipe" });

function ensureCerts() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(f("ca.crt")) || !fs.existsSync(f("ca.key"))) {
    const cfg = f("ca.cnf");
    fs.writeFileSync(
      cfg,
      "[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=Hacktober26 Dev CA\n" +
        "[ext]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n",
    );
    openssl("req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", f("ca.key"), "-out", f("ca.crt"), "-days", DAYS, "-config", cfg);
    fs.rmSync(f("server.crt"), { force: true });
  }
  const san = ["DNS:localhost", "IP:127.0.0.1", ...ips.map((i) => `IP:${i}`)];
  const stale =
    !fs.existsSync(f("server.crt")) ||
    ips.some((ip) => !execFileSync("openssl", ["x509", "-in", f("server.crt"), "-noout", "-text"]).toString().includes(`IP Address:${ip}`));
  if (!stale) return;
  const ext = f("server.ext");
  fs.writeFileSync(
    ext,
    `basicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=${san.join(",")}\n`,
  );
  openssl("req", "-newkey", "rsa:2048", "-nodes", "-keyout", f("server.key"), "-out", f("server.csr"), "-subj", "/CN=Hacktober26 Dev Server");
  openssl("x509", "-req", "-in", f("server.csr"), "-CA", f("ca.crt"), "-CAkey", f("ca.key"), "-CAcreateserial", "-out", f("server.crt"), "-days", DAYS, "-extfile", ext);
}

ensureCerts();

const server = https.createServer({ key: fs.readFileSync(f("server.key")), cert: fs.readFileSync(f("server.crt")) }, (req, res) => {
  if (req.url === "/ca.crt") {
    res.writeHead(200, { "Content-Type": "application/x-x509-ca-cert" });
    return res.end(fs.readFileSync(f("ca.crt")));
  }
  const up = http.request({ ...TARGET, method: req.method, path: req.url, headers: req.headers }, (r) => {
    res.writeHead(r.statusCode ?? 502, r.headers);
    r.pipe(res);
  });
  up.on("error", (e) => {
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(`502 Proxy-Fehler: ${e.message}`);
  });
  req.pipe(up);
});

// WebSocket (HMR): rohe Header + Socket durchreichen
server.on("upgrade", (req, socket, head) => {
  const up = net.connect(TARGET.port, TARGET.host, () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    up.write(lines.join("\r\n") + "\r\n\r\n");
    up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, "0.0.0.0", () => {
  const ip = ips[0] ?? "localhost";
  console.log(`HTTPS-Proxy -> http://localhost:3000\n  App:  https://${ip}:${PORT}\n  Zert: https://${ip}:${PORT}/ca.crt\n`);
  console.log(
    "iPhone (einmalig):\n" +
      "  1. /ca.crt in Safari öffnen -> Profil laden\n" +
      "  2. Einstellungen > Allgemein > VPN und Geräteverwaltung > Profil installieren\n" +
      "  3. Einstellungen > Allgemein > Info > Zertifikatsvertrauenseinstellungen\n" +
      "  4. \"Hacktober26 Dev CA\" voll vertrauen, dann die App-URL öffnen",
  );
});
