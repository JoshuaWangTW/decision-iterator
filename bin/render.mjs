#!/usr/bin/env node
// 決策迭代器 — 把 session-state.json 渲染成自含的 dashboard.html
// 用法:
//   node render.mjs <session-id | 資料夾 | session-state.json 路徑>
//   node render.mjs               (不給參數 → 自動找 .decision-iterator/ 下最近更新的 session)
//
// 行為:重算節點優先分數並寫回 JSON(idempotent)→ 注入模板 → 寫出同資料夾的 dashboard.html

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveStatePath, normalizeScores, lintState, openFile, SESSIONS_DIR } from "./lib.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(__dir, "..", "assets", "dashboard-template.html");

/** 沒給參數時,找 cwd/.decision-iterator/ 下最近更新的 session */
function findLatest(cwd = process.cwd()) {
  const base = join(cwd, SESSIONS_DIR);
  if (!existsSync(base)) return null;
  const dirs = readdirSync(base)
    .map(d => join(base, d, "session-state.json"))
    .filter(p => existsSync(p))
    .map(p => ({ p, m: statSync(p).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return dirs.length ? dirs[0].p : null;
}

function main() {
  // 從 argv 過濾出 --open flag,剩下的才是位置參數
  const rawArgs = process.argv.slice(2);
  const openFlag = rawArgs.includes("--open");
  const positional = rawArgs.filter(a => a !== "--open");
  const arg = positional[0];

  let statePath;
  try {
    statePath = arg ? resolveStatePath(arg) : findLatest();
  } catch (e) {
    console.error("✗ " + e.message);
    process.exit(1);
  }
  if (!statePath) {
    console.error("✗ 找不到任何 session。先跑 new-session.mjs,或指定 session-state.json 路徑。");
    process.exit(1);
  }

  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (e) {
    console.error(`✗ 無法解析 JSON(${statePath}):${e.message}`);
    process.exit(1);
  }

  // 重算分數並寫回(讓 JSON 永遠和看板一致;Claude 只要填 impact/likelihood/cost)
  normalizeScores(state);
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");

  // 輕量 lint
  const warn = lintState(state);
  warn.forEach(w => console.warn("⚠  " + w));

  // 注入模板
  if (!existsSync(TEMPLATE)) {
    console.error(`✗ 找不到看板模板:${TEMPLATE}`);
    process.exit(1);
  }
  const tpl = readFileSync(TEMPLATE, "utf8");
  const hits = (tpl.match(/__STATE__/g) || []).length;
  if (hits !== 1) {
    console.error(`✗ 模板的占位符 __STATE__ 應恰好出現 1 次,實際 ${hits} 次。請檢查 assets/dashboard-template.html。`);
    process.exit(1);
  }
  const injected = tpl.replaceAll("__STATE__", JSON.stringify(state, null, 2));

  const outPath = join(dirname(statePath), "dashboard.html");
  writeFileSync(outPath, injected, "utf8");

  console.log("✓ 看板已更新!");
  console.log("  在瀏覽器按 ↻ 載入最新就能看到最新狀態。");
  console.log("  (如果還沒開過看板,雙擊這個檔案:" + outPath + ")");

  // --open flag:首次 render 時加入,瀏覽器自動開啟;後續 render 不加(使用者按 ↻ 載入最新即可)
  if (openFlag) {
    openFile(outPath);
  }
}

main();
