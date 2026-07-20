/**
 * One-shot recorder for the self-playing /demo route → presentation MP4.
 *
 * Spawns a production Next server, drives a headless Chromium through
 * /demo?chrome=0 (which auto-plays the full quiz → AI matching flow), records
 * video, converts it to a slide-friendly H.264 MP4 with ffmpeg, then shuts the
 * server down. Nothing is left running.
 *
 *   node scripts/record-demo.mjs
 *
 * Requires: a production build (`npm run build`), ffmpeg on PATH, and Playwright
 * + Chromium installed (`npm install --no-save playwright && npx playwright
 * install chromium`). Playwright is intentionally NOT a saved dependency — it's
 * a throwaway recording utility, not part of the product.
 */

import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 3210;
const URL = `http://127.0.0.1:${PORT}/demo?chrome=0`;
const OUT_DIR = path.join(ROOT, "recordings");
const RAW_DIR = path.join(OUT_DIR, ".raw");
const MP4_PATH = path.join(OUT_DIR, "edfind-quiz-ai-demo.mp4");

// 1080p, the native slide resolution — content sits centered exactly as it does
// on a real desktop browser.
const WIDTH = 1920;
const HEIGHT = 1080;

function log(msg) {
  process.stdout.write(`[record-demo] ${msg}\n`);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: true, ...opts });
    let stderr = "";
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0 && res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

async function main() {
  if (!existsSync(path.join(ROOT, ".next"))) {
    throw new Error("No .next build found — run `npm run build` first.");
  }
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  log(`starting production server on :${PORT} …`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    shell: true,
    stdio: "ignore",
  });
  server.on("error", (e) => log(`server error: ${e.message}`));

  const stopServer = () => {
    if (server.pid) {
      // Kill the whole tree on Windows; SIGTERM elsewhere.
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
          shell: true,
          stdio: "ignore",
        });
      } else {
        server.kill("SIGTERM");
      }
    }
  };

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/demo`);
    log("server ready — launching browser");

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
      recordVideo: { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT } },
    });
    const page = await context.newPage();

    log("recording /demo?chrome=0 …");
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    // The demo sets window.__edfindDemoComplete when results render.
    await page.waitForFunction(
      () => window.__edfindDemoComplete === true,
      undefined,
      { timeout: 200000, polling: 400 },
    );
    // The director already holds on the final applications frame; small buffer.
    await page.waitForTimeout(1400);

    const video = page.video();
    await context.close(); // finalizes the webm
    const webm = await video.path();
    await browser.close();
    log(`raw capture: ${webm}`);

    log("converting to MP4 (H.264 / yuv420p) …");
    await run("ffmpeg", [
      "-y",
      "-i",
      `"${webm}"`,
      "-vf",
      '"scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p"',
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-crf",
      "20",
      "-preset",
      "medium",
      "-r",
      "30",
      "-movflags",
      "+faststart",
      "-an",
      `"${MP4_PATH}"`,
    ]);

    await rm(RAW_DIR, { recursive: true, force: true });
    log(`DONE → ${MP4_PATH}`);
  } finally {
    stopServer();
  }
}

main().catch((err) => {
  console.error(`[record-demo] FAILED: ${err.message}`);
  process.exitCode = 1;
});
