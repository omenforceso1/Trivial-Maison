import { cp, mkdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const DIST_DIR = resolve(ROOT_DIR, "dist");

async function copyEntry(entry) {
  const source = resolve(ROOT_DIR, entry);
  const destination = resolve(DIST_DIR, entry);
  await cp(source, destination, { recursive: true });
}

async function build() {
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  const entries = ["index.html", "assets", "src", "README.md"];
  await Promise.all(entries.map(copyEntry));

  console.log(`Dépôt prêt dans ${DIST_DIR}`);
}

build().catch((error) => {
  console.error("Échec de la génération", error);
  process.exitCode = 1;
});
