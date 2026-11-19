// Vice City Nights — the gta6-cover-art-01 entrypoint (Node 22, standard library only).
//
// The app is plain static files under app/ (index.html and its ES modules, no library
// and no network request), and this program hands it in: it copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Round 2 changed only the app under app/ and the screenshots: the entrypoint
// itself is unchanged apart from this note, so the two runs still match byte for byte.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root: the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader writes to /output; a local run names its own directory instead.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies one directory from the repository into the output, if it exists. */
function copyDir(name) {
  const source = join(repoRoot, name);
  if (!existsSync(source)) return;
  // Clear the destination first so a reused output directory never keeps stale files.
  rmSync(join(outputDir, name), { recursive: true, force: true });
  cpSync(source, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyDir('app');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyDir('screenshots');

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes the bytes;
// the rest refuse an entry the scorer would refuse — more than 4 screenshots or one
// over 256 KiB, more than 993 files in app/ or 48 MiB of app files in all, or a path
// under app/ over 1000 bytes. app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
