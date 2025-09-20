import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const PORT = Number(process.env.PORT ?? 5173);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sanitizePath(urlPath) {
  const withoutQuery = urlPath.split("?")[0];
  const decoded = decodeURIComponent(withoutQuery);
  if (decoded.endsWith("/")) {
    return `${decoded}index.html`;
  }
  return decoded === "" || decoded === "/" ? "/index.html" : decoded;
}

async function serveFile(filePath, res) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      const indexPath = join(filePath, "index.html");
      return serveFile(indexPath, res);
    }
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end(error.code === "ENOENT" ? "Fichier introuvable" : "Erreur interne du serveur");
  }
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Requête invalide");
    return;
  }

  const requestedPath = sanitizePath(req.url);
  const absolutePath = resolve(ROOT_DIR, `.${requestedPath}`);

  if (!absolutePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Accès refusé");
    return;
  }

  serveFile(absolutePath, res);
});

server.listen(PORT, () => {
  console.log(`Serveur de développement lancé sur http://localhost:${PORT}`);
});
