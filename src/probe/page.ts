export function probePage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ProxyAI Probe</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1b1f24;
      --muted: #667085;
      --border: #d9dee7;
      --alive: #18794e;
      --timeout: #c2410c;
      --error: #b42318;
      --rate: #a16207;
      --skipped: #475467;
      --accent: #0f6bff;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111318;
        --panel: #181b22;
        --text: #eef2f7;
        --muted: #9aa4b2;
        --border: #303746;
        --alive: #41b87a;
        --timeout: #f59e0b;
        --error: #ff6b6b;
        --rate: #eab308;
        --skipped: #98a2b3;
        --accent: #6aa3ff;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    header {
      border-bottom: 1px solid var(--border);
      background: var(--panel);
    }
    .wrap {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 72px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    .sub {
      color: var(--muted);
      font-size: 13px;
      margin-top: 4px;
    }
    button {
      border: 1px solid var(--accent);
      color: #fff;
      background: var(--accent);
      border-radius: 6px;
      padding: 9px 14px;
      font-weight: 650;
      cursor: pointer;
      min-width: 96px;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    main {
      padding: 24px 0 36px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    .metric-label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0;
    }
    .metric-value {
      margin-top: 8px;
      font-size: 28px;
      font-weight: 750;
      line-height: 1;
    }
    .metric-note {
      color: var(--muted);
      margin-top: 8px;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rate-panel {
      margin-top: 16px;
    }
    .rate-stats {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .rate-stat-label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0;
    }
    .rate-stat-value {
      margin-top: 6px;
      font-size: 20px;
      font-weight: 750;
      line-height: 1.1;
    }
    .rate-stat-note {
      color: var(--muted);
      margin-top: 4px;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rate-window {
      display: grid;
      grid-template-columns: repeat(24, minmax(0, 1fr));
      gap: 4px;
      height: 74px;
      align-items: end;
      padding-top: 12px;
    }
    .rate-bar {
      min-height: 3px;
      border-radius: 4px 4px 2px 2px;
      background: var(--accent);
    }
    .rate-bar.empty {
      background: var(--border);
      opacity: 0.55;
    }
    .rate-axis {
      display: flex;
      justify-content: space-between;
      color: var(--muted);
      font-size: 12px;
      margin-top: 6px;
    }
    section {
      margin-top: 16px;
    }
    .section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 16px;
      margin: 0;
      letter-spacing: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      border-bottom: 1px solid var(--border);
      padding: 10px 8px;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    tr:last-child td { border-bottom: 0; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--skipped);
    }
    .alive .dot { background: var(--alive); }
    .timeout .dot { background: var(--timeout); }
    .error .dot { background: var(--error); }
    .rate_limited .dot { background: var(--rate); }
    .skipped .dot { background: var(--skipped); }
    .muted { color: var(--muted); }
    .split {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
      gap: 16px;
    }
    .scroll {
      overflow: auto;
      max-height: 520px;
    }
    .empty {
      color: var(--muted);
      padding: 20px 0;
      font-size: 14px;
    }
    @media (max-width: 860px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .rate-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .split { grid-template-columns: 1fr; }
      .top { align-items: flex-start; flex-direction: column; padding: 16px 0; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap top">
      <div>
        <h1>ProxyAI Probe</h1>
        <div class="sub" id="statusLine">Loading</div>
      </div>
      <button id="runBtn" type="button">Run Now</button>
    </div>
  </header>
  <main class="wrap">
    <div class="grid" id="metrics"></div>
    <section class="panel rate-panel">
      <div class="section-head">
        <h2>Rate Limit</h2>
        <span class="muted" id="rateMeta"></span>
      </div>
      <div class="rate-stats" id="rateStats"></div>
      <div class="rate-window" id="rateWindow" aria-label="Rolling rate limit window"></div>
      <div class="rate-axis"><span id="rateOldest">window</span><span>now</span></div>
    </section>
    <section class="split">
      <div class="panel">
        <div class="section-head">
          <h2>Latest Results</h2>
          <span class="muted" id="latestMeta"></span>
        </div>
        <div class="scroll">
          <table>
            <thead><tr><th>Model</th><th>Category</th><th>Status</th><th>Latency</th><th>Note</th></tr></thead>
            <tbody id="resultsBody"></tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="panel">
          <div class="section-head">
            <h2>Fastest Alive</h2>
          </div>
          <table>
            <thead><tr><th>Model</th><th>Latency</th></tr></thead>
            <tbody id="fastestBody"></tbody>
          </table>
        </div>
        <section class="panel">
          <div class="section-head">
            <h2>History</h2>
          </div>
          <div class="scroll">
            <table>
              <thead><tr><th>Started</th><th>Source</th><th>Alive</th><th>Failed</th></tr></thead>
              <tbody id="historyBody"></tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  </main>
  <script>
    const runBtn = document.getElementById("runBtn");
    const statusLine = document.getElementById("statusLine");
    const metrics = document.getElementById("metrics");
    const latestMeta = document.getElementById("latestMeta");
    const resultsBody = document.getElementById("resultsBody");
    const fastestBody = document.getElementById("fastestBody");
    const historyBody = document.getElementById("historyBody");
    const rateMeta = document.getElementById("rateMeta");
    const rateStats = document.getElementById("rateStats");
    const rateWindow = document.getElementById("rateWindow");
    const rateOldest = document.getElementById("rateOldest");

    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function fmtTime(value) {
      return value ? new Date(value).toLocaleString() : "pending";
    }

    function fmtMs(value) {
      return typeof value === "number" ? value + "ms" : "-";
    }

    function fmtDuration(value) {
      if (typeof value !== "number") return "-";
      if (value <= 0) return "now";
      if (value < 1000) return value + "ms";
      const seconds = Math.ceil(value / 1000);
      if (seconds < 60) return seconds + "s";
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      return rest ? minutes + "m " + rest + "s" : minutes + "m";
    }

    function fmtPct(value) {
      return typeof value === "number" ? Math.round(value * 100) + "%" : "-";
    }

    function metric(label, value, note) {
      return '<div class="panel"><div class="metric-label">' + esc(label) + '</div><div class="metric-value">' + esc(value) + '</div><div class="metric-note">' + esc(note) + '</div></div>';
    }

    function rateStat(label, value, note) {
      return '<div><div class="rate-stat-label">' + esc(label) + '</div><div class="rate-stat-value">' + esc(value) + '</div><div class="rate-stat-note">' + esc(note) + '</div></div>';
    }

    function row(result) {
      return '<tr><td>' + esc(result.id) + '</td><td><span class="status ' + esc(result.category) + '"><span class="dot"></span>' + esc(result.category) + '</span></td><td>' + esc(result.status) + '</td><td>' + esc(fmtMs(result.ms)) + '</td><td class="muted">' + esc(result.note) + '</td></tr>';
    }

    function renderRate(rate) {
      if (!rate) {
        rateMeta.textContent = "";
        rateStats.innerHTML = "";
        rateWindow.innerHTML = "";
        return;
      }

      const paused = typeof rate.pauseRemainingMs === "number";
      rateMeta.textContent = paused
        ? "Paused " + fmtDuration(rate.pauseRemainingMs)
        : "Rolling " + fmtDuration(rate.windowMs);
      rateStats.innerHTML = [
        rateStat("Used", rate.inUse + "/" + rate.capacity, fmtPct(rate.usageRatio) + " window"),
        rateStat("Remaining", rate.remaining, "slots available"),
        rateStat("Queue", rate.queueDepth, "waiting locally"),
        rateStat("Next Slot", fmtDuration(rate.nextAvailableInMs), rate.nextAvailableAt ? fmtTime(rate.nextAvailableAt) : "-"),
        rateStat("Reset", rate.resetAt ? fmtTime(rate.resetAt) : "-", "newest slot expires")
      ].join("");

      const bucketCount = 24;
      const bucketMs = rate.windowMs / bucketCount;
      const buckets = Array.from({ length: bucketCount }, () => 0);
      for (const entry of rate.window || []) {
        const ageMs = typeof entry.ageMs === "number" ? entry.ageMs : 0;
        const index = Math.min(bucketCount - 1, Math.floor(ageMs / bucketMs));
        buckets[bucketCount - 1 - index] += 1;
      }
      const max = Math.max(1, ...buckets);
      rateWindow.innerHTML = buckets.map((count) => {
        const height = count === 0 ? 3 : Math.max(8, Math.round((count / max) * 64));
        const title = count + " admitted request" + (count === 1 ? "" : "s");
        return '<div class="rate-bar ' + (count ? "" : "empty") + '" style="height:' + height + 'px" title="' + esc(title) + '"></div>';
      }).join("");
      rateOldest.textContent = fmtDuration(rate.windowMs) + " ago";
    }

    function render(state) {
      const run = state.activeRun || state.latest;
      const counts = run?.counts || { alive: 0, timeout: 0, rate_limited: 0, error: 0, skipped: 0 };
      runBtn.disabled = Boolean(state.activeRun);
      statusLine.textContent = state.pause
        ? "Paused for client traffic - " + state.pause.activeClients + " active, quiet " + fmtMs(state.pause.quietForMs)
        : state.activeRun
          ? "Running " + state.activeRun.source + " probe started " + fmtTime(state.activeRun.startedAt)
          : "Idle - next scheduled " + fmtTime(state.scheduler.nextRunAt);
      metrics.innerHTML = [
        metric("Alive", counts.alive, "ready models"),
        metric("Timeout", counts.timeout, "no bytes before timeout"),
        metric("Rate Limited", counts.rate_limited, "upstream 429"),
        metric("Error", counts.error, "non-429 failures"),
        metric("Skipped", counts.skipped, "local limiter/backpressure"),
        metric("Clients", state.traffic?.activeClients ?? 0, state.pause ? "probe paused" : "quiet " + fmtMs(state.traffic?.quietForMs))
      ].join("");
      renderRate(state.rateLimit);
      latestMeta.textContent = run ? (run.status + " - " + run.source + " - " + fmtTime(run.startedAt)) : "";
      const results = [...(run?.results || [])].sort((a, b) => {
        const rank = { error: 0, timeout: 1, rate_limited: 2, skipped: 3, alive: 4 };
        return rank[a.category] - rank[b.category] || b.ms - a.ms;
      });
      resultsBody.innerHTML = results.length ? results.map(row).join("") : '<tr><td colspan="5"><div class="empty">No probe results yet.</div></td></tr>';
      const fastest = results.filter((result) => result.category === "alive").sort((a, b) => a.ms - b.ms).slice(0, 10);
      fastestBody.innerHTML = fastest.length ? fastest.map((result) => '<tr><td>' + esc(result.id) + '</td><td>' + esc(fmtMs(result.ms)) + '</td></tr>').join("") : '<tr><td colspan="2"><div class="empty">No alive models yet.</div></td></tr>';
      historyBody.innerHTML = state.history.length ? state.history.map((item) => {
        const failed = item.counts.timeout + item.counts.rate_limited + item.counts.error + item.counts.skipped;
        return '<tr><td>' + esc(fmtTime(item.startedAt)) + '</td><td>' + esc(item.source) + '</td><td>' + esc(item.counts.alive) + '</td><td>' + esc(failed) + '</td></tr>';
      }).join("") : '<tr><td colspan="4"><div class="empty">No retained history yet.</div></td></tr>';
    }

    async function load() {
      const res = await fetch("/probe/state");
      render(await res.json());
    }

    async function loadRate() {
      const res = await fetch("/health");
      const live = await res.json();
      renderRate(live.rateLimit);
    }

    runBtn.addEventListener("click", async () => {
      runBtn.disabled = true;
      await fetch("/probe/run", { method: "POST" });
      await load();
    });

    load().catch((err) => { statusLine.textContent = err.message; });
    setInterval(() => load().catch(() => {}), 5000);
    setInterval(() => loadRate().catch(() => {}), 1000);
  </script>
</body>
</html>`;
}
