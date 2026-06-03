# 決策迭代器 · Decision Iterator

把任何決策(商業或職涯)當成一個**要持續迭代的產品**:框定 → 拆解 → 驗證 → 收斂 → 決策 → 交付 → 迭代。
整合 `business-analysis` 與 `career-iteration` 兩個姊妹 skill 為**單一引擎**;用 JSON 當大腦、單檔 HTML 看板把**所有思路可視化**,且能在**任何回合被打斷、注入新思考並重新規劃**。

## 三個核心特性
1. **所有思路可視化** — 每次更新重生 `dashboard.html`:假設樹、假設看板、洞察、決策、打斷軌跡。
2. **可中途打斷** — 隨時注入新假設 / 重新框定 / 重排 / 分枝 / 切鏡頭,引擎立刻重算下一步。
3. **Dynamic workflow** — 不是固定腳本;依「目前狀態」決定下一個最該做的階段。

## 怎麼用(在 Claude Code 裡)
直接跟 Claude 說你的決策,例如:
- 「幫我開一個 session:要不要把週末的副業轉成全職」
- 「某產品線營收掉了 2 成,幫我拆原因」
- 對話中隨時打斷:「等等,我想到第三條路…」「這題其實該從職涯角度看」

Claude 會:建立/更新 `./.decision-iterator/<id>/session-state.json` → 重生看板 → 給你路徑。
把 `dashboard.html` 開在瀏覽器,邊聊邊看思路長出來。

## 安裝(第一次使用 / 分享給朋友)

這是一個 Claude Code skill。把整個 `decision-iterator` 資料夾放進 Claude Code 的 skills 目錄即可,**不需要 GitHub 帳號**:

| 系統 | 放到這裡 |
|---|---|
| Windows | `C:\Users\<你的使用者名>\.claude\skills\decision-iterator` |
| macOS / Linux | `~/.claude/skills/decision-iterator` |

步驟:
1. 把拿到的 `decision-iterator.zip` 解壓縮。
2. 把解出來的 `decision-iterator` 資料夾整個搬到上表的 skills 目錄下(若 `.claude\skills` 不存在就自己建)。
3. 確認電腦有安裝 **[Node.js](https://nodejs.org)**(渲染看板用;任意近代版本皆可)。
4. 重開 Claude Code → 直接說「幫我開一個決策 session」就會觸發,或輸入 `/decision-iterator`。

> 全部路徑都是自動偵測的,搬到哪台電腦、哪個使用者名稱都能跑,無需修改任何檔案。

## 手動操作(可選)

在 skill 資料夾內執行(`<SKILL_DIR>` = 這個 `decision-iterator` 資料夾):
```bash
# 建立新 session
node bin/new-session.mjs "決策標題" hybrid --render

# 改完 JSON 後重生看板
node bin/render.mjs <session-id 或 JSON 路徑>

# 即時自動刷新(在 session 資料夾,選配;需要 Python)
python -m http.server 8765   # 開 http://localhost:8765/dashboard.html
```
零依賴,只需 Node。看板純雙擊也能開(離線可用);Python 那步只是為了「自動刷新」,沒有也沒關係。

## 檔案結構
```
decision-iterator/
├── SKILL.md                     引擎大腦:方法論 + 操作協定 + 打斷詞彙
├── README.md
├── schema/session-state.schema.json   狀態結構(單一事實來源)
├── assets/dashboard-template.html     自含看板模板(含 __STATE__ 注入點)
├── bin/
│   ├── render.mjs               JSON → dashboard.html(重算分數、零依賴)
│   ├── new-session.mjs          建立新 session 骨架
│   └── lib.mjs                  共用工具
├── references/                  8 份方法參考(3 商業 + 5 職涯)+ INDEX.md
└── examples/sample-hybrid-decision/   hybrid 範例(可直接 render 看效果)
```

## 看一眼範例
```bash
node bin/render.mjs examples/sample-hybrid-decision/session-state.json
# 然後雙擊 examples/sample-hybrid-decision/dashboard.html
```

> 整合 business-analysis 與 career-iteration 兩套方法為單一決策引擎。
