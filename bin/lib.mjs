// 決策迭代器 — 共用工具(零依賴,Node 內建模組)
import { existsSync, statSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";

export const SESSIONS_DIR = ".decision-iterator";

/** 計算優先分數 = 影響 × 可能性 / 成本 */
export function calcScore(p) {
  if (!p || !p.cost) return 0;
  return +((Number(p.impact) * Number(p.likelihood)) / Number(p.cost)).toFixed(2);
}

/** 把 arg 解析成 session-state.json 的絕對路徑。
 * 接受:完整 .json 路徑 / session 資料夾 / 純 session-id(查 <cwd>/.decision-iterator/<id>/)。
 */
export function resolveStatePath(arg, cwd = process.cwd()) {
  if (!arg) throw new Error("缺少 session 參數(可給 id、資料夾或 session-state.json 路徑)");
  let p = isAbsolute(arg) ? arg : resolve(cwd, arg);
  if (existsSync(p)) {
    const st = statSync(p);
    if (st.isFile()) return p;
    if (st.isDirectory()) {
      const cand = join(p, "session-state.json");
      if (existsSync(cand)) return cand;
    }
  }
  // 當成純 id 處理
  const byId = join(cwd, SESSIONS_DIR, arg, "session-state.json");
  if (existsSync(byId)) return byId;
  throw new Error(`找不到 session-state.json(試過:${p} 與 ${byId})`);
}

/** session-id 落地資料夾 */
export function sessionDir(id, cwd = process.cwd()) {
  return join(cwd, SESSIONS_DIR, id);
}

/** 標題 → kebab-case slug(保留中文,去掉空白與符號) */
export function slugify(s) {
  return String(s).trim().toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "session";
}

/** 重算所有節點分數(就地),回傳 state 本身 */
export function normalizeScores(state) {
  for (const n of state.nodes || []) {
    if (n.priority) n.priority.score = calcScore(n.priority);
  }
  return state;
}

/** 輕量驗證:檢查必要頂層欄位,回傳警告陣列(不阻擋) */
export function lintState(state) {
  const warn = [];
  const need = ["schemaVersion", "session", "lens", "phase", "frame", "nodes", "insights", "decision", "timeline", "redFlags"];
  for (const k of need) if (!(k in state)) warn.push(`缺少頂層欄位:${k}`);
  if (state.session && !state.session.updatedAt) warn.push("session.updatedAt 未設定(看板的『更新時間』會空白)");
  const ids = new Set();
  for (const n of state.nodes || []) {
    if (ids.has(n.id)) warn.push(`節點 id 重複:${n.id}`);
    ids.add(n.id);
    if (n.parent && !( (state.nodes||[]).some(x => x.id === n.parent) )) warn.push(`節點 ${n.id} 的 parent「${n.parent}」不存在`);
  }
  return warn;
}
