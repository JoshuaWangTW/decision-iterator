#!/usr/bin/env node
// 決策迭代器 — 建立新的 session-state.json 骨架
// 用法:
//   node new-session.mjs "標題" [business|career|hybrid] [--id <自訂id>] [--render]
// 例:
//   node new-session.mjs "要不要把副業轉全職" career --render

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sessionDir, slugify } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { positional: [], id: null, render: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--id") out.id = argv[++i];
    else if (a === "--render") out.render = true;
    else out.positional.push(a);
  }
  return out;
}

function main() {
  const { positional, id: customId, render } = parseArgs(process.argv.slice(2));
  const title = positional[0];
  const lens = positional[1] || "business";
  if (!title) {
    console.error('用法:node new-session.mjs "標題" [business|career|hybrid] [--id <id>] [--render]');
    process.exit(1);
  }
  if (!["business", "career", "hybrid"].includes(lens)) {
    console.error("✗ lens 只能是 business / career / hybrid");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  const id = customId || `${date}-${slugify(title)}`;
  const dir = sessionDir(id);
  if (existsSync(join(dir, "session-state.json"))) {
    console.error(`✗ session 已存在:${dir}(用 --id 換個名稱,或直接編輯既有檔)`);
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });

  const state = {
    schemaVersion: "1.0",
    session: { id, title, createdAt: now, updatedAt: now },
    lens,
    phase: "frame",
    frame: { rawAsk: title, decision: "", owner: "", stakes: "", successCriteria: "" },
    nodes: [],
    insights: [],
    decision: { options: [], chosen: "", nextSteps: [] },
    timeline: [{ ts: now, type: "phase-change", detail: "建立 session,進入 FRAME 階段" }],
    redFlags: []
  };

  const statePath = join(dir, "session-state.json");
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  console.log("✓ 已建立 session:" + statePath);

  if (render) {
    execFileSync(process.execPath, [join(__dir, "render.mjs"), statePath], { stdio: "inherit" });
  } else {
    console.log("  接著跑:node \"" + join(__dir, "render.mjs") + "\" \"" + statePath + "\"");
  }
}

main();
