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
      --bg: #f7f8fb;
      --bg-grain: radial-gradient(1200px 600px at 80% -10%, rgba(124, 92, 255, 0.08), transparent 60%),
                  radial-gradient(900px 500px at -10% 110%, rgba(14, 165, 233, 0.06), transparent 55%);
      --surface: #ffffff;
      --surface-2: #fbfcfe;
      --surface-hover: #f3f5f9;
      --border: #e6e8ef;
      --border-strong: #d3d7e0;
      --text: #0d1117;
      --text-2: #4b5364;
      --text-3: #7a8294;
      --accent: #5b3df5;
      --accent-soft: rgba(91, 61, 245, 0.10);
      --accent-glow: rgba(91, 61, 245, 0.35);
      --alive: #059669;
      --alive-soft: rgba(5, 150, 105, 0.12);
      --timeout: #d97706;
      --timeout-soft: rgba(217, 119, 6, 0.12);
      --error: #dc2626;
      --error-soft: rgba(220, 38, 38, 0.12);
      --rate: #ca8a04;
      --rate-soft: rgba(202, 138, 4, 0.14);
      --rate_limited: #ca8a04;
      --skipped: #6b7280;
      --skipped-soft: rgba(107, 114, 128, 0.12);
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 4px 16px -4px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
      --radius-lg: 14px;
      --radius-md: 10px;
      --radius-sm: 7px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #07090e;
        --bg-grain: radial-gradient(1200px 600px at 80% -10%, rgba(124, 92, 255, 0.14), transparent 60%),
                    radial-gradient(900px 500px at -10% 110%, rgba(56, 189, 248, 0.08), transparent 55%);
        --surface: #0e1118;
        --surface-2: #11151d;
        --surface-hover: #161a24;
        --border: #1d2230;
        --border-strong: #2a3144;
        --text: #f1f3f8;
        --text-2: #a3acbd;
        --text-3: #6b7388;
        --accent: #8b71ff;
        --accent-soft: rgba(139, 113, 255, 0.16);
        --accent-glow: rgba(139, 113, 255, 0.45);
        --alive: #34d399;
        --alive-soft: rgba(52, 211, 153, 0.16);
        --timeout: #fb923c;
        --timeout-soft: rgba(251, 146, 60, 0.16);
        --error: #f87171;
        --error-soft: rgba(248, 113, 113, 0.16);
        --rate: #fbbf24;
        --rate-soft: rgba(251, 191, 36, 0.16);
        --rate_limited: #fbbf24;
        --skipped: #94a3b8;
        --skipped-soft: rgba(148, 163, 184, 0.14);
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
        --shadow-md: 0 8px 24px -8px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.4);
      }
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-feature-settings: "cv11", "ss01", "ss03";
      background: var(--bg);
      background-image: var(--bg-grain);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.005em;
    }
    .num { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
    .wrap {
      width: min(1240px, calc(100vw - 32px));
      margin: 0 auto;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: saturate(140%) blur(12px);
      -webkit-backdrop-filter: saturate(140%) blur(12px);
      background: color-mix(in srgb, var(--bg) 80%, transparent);
      border-bottom: 1px solid var(--border);
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 68px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #38bdf8));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent), 0 6px 18px -6px var(--accent-glow);
      position: relative;
      overflow: hidden;
    }
    .brand-mark::after {
      content: "";
      position: absolute;
      inset: 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.18);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }
    .brand-name {
      font-size: 15px;
      font-weight: 650;
      letter-spacing: -0.012em;
    }
    .brand-tag {
      font-size: 11px;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 10px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      font-size: 12.5px;
      color: var(--text-2);
      font-weight: 500;
      box-shadow: var(--shadow-sm);
      max-width: min(540px, 50vw);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-pill .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-3);
      flex-shrink: 0;
      position: relative;
    }
    .status-pill[data-state="running"] .pulse { background: var(--accent); }
    .status-pill[data-state="running"] .pulse::after {
      content: "";
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: var(--accent);
      opacity: 0.45;
      animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .status-pill[data-state="paused"] .pulse { background: var(--rate); }
    .status-pill[data-state="idle"] .pulse { background: var(--alive); }
    @keyframes ping {
      0% { transform: scale(0.6); opacity: 0.5; }
      80%, 100% { transform: scale(1.6); opacity: 0; }
    }
    button.run {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid transparent;
      color: #fff;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #38bdf8));
      border-radius: 9px;
      padding: 9px 16px;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: -0.005em;
      cursor: pointer;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 50%, transparent), 0 6px 16px -6px var(--accent-glow);
      transition: transform 80ms ease, box-shadow 200ms ease, opacity 200ms ease;
    }
    button.run:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 60%, transparent), 0 10px 22px -6px var(--accent-glow);
    }
    button.run:active:not(:disabled) { transform: translateY(0); }
    button.run:disabled { cursor: not-allowed; opacity: 0.55; }
    button.run svg { width: 14px; height: 14px; }
    main { padding: 24px 0 56px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      transition: border-color 200ms ease;
    }
    .panel.dense { padding: 16px 18px; }
    .metric {
      position: relative;
      overflow: hidden;
    }
    .metric::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--accent);
      opacity: 0.85;
      border-radius: 3px 0 0 3px;
    }
    .metric.alive::before { background: var(--alive); }
    .metric.timeout::before { background: var(--timeout); }
    .metric.rate_limited::before { background: var(--rate); }
    .metric.error::before { background: var(--error); }
    .metric.skipped::before { background: var(--skipped); }
    .metric.clients::before { background: var(--accent); }
    .metric-label {
      color: var(--text-3);
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 650;
      letter-spacing: 0.06em;
    }
    .metric-value {
      margin-top: 10px;
      font-size: 30px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -0.022em;
    }
    .metric-note {
      color: var(--text-3);
      margin-top: 8px;
      font-size: 12.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rate-panel {
      margin-top: 16px;
      padding: 22px 24px 20px;
      position: relative;
      overflow: hidden;
    }
    .rate-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(600px 200px at 100% 0%, var(--accent-soft), transparent 70%);
      pointer-events: none;
    }
    .rate-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 18px;
      position: relative;
    }
    .rate-head-left { display: flex; flex-direction: column; gap: 4px; }
    .rate-title {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 650;
      letter-spacing: 0.07em;
      color: var(--text-3);
    }
    .rate-headline {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .rate-headline-value {
      font-size: 36px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -0.025em;
    }
    .rate-headline-cap { color: var(--text-3); font-size: 18px; font-weight: 500; }
    .rate-headline-pct {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
      background: var(--accent-soft);
      padding: 3px 8px;
      border-radius: 999px;
    }
    .rate-meta {
      font-size: 12px;
      color: var(--text-3);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .rate-meta .dotmini {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-3);
    }
    .rate-meta[data-paused="true"] .dotmini { background: var(--rate); }
    .rate-progress {
      height: 6px;
      width: 100%;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }
    .rate-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #38bdf8));
      border-radius: 999px;
      transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 0 12px var(--accent-glow);
    }
    .rate-stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 18px;
      padding-top: 18px;
      margin-top: 18px;
      border-top: 1px solid var(--border);
      position: relative;
    }
    .rate-stat-label {
      color: var(--text-3);
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 650;
      letter-spacing: 0.06em;
    }
    .rate-stat-value {
      margin-top: 6px;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.1;
      letter-spacing: -0.015em;
    }
    .rate-stat-note {
      color: var(--text-3);
      margin-top: 4px;
      font-size: 11.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rate-window-wrap {
      margin-top: 20px;
      position: relative;
    }
    .rate-window {
      display: grid;
      grid-template-columns: repeat(24, minmax(0, 1fr));
      gap: 3px;
      height: 70px;
      align-items: end;
    }
    .rate-bar {
      min-height: 3px;
      border-radius: 3px 3px 1px 1px;
      background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent));
      transition: height 240ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .rate-bar.empty {
      background: var(--border);
      opacity: 0.7;
    }
    .rate-axis {
      display: flex;
      justify-content: space-between;
      color: var(--text-3);
      font-size: 11px;
      margin-top: 8px;
      letter-spacing: 0.02em;
    }
    section.split-section { margin-top: 16px; }
    .section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }
    h2 {
      font-size: 13px;
      margin: 0;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-2);
    }
    .section-meta {
      color: var(--text-3);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .split {
      display: grid;
      grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
      gap: 16px;
    }
    .right-stack { display: flex; flex-direction: column; gap: 16px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 10px 8px;
      vertical-align: middle;
    }
    th {
      color: var(--text-3);
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-weight: 650;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: var(--surface);
      z-index: 1;
    }
    tbody tr {
      transition: background 150ms ease;
    }
    tbody tr:hover { background: var(--surface-hover); }
    tbody td {
      border-bottom: 1px solid var(--border);
    }
    tbody tr:last-child td { border-bottom: 0; }
    .model-id {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      letter-spacing: -0.01em;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px 3px 8px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: -0.005em;
      text-transform: capitalize;
      border: 1px solid transparent;
    }
    .badge .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .badge.alive { background: var(--alive-soft); color: var(--alive); }
    .badge.alive .dot { background: var(--alive); box-shadow: 0 0 6px var(--alive); }
    .badge.timeout { background: var(--timeout-soft); color: var(--timeout); }
    .badge.timeout .dot { background: var(--timeout); }
    .badge.error { background: var(--error-soft); color: var(--error); }
    .badge.error .dot { background: var(--error); }
    .badge.rate_limited { background: var(--rate-soft); color: var(--rate); }
    .badge.rate_limited .dot { background: var(--rate); }
    .badge.skipped { background: var(--skipped-soft); color: var(--skipped); }
    .badge.skipped .dot { background: var(--skipped); }
    .latency {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .latency-bar {
      width: 80px;
      height: 4px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .latency-value { white-space: nowrap; }
    td.latency-cell { width: 1%; }
    .latency-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--alive), color-mix(in srgb, var(--alive) 60%, var(--accent)));
      border-radius: 999px;
    }
    .muted { color: var(--text-3); }
    .scroll {
      overflow: auto;
      max-height: 540px;
      margin: 0 -8px;
      padding: 0 8px;
    }
    .empty {
      color: var(--text-3);
      padding: 28px 0;
      font-size: 13px;
      text-align: center;
    }
    .sparkline-wrap {
      padding: 14px 18px 8px;
    }
    .sparkline {
      width: 100%;
      height: 56px;
      display: block;
    }
    .sparkline-meta {
      display: flex;
      justify-content: space-between;
      color: var(--text-3);
      font-size: 11px;
      margin-top: 4px;
    }
    .config-foot {
      margin-top: 16px;
      padding: 14px 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      font-size: 11.5px;
      color: var(--text-3);
    }
    .config-foot span strong {
      color: var(--text-2);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      margin-right: 4px;
    }
    .head-actions {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .view-toggle {
      display: inline-flex;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2px;
      gap: 2px;
    }
    .view-toggle button {
      background: transparent;
      border: 0;
      color: var(--text-3);
      font-size: 11.5px;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 150ms ease, color 150ms ease;
      min-width: 0;
      box-shadow: none;
      letter-spacing: 0.01em;
    }
    .view-toggle button:hover { color: var(--text-2); }
    .view-toggle button.active {
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow-sm);
    }
    .sort-select {
      appearance: none;
      -webkit-appearance: none;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-3);
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.01em;
      padding: 5px 26px 5px 10px;
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%236b7280'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 9px center;
      background-size: 8px 5px;
      transition: border-color 150ms ease, color 150ms ease;
    }
    .sort-select:hover { color: var(--text-2); border-color: var(--border-strong); }
    .sort-select:focus { outline: 2px solid var(--accent-soft); outline-offset: 1px; color: var(--text); border-color: var(--accent-soft); }
    .view { display: block; }
    .view[hidden] { display: none; }
    .hbar-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 540px;
      overflow-y: auto;
      padding: 4px 2px 4px 0;
    }
    .hbar-row {
      display: grid;
      grid-template-columns: minmax(0, 200px) minmax(0, 1fr) 70px;
      align-items: center;
      gap: 12px;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: default;
      transition: background 120ms ease;
      position: relative;
    }
    .hbar-row:hover { background: var(--surface-hover); }
    .hbar-row.dim { opacity: 0.35; }
    .hbar-label {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.01em;
    }
    .hbar-track {
      position: relative;
      height: 16px;
      background: var(--border);
      border-radius: 5px;
      overflow: hidden;
    }
    .hbar-track.empty { background: transparent; border: 1px dashed var(--border); }
    .hbar-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    .hbar-fill::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 5px;
      background: linear-gradient(180deg, rgba(255,255,255,0.18), transparent 60%);
      pointer-events: none;
    }
    .hbar-fill.alive { background: linear-gradient(90deg, var(--alive), color-mix(in srgb, var(--alive) 60%, var(--accent))); }
    .hbar-fill.timeout { background: linear-gradient(90deg, var(--timeout), color-mix(in srgb, var(--timeout) 70%, var(--error))); }
    .hbar-fill.error { background: linear-gradient(90deg, var(--error), color-mix(in srgb, var(--error) 80%, #000)); }
    .hbar-fill.rate_limited { background: linear-gradient(90deg, var(--rate), color-mix(in srgb, var(--rate) 70%, var(--timeout))); }
    .hbar-fill.skipped { background: var(--skipped); }
    .hbar-value {
      font-variant-numeric: tabular-nums;
      font-size: 12px;
      color: var(--text-2);
      font-weight: 500;
      text-align: right;
      white-space: nowrap;
    }
    .hbar-value .badge-mini {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }
    .hbar-axis {
      display: grid;
      grid-template-columns: minmax(0, 200px) minmax(0, 1fr) 70px;
      gap: 12px;
      padding: 0 8px 8px;
      font-size: 10.5px;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 650;
      border-bottom: 1px solid var(--border);
      margin-bottom: 6px;
    }
    .hbar-axis-mid {
      display: flex;
      justify-content: space-between;
    }
    .history-chart-wrap {
      padding: 8px 4px 0;
    }
    .history-chart {
      width: 100%;
      height: 200px;
      display: block;
      overflow: visible;
    }
    .history-bar-group { cursor: pointer; }
    .history-bar-group:hover .history-hit { fill: var(--accent-soft); }
    .history-bar-group rect.seg { transition: opacity 150ms ease; }
    .history-bar-group:hover rect.seg { filter: brightness(1.12); }
    .history-axis-line { stroke: var(--border); stroke-width: 1; }
    .history-grid-line { stroke: var(--border); stroke-width: 1; stroke-dasharray: 2 4; opacity: 0.6; }
    .history-axis-text { fill: var(--text-3); font-size: 10px; font-family: inherit; }
    .history-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      padding: 10px 6px 4px;
      font-size: 11px;
      color: var(--text-2);
    }
    .history-legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .history-legend .swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .history-legend .swatch.alive { background: var(--alive); }
    .history-legend .swatch.rate_limited { background: var(--rate); }
    .history-legend .swatch.timeout { background: var(--timeout); }
    .history-legend .swatch.error { background: var(--error); }
    .history-legend .swatch.skipped { background: var(--skipped); }
    .scatter-wrap {
      padding: 8px 4px 0;
    }
    .scatter-svg {
      width: 100%;
      display: block;
      aspect-ratio: 560 / 200;
      overflow: visible;
    }
    .scatter-dot {
      cursor: pointer;
      transition: opacity 120ms ease;
    }
    .scatter-dot:hover { opacity: 0.7; }
    .scatter-axis-text { fill: var(--text-3); font-size: 10px; font-family: inherit; }
    .scatter-axis-line { stroke: var(--border-strong); stroke-width: 1; }
    .scatter-grid-line { stroke: var(--border); stroke-width: 1; stroke-dasharray: 2 4; opacity: 0.6; }
    .scatter-axis-label { fill: var(--text-2); font-size: 11px; font-family: inherit; }
    .tooltip {
      position: absolute;
      z-index: 100;
      pointer-events: none;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 9px;
      padding: 9px 12px;
      font-size: 12px;
      color: var(--text);
      box-shadow: var(--shadow-md);
      max-width: 320px;
      transform: translate(-50%, calc(-100% - 10px));
      transition: opacity 120ms ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .tooltip[hidden] { display: none; }
    .tooltip::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -5px;
      transform: translateX(-50%) rotate(45deg);
      width: 8px;
      height: 8px;
      background: var(--surface);
      border-right: 1px solid var(--border-strong);
      border-bottom: 1px solid var(--border-strong);
    }
    .tooltip-title {
      font-weight: 600;
      font-size: 12px;
      letter-spacing: -0.005em;
      margin-bottom: 6px;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      word-break: break-all;
    }
    .tooltip-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    .tooltip-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: var(--text-2);
      font-size: 11.5px;
      font-variant-numeric: tabular-nums;
    }
    .tooltip-row strong { color: var(--text); font-weight: 500; }
    .tooltip-note {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--border);
      font-size: 11px;
      color: var(--text-3);
      max-height: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }
    .alias-help {
      color: var(--text-3);
      font-size: 12px;
      margin: 2px 0 8px;
    }
    .alias-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 320px;
      overflow: auto;
      padding-right: 2px;
    }
    .alias-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-2);
      padding: 8px 10px;
    }
    .alias-row-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .alias-row-model {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .alias-row-map {
      color: var(--text-3);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .alias-btn {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-2);
      border-radius: 7px;
      font-size: 11.5px;
      font-weight: 600;
      padding: 6px 9px;
      cursor: pointer;
    }
    .alias-btn:hover {
      border-color: var(--border-strong);
      color: var(--text);
    }
    .alias-pick-target {
      cursor: pointer;
    }
    .alias-pick-target:hover .model-id,
    .alias-pick-target:hover .hbar-label {
      color: var(--accent);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 120;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal-backdrop[hidden] { display: none; }
    .alias-modal {
      width: min(520px, calc(100vw - 24px));
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      box-shadow: var(--shadow-md);
      padding: 16px;
    }
    .alias-modal h3 {
      margin: 0 0 10px;
      font-size: 15px;
      letter-spacing: -0.01em;
    }
    .alias-modal .target {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      margin-bottom: 12px;
      color: var(--text-2);
      word-break: break-all;
    }
    .alias-modal label {
      display: block;
      font-size: 12px;
      color: var(--text-3);
      margin-bottom: 6px;
      font-weight: 600;
    }
    .alias-modal select,
    .alias-modal input {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-2);
      color: var(--text);
      font-size: 13px;
      font-family: inherit;
      padding: 8px 10px;
      margin-bottom: 10px;
    }
    .alias-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }
    .alias-modal-actions button {
      border-radius: 8px;
      padding: 7px 11px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text-2);
    }
    .alias-modal-actions button.primary {
      color: #fff;
      border-color: transparent;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #38bdf8));
    }
    @media (max-width: 960px) {
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .rate-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .split { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .top { padding: 12px 0; flex-wrap: wrap; }
      .status-pill { max-width: 100%; }
      button.run { width: 100%; justify-content: center; }
      .rate-headline-value { font-size: 30px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap top">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true"></div>
        <div class="brand-text">
          <span class="brand-name">ProxyAI</span>
          <span class="brand-tag">NIM Probe</span>
        </div>
      </div>
      <div class="status-pill" id="statusPill" data-state="idle">
        <span class="pulse"></span>
        <span id="statusLine">Loading</span>
      </div>
      <button class="run" id="runBtn" type="button">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4 2.5v11l9-5.5-9-5.5z" fill="currentColor"/>
        </svg>
        <span>Run probe</span>
      </button>
    </div>
  </header>
  <main class="wrap">
    <div class="grid" id="metrics"></div>
    <section class="panel rate-panel">
      <div class="rate-head">
        <div class="rate-head-left">
          <span class="rate-title">Rate limit</span>
          <div class="rate-headline">
            <span class="rate-headline-value num" id="rateUsed">0</span>
            <span class="rate-headline-cap num" id="rateCap">/ 40</span>
            <span class="rate-headline-pct num" id="ratePct">0%</span>
          </div>
        </div>
        <div class="rate-meta" id="rateMeta" data-paused="false">
          <span class="dotmini"></span>
          <span id="rateMetaText"></span>
        </div>
      </div>
      <div class="rate-progress"><div class="rate-progress-fill" id="rateProgress" style="width:0%"></div></div>
      <div class="rate-stats" id="rateStats"></div>
      <div class="rate-window-wrap">
        <div class="rate-window" id="rateWindow" aria-label="Rolling rate limit window"></div>
        <div class="rate-axis"><span id="rateOldest">window</span><span>now</span></div>
      </div>
    </section>
    <section class="split split-section">
      <div class="panel dense">
        <div class="section-head">
          <h2>Latest results</h2>
          <div class="head-actions">
            <span class="section-meta" id="latestMeta"></span>
            <select id="sortSelect" class="sort-select" title="Sort by">
              <option value="category">Category</option>
              <option value="latency-asc">Latency ↑</option>
              <option value="latency-desc">Latency ↓</option>
              <option value="index-desc">AI Index ↓</option>
            </select>
            <div class="view-toggle" data-target="results">
              <button type="button" data-mode="chart" class="active">Chart</button>
              <button type="button" data-mode="table">Table</button>
            </div>
          </div>
        </div>
        <div class="view" data-view="results-chart">
          <div class="hbar-axis"><span>Model</span><span class="hbar-axis-mid"><span id="resultsAxisMin">0</span><span id="resultsAxisMax">—</span></span><span style="text-align:right">Latency</span></div>
          <div class="hbar-list" id="resultsChart"></div>
        </div>
        <div class="view" data-view="results-table" hidden>
          <div class="scroll">
            <table>
              <thead><tr><th>Model</th><th>Status</th><th>Code</th><th>Latency</th><th>Note</th></tr></thead>
              <tbody id="resultsBody"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="right-stack">
        <div class="panel dense">
          <div class="section-head">
            <h2>Fastest alive</h2>
            <div class="head-actions">
              <span class="section-meta muted" id="fastestMeta"></span>
              <div class="view-toggle" data-target="fastest">
                <button type="button" data-mode="chart" class="active">Chart</button>
                <button type="button" data-mode="table">Table</button>
              </div>
            </div>
          </div>
          <div class="view" data-view="fastest-chart">
            <div class="hbar-list" id="fastestChart"></div>
          </div>
          <div class="view" data-view="fastest-table" hidden>
            <table>
              <thead><tr><th>Model</th><th>Latency</th></tr></thead>
              <tbody id="fastestBody"></tbody>
            </table>
          </div>
        </div>
        <div class="panel dense">
          <div class="section-head">
            <h2>History</h2>
            <div class="head-actions">
              <div class="view-toggle" data-target="history">
                <button type="button" data-mode="chart" class="active">Chart</button>
                <button type="button" data-mode="table">Table</button>
              </div>
            </div>
          </div>
          <div class="view" data-view="history-chart">
            <div class="history-chart-wrap" id="historyChartWrap">
              <svg class="history-chart" id="historyChart" viewBox="0 0 600 200" preserveAspectRatio="none"></svg>
              <div class="history-legend">
                <span><span class="swatch alive"></span>Alive</span>
                <span><span class="swatch rate_limited"></span>Rate limited</span>
                <span><span class="swatch timeout"></span>Timeout</span>
                <span><span class="swatch error"></span>Error</span>
                <span><span class="swatch skipped"></span>Skipped</span>
              </div>
            </div>
          </div>
          <div class="view" data-view="history-table" hidden>
            <div class="scroll">
              <table>
                <thead><tr><th>Started</th><th>Source</th><th>Alive</th><th>Failed</th></tr></thead>
                <tbody id="historyBody"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="panel dense config-foot" id="configFoot"></div>
        <div class="panel dense">
          <div class="section-head">
            <h2>Model aliases</h2>
            <span class="section-meta muted" id="aliasMeta"></span>
          </div>
          <div class="alias-help">Select any model below to map it to an existing alias name or a new custom alias.</div>
          <div class="alias-list" id="aliasList"></div>
          <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
            <span class="muted" id="aliasStatus"></span>
          </div>
        </div>
      </div>
    </section>
    <section class="panel dense" id="scatterPanel" hidden>
      <div class="section-head">
        <h2>Quality vs latency</h2>
        <span class="section-meta muted" id="scatterMeta"></span>
      </div>
      <div class="scatter-wrap">
        <svg class="scatter-svg" id="scatterChart" viewBox="0 0 560 200"></svg>
      </div>
    </section>
    <div class="tooltip" id="tooltip" hidden></div>
    <div class="modal-backdrop" id="aliasModalBackdrop" hidden>
      <div class="alias-modal" role="dialog" aria-modal="true" aria-labelledby="aliasModalTitle">
        <h3 id="aliasModalTitle">Assign alias</h3>
        <div class="target" id="aliasModalTarget"></div>
        <label for="aliasPresetSelect">Use existing alias name</label>
        <select id="aliasPresetSelect"></select>
        <label for="aliasCustomInput">Or create custom alias name</label>
        <input id="aliasCustomInput" type="text" placeholder="example: claude-sonnet-4-6">
        <div class="alias-modal-actions">
          <button type="button" id="aliasRemoveBtn">Remove mapping</button>
          <button type="button" id="aliasCancelBtn">Cancel</button>
          <button type="button" id="aliasApplyBtn" class="primary">Apply</button>
        </div>
      </div>
    </div>
  </main>
  <script>
    const runBtn = document.getElementById("runBtn");
    const statusPill = document.getElementById("statusPill");
    const statusLine = document.getElementById("statusLine");
    const metrics = document.getElementById("metrics");
    const latestMeta = document.getElementById("latestMeta");
    const fastestMeta = document.getElementById("fastestMeta");
    const resultsBody = document.getElementById("resultsBody");
    const fastestBody = document.getElementById("fastestBody");
    const historyBody = document.getElementById("historyBody");
    const rateUsed = document.getElementById("rateUsed");
    const rateCap = document.getElementById("rateCap");
    const ratePct = document.getElementById("ratePct");
    const rateMeta = document.getElementById("rateMeta");
    const rateMetaText = document.getElementById("rateMetaText");
    const rateProgress = document.getElementById("rateProgress");
    const rateStats = document.getElementById("rateStats");
    const rateWindow = document.getElementById("rateWindow");
    const rateOldest = document.getElementById("rateOldest");
    const configFoot = document.getElementById("configFoot");
    const resultsChart = document.getElementById("resultsChart");
    const fastestChart = document.getElementById("fastestChart");
    const historyChart = document.getElementById("historyChart");
    const historyChartWrap = document.getElementById("historyChartWrap");
    const resultsAxisMax = document.getElementById("resultsAxisMax");
    const scatterPanel = document.getElementById("scatterPanel");
    const scatterChart = document.getElementById("scatterChart");
    const scatterMeta = document.getElementById("scatterMeta");
    const sortSelect = document.getElementById("sortSelect");
    const tooltip = document.getElementById("tooltip");
    const aliasMeta = document.getElementById("aliasMeta");
    const aliasList = document.getElementById("aliasList");
    const aliasStatus = document.getElementById("aliasStatus");
    const aliasModalBackdrop = document.getElementById("aliasModalBackdrop");
    const aliasModalTarget = document.getElementById("aliasModalTarget");
    const aliasPresetSelect = document.getElementById("aliasPresetSelect");
    const aliasCustomInput = document.getElementById("aliasCustomInput");
    const aliasCancelBtn = document.getElementById("aliasCancelBtn");
    const aliasApplyBtn = document.getElementById("aliasApplyBtn");
    const aliasRemoveBtn = document.getElementById("aliasRemoveBtn");

    const CATEGORY_LABEL = { alive: "Alive", timeout: "Timeout", rate_limited: "Rate limited", error: "Error", skipped: "Skipped" };
    const STACK_ORDER = ["alive", "rate_limited", "timeout", "error", "skipped"];

    const viewMode = { results: "chart", fastest: "chart", history: "chart" };
    let sortMode = "category";
    let lastState = null;
    let lastRate = null;
    let aliasMap = {};
    let selectedAliasTargetModel = "";

    function sortResults(results, analysis) {
      const rank = { error: 0, timeout: 1, rate_limited: 2, skipped: 3, alive: 4 };
      return [...results].sort((a, b) => {
        if (sortMode === "latency-asc") return (a.ms || 0) - (b.ms || 0);
        if (sortMode === "latency-desc") return (b.ms || 0) - (a.ms || 0);
        if (sortMode === "index-desc") {
          const ai = (analysis && analysis[a.id]) ? analysis[a.id].intelligenceIndex : -1;
          const bi = (analysis && analysis[b.id]) ? analysis[b.id].intelligenceIndex : -1;
          return bi !== ai ? bi - ai : rank[a.category] - rank[b.category];
        }
        return rank[a.category] - rank[b.category] || (b.ms || 0) - (a.ms || 0);
      });
    }

    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function fmtTime(value) {
      if (!value) return "pending";
      const d = new Date(value);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      return sameDay
        ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }

    function fmtRelative(value) {
      if (!value) return "—";
      const ms = new Date(value).getTime() - Date.now();
      const abs = Math.abs(ms);
      if (abs < 1000) return ms >= 0 ? "now" : "just now";
      const seconds = Math.round(abs / 1000);
      const sign = ms >= 0 ? "in " : "";
      const suffix = ms >= 0 ? "" : " ago";
      if (seconds < 60) return sign + seconds + "s" + suffix;
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return sign + minutes + "m" + suffix;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return sign + hours + "h" + suffix;
      const days = Math.round(hours / 24);
      return sign + days + "d" + suffix;
    }

    function fmtMs(value) {
      if (typeof value !== "number") return "—";
      if (value < 1000) return value + " ms";
      return (value / 1000).toFixed(2) + " s";
    }

    function fmtDuration(value) {
      if (typeof value !== "number") return "—";
      if (value <= 0) return "now";
      if (value < 1000) return value + " ms";
      const seconds = Math.ceil(value / 1000);
      if (seconds < 60) return seconds + " s";
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      return rest ? minutes + "m " + rest + "s" : minutes + "m";
    }

    function fmtPct(value) {
      return typeof value === "number" ? Math.round(value * 100) + "%" : "—";
    }

    function metric(label, value, note, kind) {
      return '<div class="panel metric ' + esc(kind) + '">'
        + '<div class="metric-label">' + esc(label) + '</div>'
        + '<div class="metric-value num">' + esc(value) + '</div>'
        + '<div class="metric-note">' + esc(note) + '</div>'
        + '</div>';
    }

    function rateStat(label, value, note) {
      return '<div>'
        + '<div class="rate-stat-label">' + esc(label) + '</div>'
        + '<div class="rate-stat-value num">' + esc(value) + '</div>'
        + '<div class="rate-stat-note">' + esc(note) + '</div>'
        + '</div>';
    }

    function row(result, maxAliveMs) {
      const cat = result.category;
      const label = CATEGORY_LABEL[cat] || cat;
      const latency = cat === "alive" && typeof result.ms === "number"
        ? '<span class="latency"><span class="latency-bar"><span class="latency-bar-fill" style="width:' + Math.max(4, Math.round((result.ms / Math.max(1, maxAliveMs)) * 100)) + '%"></span></span><span class="latency-value">' + esc(fmtMs(result.ms)) + '</span></span>'
        : '<span class="muted">' + esc(fmtMs(result.ms)) + '</span>';
      return '<tr class="alias-pick-target" data-alias-model="' + esc(result.id) + '" title="Select alias for this model">'
        + '<td><span class="model-id">' + esc(result.id) + '</span></td>'
        + '<td><span class="badge ' + esc(cat) + '"><span class="dot"></span>' + esc(label) + '</span></td>'
        + '<td class="muted num">' + esc(result.status || "—") + '</td>'
        + '<td>' + latency + '</td>'
        + '<td class="muted">' + esc(result.note || "") + '</td>'
        + '</tr>';
    }

    function renderRate(rate) {
      if (!rate) {
        rateUsed.textContent = "0";
        rateCap.textContent = "/ 40";
        ratePct.textContent = "0%";
        rateProgress.style.width = "0%";
        rateMetaText.textContent = "";
        rateStats.innerHTML = "";
        rateWindow.innerHTML = "";
        return;
      }

      const paused = typeof rate.pauseRemainingMs === "number";
      rateUsed.textContent = rate.inUse;
      rateCap.textContent = "/ " + rate.capacity;
      ratePct.textContent = fmtPct(rate.usageRatio);
      rateProgress.style.width = Math.min(100, Math.round((rate.usageRatio || 0) * 100)) + "%";
      rateMeta.dataset.paused = String(paused);
      rateMetaText.textContent = paused
        ? "Paused " + fmtDuration(rate.pauseRemainingMs)
        : "Rolling " + fmtDuration(rate.windowMs) + " window";

      rateStats.innerHTML = [
        rateStat("Remaining", rate.remaining, rate.remaining === 0 ? "at capacity" : "slots free"),
        rateStat("Queue", rate.queueDepth, rate.queueDepth === 0 ? "no waiters" : "local waiters"),
        rateStat("Next slot", fmtDuration(rate.nextAvailableInMs), rate.nextAvailableAt ? fmtTime(rate.nextAvailableAt) : "available now"),
        rateStat("Window reset", rate.resetAt ? fmtRelative(rate.resetAt) : "—", rate.resetAt ? "oldest expires" : "empty window")
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
      rateWindow.innerHTML = buckets.map((count, i) => {
        const height = count === 0 ? 3 : Math.max(8, Math.round((count / max) * 60));
        const ageEnd = Math.round((bucketCount - i) * bucketMs);
        const ageStart = Math.round((bucketCount - i - 1) * bucketMs);
        const dataAttrs = count
          ? ' data-count="' + count + '" data-start="' + ageStart + '" data-end="' + ageEnd + '"'
          : '';
        return '<div class="rate-bar ' + (count ? "" : "empty") + '" style="height:' + height + 'px"' + dataAttrs + '></div>';
      }).join("");
      rateOldest.textContent = "−" + fmtDuration(rate.windowMs);
    }

    function showTooltip(target, html) {
      tooltip.innerHTML = html;
      tooltip.hidden = false;
      const rect = target.getBoundingClientRect();
      const x = rect.left + window.scrollX + rect.width / 2;
      const y = rect.top + window.scrollY;
      tooltip.style.left = Math.round(x) + "px";
      tooltip.style.top = Math.round(y) + "px";
      const tipRect = tooltip.getBoundingClientRect();
      const overflowLeft = tipRect.left < 8;
      const overflowRight = tipRect.right > window.innerWidth - 8;
      if (overflowLeft) tooltip.style.left = (Math.round(x) + (8 - tipRect.left)) + "px";
      else if (overflowRight) tooltip.style.left = (Math.round(x) - (tipRect.right - window.innerWidth + 8)) + "px";
    }

    function hideTooltip() { tooltip.hidden = true; }

    function tooltipForResult(r) {
      const cat = r.category;
      return ''
        + '<div class="tooltip-title">' + esc(r.id) + '</div>'
        + '<div class="tooltip-meta"><span class="badge ' + esc(cat) + '"><span class="dot"></span>' + esc(CATEGORY_LABEL[cat] || cat) + '</span>'
        + (r.status ? '<span class="muted num">HTTP ' + esc(r.status) + '</span>' : '')
        + '</div>'
        + '<div class="tooltip-row"><span>Latency</span><strong>' + esc(fmtMs(r.ms)) + '</strong></div>'
        + (r.note ? '<div class="tooltip-note">' + esc(r.note) + '</div>' : '');
    }

    function tooltipForRun(item) {
      const total = STACK_ORDER.reduce((sum, k) => sum + (item.counts[k] || 0), 0);
      const rows = STACK_ORDER
        .filter((k) => (item.counts[k] || 0) > 0)
        .map((k) => '<div class="tooltip-row"><span><span class="badge-mini" style="background:var(--' + k + ');display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px"></span>' + esc(CATEGORY_LABEL[k]) + '</span><strong>' + esc(item.counts[k]) + '</strong></div>')
        .join("");
      return ''
        + '<div class="tooltip-title">' + esc(fmtTime(item.startedAt)) + '</div>'
        + '<div class="tooltip-meta"><span class="muted">' + esc(item.source) + ' · ' + esc(item.status) + '</span>'
        + (item.durationMs ? '<span class="muted num">' + esc(fmtDuration(item.durationMs)) + '</span>' : '')
        + '</div>'
        + rows
        + '<div class="tooltip-row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)"><span>Total</span><strong>' + esc(total) + '</strong></div>';
    }

    function tooltipForRateBucket(count, ageStart, ageEnd) {
      return ''
        + '<div class="tooltip-title" style="font-family:inherit">' + esc(count) + ' admitted</div>'
        + '<div class="tooltip-row"><span>Window age</span><strong>' + esc(fmtDuration(ageStart)) + ' – ' + esc(fmtDuration(ageEnd)) + ' ago</strong></div>';
    }

    function tooltipForScatterDot(p) {
      return ''
        + '<div class="tooltip-title">' + esc(p.id) + '</div>'
        + '<div class="tooltip-meta"><span class="badge alive"><span class="dot"></span>Alive</span></div>'
        + '<div class="tooltip-row"><span>AI Index</span><strong>' + esc(p.index) + '</strong></div>'
        + '<div class="tooltip-row"><span>Latency</span><strong>' + esc(fmtMs(p.ms)) + '</strong></div>';
    }

    function renderResultsChart(results) {
      if (!results.length) {
        resultsChart.innerHTML = '<div class="empty">No probe results yet — run one to populate this view.</div>';
        resultsAxisMax.textContent = "—";
        return;
      }
      const maxMs = Math.max(1, ...results.map((r) => r.ms || 0));
      resultsAxisMax.textContent = fmtMs(maxMs);
      resultsChart.innerHTML = results.map((r, i) => {
        const ms = typeof r.ms === "number" ? r.ms : 0;
        const pct = ms > 0 ? Math.max(2, Math.round((ms / maxMs) * 100)) : 0;
        const trackClass = ms > 0 ? "" : " empty";
        const fillHTML = ms > 0
          ? '<div class="hbar-fill ' + esc(r.category) + '" style="width:' + pct + '%"></div>'
          : '';
        return '<div class="hbar-row alias-pick-target" data-kind="result" data-idx="' + i + '" data-alias-model="' + esc(r.id) + '" title="Select alias for this model">'
          + '<span class="hbar-label">' + esc(r.id) + '</span>'
          + '<div class="hbar-track' + trackClass + '">' + fillHTML + '</div>'
          + '<span class="hbar-value"><span class="badge-mini" style="background:var(--' + esc(r.category) + ')"></span>' + esc(fmtMs(r.ms)) + '</span>'
          + '</div>';
      }).join("");
      resultsChart._data = results;
    }

    function renderFastestChart(fastest) {
      if (!fastest.length) {
        fastestChart.innerHTML = '<div class="empty">No alive models yet.</div>';
        return;
      }
      const max = Math.max(1, ...fastest.map((r) => r.ms || 0));
      fastestChart.innerHTML = fastest.map((r, i) => {
        const pct = Math.max(6, Math.round((r.ms / max) * 100));
        return '<div class="hbar-row alias-pick-target" data-kind="fastest" data-idx="' + i + '" data-alias-model="' + esc(r.id) + '" title="Select alias for this model">'
          + '<span class="hbar-label">' + esc(r.id) + '</span>'
          + '<div class="hbar-track"><div class="hbar-fill alive" style="width:' + pct + '%"></div></div>'
          + '<span class="hbar-value">' + esc(fmtMs(r.ms)) + '</span>'
          + '</div>';
      }).join("");
      fastestChart._data = fastest;
    }

    function renderHistoryChart(history) {
      const data = [...history].reverse();
      if (!data.length) {
        historyChart.innerHTML = '';
        historyChartWrap.hidden = false;
        const labelEl = '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="history-axis-text">No retained history yet</text>';
        historyChart.innerHTML = labelEl;
        return;
      }
      const w = 600, h = 200;
      const pad = { top: 12, right: 8, bottom: 26, left: 28 };
      const innerW = w - pad.left - pad.right;
      const innerH = h - pad.top - pad.bottom;
      const totals = data.map((d) => STACK_ORDER.reduce((sum, k) => sum + (d.counts[k] || 0), 0));
      const maxTotal = Math.max(1, ...totals);
      const ticks = niceTicks(maxTotal, 4);
      const tickMax = ticks[ticks.length - 1];
      const slot = innerW / data.length;
      const barW = Math.max(4, Math.min(28, slot - 4));
      const grid = ticks.map((t) => {
        const y = pad.top + innerH - (t / tickMax) * innerH;
        return '<line class="history-grid-line" x1="' + pad.left + '" x2="' + (w - pad.right) + '" y1="' + y.toFixed(2) + '" y2="' + y.toFixed(2) + '"/>'
          + '<text class="history-axis-text" x="' + (pad.left - 6) + '" y="' + (y + 3).toFixed(2) + '" text-anchor="end">' + t + '</text>';
      }).join("");
      const xAxisIdxs = data.length <= 6
        ? data.map((_, i) => i)
        : [0, Math.floor(data.length / 2), data.length - 1];
      const xLabels = xAxisIdxs.map((i) => {
        const cx = pad.left + slot * (i + 0.5);
        return '<text class="history-axis-text" x="' + cx.toFixed(2) + '" y="' + (h - 8) + '" text-anchor="middle">' + esc(fmtTime(data[i].startedAt)) + '</text>';
      }).join("");
      const bars = data.map((d, i) => {
        const cx = pad.left + slot * (i + 0.5);
        const x = cx - barW / 2;
        let yCursor = pad.top + innerH;
        const segs = STACK_ORDER.map((cat) => {
          const c = d.counts[cat] || 0;
          if (!c) return "";
          const segH = (c / tickMax) * innerH;
          yCursor -= segH;
          return '<rect class="seg" x="' + x.toFixed(2) + '" y="' + yCursor.toFixed(2) + '" width="' + barW.toFixed(2) + '" height="' + segH.toFixed(2) + '" fill="var(--' + cat + ')" rx="1.5"/>';
        }).join("");
        const hit = '<rect class="history-hit" x="' + (cx - slot / 2).toFixed(2) + '" y="' + pad.top + '" width="' + slot.toFixed(2) + '" height="' + innerH + '" fill="transparent"/>';
        return '<g class="history-bar-group" data-kind="run" data-idx="' + i + '">' + hit + segs + '</g>';
      }).join("");
      const axisLine = '<line class="history-axis-line" x1="' + pad.left + '" x2="' + (w - pad.right) + '" y1="' + (pad.top + innerH) + '" y2="' + (pad.top + innerH) + '"/>';
      historyChart.innerHTML = grid + bars + axisLine + xLabels;
      historyChart._data = data;
    }

    function niceTicks(max, count) {
      const step = Math.max(1, Math.ceil(max / count));
      const out = [0];
      for (let v = step; v < max + step; v += step) out.push(v);
      return out;
    }

    function renderScatterChart(results, analysis) {
      if (!analysis) { scatterPanel.hidden = true; return; }
      const points = (results || [])
        .filter((r) => r.category === "alive" && analysis[r.id])
        .map((r) => ({ ...r, index: analysis[r.id].intelligenceIndex }));
      scatterPanel.hidden = points.length === 0;
      scatterMeta.textContent = points.length ? points.length + " scored" : "";
      if (!points.length) { scatterChart.innerHTML = ""; scatterChart._data = []; return; }

      const w = 560, h = 200;
      const pad = { top: 20, right: 24, bottom: 40, left: 54 };
      const innerW = w - pad.left - pad.right;
      const innerH = h - pad.top - pad.bottom;

      const yTicks = niceTicks(Math.max(1, ...points.map((p) => p.ms)), 4);
      const yTickMax = yTicks[yTicks.length - 1];
      const toX = (idx) => pad.left + (idx / 100) * innerW;
      const toY = (ms) => pad.top + (ms / yTickMax) * innerH;

      const xGridLines = [20, 40, 60, 80, 100].map((v) => {
        const x = toX(v).toFixed(1);
        return '<line class="scatter-grid-line" x1="' + x + '" y1="' + pad.top + '" x2="' + x + '" y2="' + (pad.top + innerH) + '"/>'
          + '<text class="scatter-axis-text" x="' + x + '" y="' + (h - 8) + '" text-anchor="middle">' + v + '</text>';
      }).join("");

      const yGridLines = yTicks.map((t) => {
        const y = toY(t).toFixed(1);
        return '<line class="scatter-grid-line" x1="' + pad.left + '" y1="' + y + '" x2="' + (w - pad.right) + '" y2="' + y + '"/>'
          + '<text class="scatter-axis-text" x="' + (pad.left - 6) + '" y="' + (parseFloat(y) + 3).toFixed(1) + '" text-anchor="end">' + esc(fmtMs(t)) + '</text>';
      }).join("");

      const axisLines = '<line class="scatter-axis-line" x1="' + pad.left + '" y1="' + pad.top + '" x2="' + pad.left + '" y2="' + (pad.top + innerH) + '"/>'
        + '<line class="scatter-axis-line" x1="' + pad.left + '" y1="' + (pad.top + innerH) + '" x2="' + (w - pad.right) + '" y2="' + (pad.top + innerH) + '"/>';

      const xLabel = '<text class="scatter-axis-label" x="' + (pad.left + innerW / 2).toFixed(1) + '" y="' + (h - 1) + '" text-anchor="middle">Intelligence Index →</text>';
      const yLabel = '<text class="scatter-axis-label" x="' + (-(pad.top + innerH / 2)).toFixed(1) + '" y="12" text-anchor="middle" transform="rotate(-90)">Latency</text>';

      const dots = points.map((p, i) => {
        const cx = toX(p.index).toFixed(1);
        const cy = toY(p.ms).toFixed(1);
        return '<circle class="scatter-dot alias-pick-target" r="6" cx="' + cx + '" cy="' + cy
          + '" fill="var(--alive)" fill-opacity="0.75" stroke="var(--alive)" stroke-width="1.5" stroke-opacity="0.4"'
          + ' data-kind="dot" data-idx="' + i + '" data-alias-model="' + esc(p.id) + '" title="Select alias for this model"/>';
      }).join("");

      scatterChart.innerHTML = yGridLines + xGridLines + axisLines + dots + xLabel + yLabel;
      scatterChart._data = points;
    }

    function renderConfig(state) {
      const c = state.config || {};
      const sched = state.scheduler || {};
      configFoot.innerHTML = [
        '<span><strong>Interval</strong>' + esc(fmtDuration(sched.intervalMs)) + '</span>',
        '<span><strong>Timeout</strong>' + esc(fmtDuration(c.timeoutMs)) + '</span>',
        '<span><strong>Concurrency</strong>' + esc(c.concurrency ?? "—") + '</span>',
        '<span><strong>Max tokens</strong>' + esc(c.maxTokens ?? "—") + '</span>',
        '<span><strong>Quiet</strong>' + esc(fmtDuration(c.clientQuietMs)) + '</span>',
        '<span><strong>Retain</strong>' + esc(c.historyLimit ?? "—") + ' runs</span>'
      ].join("");
    }

    function modelCandidates(state) {
      const results = (state.activeRun || state.latest)?.results || [];
      const modelSet = new Set(results.map((item) => item.id));
      Object.values(aliasMap).forEach((target) => modelSet.add(target));
      return Array.from(modelSet).sort((a, b) => a.localeCompare(b));
    }

    function openAliasModal(modelId) {
      selectedAliasTargetModel = modelId;
      aliasModalTarget.textContent = "Model target: " + modelId;
      const keys = Object.keys(aliasMap).sort((a, b) => a.localeCompare(b));
      const current = keys.find((key) => aliasMap[key] === modelId) || "";
      aliasPresetSelect.innerHTML = ['<option value="">Select existing alias name...</option>']
        .concat(keys.map((key) => '<option value="' + esc(key) + '">' + esc(key) + '</option>'))
        .join("");
      aliasPresetSelect.value = current;
      aliasCustomInput.value = current;
      aliasModalBackdrop.hidden = false;
      aliasCustomInput.focus();
      aliasCustomInput.select();
    }

    function closeAliasModal() {
      aliasModalBackdrop.hidden = true;
      selectedAliasTargetModel = "";
    }

    async function persistAliases(nextMap) {
      const res = await fetch("/probe/aliases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliases: nextMap }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Update failed");
      aliasMap = Object.fromEntries((body.aliases || []).map((entry) => [entry.id, entry.resolved]));
    }

    function renderAliases(state) {
      const entries = (state.aliases || []).slice().sort((a, b) => a.id.localeCompare(b.id));
      aliasMap = Object.fromEntries(entries.map((entry) => [entry.id, entry.resolved]));
      aliasMeta.textContent = entries.length ? entries.length + " configured" : "none configured";
      const models = modelCandidates(state);
      aliasList.innerHTML = models.length
        ? models.map((modelId) => {
          const existing = entries.find((entry) => entry.resolved === modelId);
          const mapped = existing ? existing.id + " -> " + existing.resolved : "No alias mapped";
          return '<div class="alias-row">'
            + '<div class="alias-row-main">'
            + '<div class="alias-row-model">' + esc(modelId) + '</div>'
            + '<div class="alias-row-map">' + esc(mapped) + '</div>'
            + '</div>'
            + '<button class="alias-btn" type="button" data-alias-model="' + esc(modelId) + '">Select alias</button>'
            + '</div>';
        }).join("")
        : '<div class="empty">No models available yet. Run a probe first.</div>';
    }

    function statusFor(state) {
      if (state.pause) {
        return {
          state: "paused",
          text: "Paused for client traffic — " + state.pause.activeClients + " active, quiet "
            + (typeof state.pause.quietForMs === "number" ? fmtDuration(state.pause.quietForMs) : "—")
        };
      }
      if (state.activeRun) {
        return {
          state: "running",
          text: "Running " + state.activeRun.source + " probe — started " + fmtRelative(state.activeRun.startedAt)
        };
      }
      return {
        state: "idle",
        text: "Idle — next scheduled " + (state.scheduler.nextRunAt ? fmtRelative(state.scheduler.nextRunAt) : "—")
      };
    }

    function render(state) {
      lastState = state;
      const run = state.activeRun || state.latest;
      const counts = run?.counts || { alive: 0, timeout: 0, rate_limited: 0, error: 0, skipped: 0 };
      runBtn.disabled = Boolean(state.activeRun);

      const status = statusFor(state);
      statusPill.dataset.state = status.state;
      statusLine.textContent = status.text;

      const trafficNote = state.pause
        ? "probe paused"
        : typeof state.traffic?.quietForMs === "number"
          ? "quiet " + fmtDuration(state.traffic.quietForMs)
          : "no recent traffic";

      metrics.innerHTML = [
        metric("Alive", counts.alive, "ready models", "alive"),
        metric("Timeout", counts.timeout, "no bytes before timeout", "timeout"),
        metric("Rate limited", counts.rate_limited, "upstream 429", "rate_limited"),
        metric("Error", counts.error, "non-429 failures", "error"),
        metric("Skipped", counts.skipped, "limiter / backpressure", "skipped"),
        metric("Clients", state.traffic?.activeClients ?? 0, trafficNote, "clients")
      ].join("");

      renderRate(state.rateLimit);
      renderConfig(state);
      renderAliases(state);

      latestMeta.textContent = run
        ? run.status + " · " + run.source + " · " + fmtTime(run.startedAt) + (run.durationMs ? " · " + fmtDuration(run.durationMs) : "")
        : "";

      const results = sortResults(run?.results || [], state.analysis);
      const aliveResults = results.filter((r) => r.category === "alive");
      const maxAliveMs = Math.max(1, ...aliveResults.map((r) => r.ms || 0));

      renderResultsChart(results);
      resultsBody.innerHTML = results.length
        ? results.map((r) => row(r, maxAliveMs)).join("")
        : '<tr><td colspan="5"><div class="empty">No probe results yet — run one to populate this view.</div></td></tr>';

      const fastest = aliveResults.slice().sort((a, b) => a.ms - b.ms).slice(0, 10);
      const fastestMax = Math.max(1, ...fastest.map((r) => r.ms || 0));
      fastestMeta.textContent = aliveResults.length ? aliveResults.length + " alive" : "";

      renderFastestChart(fastest);
      fastestBody.innerHTML = fastest.length
        ? fastest.map((r) => '<tr class="alias-pick-target" data-alias-model="' + esc(r.id) + '" title="Select alias for this model"><td><span class="model-id">' + esc(r.id) + '</span></td><td class="latency-cell"><span class="latency"><span class="latency-bar"><span class="latency-bar-fill" style="width:' + Math.max(6, Math.round((r.ms / fastestMax) * 100)) + '%"></span></span><span class="latency-value">' + esc(fmtMs(r.ms)) + '</span></span></td></tr>').join("")
        : '<tr><td colspan="2"><div class="empty">No alive models yet.</div></td></tr>';

      historyBody.innerHTML = state.history.length
        ? state.history.map((item) => {
          const failed = item.counts.timeout + item.counts.rate_limited + item.counts.error + item.counts.skipped;
          return '<tr>'
            + '<td>' + esc(fmtTime(item.startedAt)) + '</td>'
            + '<td><span class="muted">' + esc(item.source) + '</span></td>'
            + '<td><span class="badge alive"><span class="dot"></span>' + esc(item.counts.alive) + '</span></td>'
            + '<td>' + (failed ? '<span class="badge error"><span class="dot"></span>' + esc(failed) + '</span>' : '<span class="muted">0</span>') + '</td>'
            + '</tr>';
        }).join("")
        : '<tr><td colspan="4"><div class="empty">No retained history yet.</div></td></tr>';

      renderHistoryChart(state.history);
      renderScatterChart(run?.results || [], state.analysis);
    }

    function applyView(target) {
      const buttons = document.querySelectorAll('.view-toggle[data-target="' + target + '"] button');
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.mode === viewMode[target]));
      document.querySelectorAll('[data-view^="' + target + '-"]').forEach((el) => {
        const mode = el.dataset.view.split("-")[1];
        el.hidden = mode !== viewMode[target];
      });
    }

    document.querySelectorAll(".view-toggle").forEach((el) => {
      el.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-mode]");
        if (!btn) return;
        const target = el.dataset.target;
        viewMode[target] = btn.dataset.mode;
        applyView(target);
      });
    });

    function handleHover(e) {
      const row = e.target.closest(".hbar-row");
      const group = e.target.closest(".history-bar-group");
      const bucket = e.target.closest(".rate-bar");
      const dot = e.target.closest(".scatter-dot");
      if (row) {
        const kind = row.dataset.kind;
        const idx = parseInt(row.dataset.idx, 10);
        const data = kind === "result" ? resultsChart._data : fastestChart._data;
        if (data && data[idx]) showTooltip(row, tooltipForResult(data[idx]));
        return;
      }
      if (group) {
        const idx = parseInt(group.dataset.idx, 10);
        const data = historyChart._data;
        if (data && data[idx]) showTooltip(group, tooltipForRun(data[idx]));
        return;
      }
      if (bucket && bucket.dataset.count) {
        showTooltip(bucket, tooltipForRateBucket(parseInt(bucket.dataset.count, 10), parseInt(bucket.dataset.start, 10), parseInt(bucket.dataset.end, 10)));
        return;
      }
      if (dot) {
        const idx = parseInt(dot.dataset.idx, 10);
        const data = scatterChart._data;
        if (data && data[idx]) showTooltip(dot, tooltipForScatterDot(data[idx]));
        return;
      }
      hideTooltip();
    }

    document.addEventListener("mouseover", handleHover);
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest?.(".hbar-row, .history-bar-group, .rate-bar, .scatter-dot")) hideTooltip();
    });
    window.addEventListener("scroll", hideTooltip, true);

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

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-alias-model]");
      if (!target) return;
      const modelId = target.dataset.aliasModel;
      if (!modelId) return;
      openAliasModal(modelId);
    });

    aliasPresetSelect.addEventListener("change", () => {
      if (aliasPresetSelect.value) aliasCustomInput.value = aliasPresetSelect.value;
    });

    aliasCancelBtn.addEventListener("click", () => closeAliasModal());
    aliasModalBackdrop.addEventListener("click", (e) => {
      if (e.target === aliasModalBackdrop) closeAliasModal();
    });

    aliasApplyBtn.addEventListener("click", async () => {
      const aliasName = aliasCustomInput.value.trim();
      if (!selectedAliasTargetModel) return;
      if (!aliasName) {
        aliasStatus.textContent = "Alias name is required";
        return;
      }
      aliasApplyBtn.disabled = true;
      aliasStatus.textContent = "Applying...";
      try {
        const nextMap = { ...aliasMap };
        Object.keys(nextMap).forEach((key) => {
          if (nextMap[key] === selectedAliasTargetModel) delete nextMap[key];
        });
        nextMap[aliasName] = selectedAliasTargetModel;
        await persistAliases(nextMap);
        aliasStatus.textContent = "Applied";
        closeAliasModal();
        await load();
      } catch (err) {
        aliasStatus.textContent = err.message || "Update failed";
      } finally {
        aliasApplyBtn.disabled = false;
      }
    });

    aliasRemoveBtn.addEventListener("click", async () => {
      if (!selectedAliasTargetModel) return;
      aliasRemoveBtn.disabled = true;
      aliasStatus.textContent = "Removing...";
      try {
        const nextMap = { ...aliasMap };
        let removed = false;
        Object.keys(nextMap).forEach((key) => {
          if (nextMap[key] === selectedAliasTargetModel) {
            delete nextMap[key];
            removed = true;
          }
        });
        if (!removed) {
          aliasStatus.textContent = "No mapping for model";
          return;
        }
        await persistAliases(nextMap);
        aliasStatus.textContent = "Removed";
        closeAliasModal();
        await load();
      } catch (err) {
        aliasStatus.textContent = err.message || "Remove failed";
      } finally {
        aliasRemoveBtn.disabled = false;
      }
    });

    sortSelect.addEventListener("change", () => {
      sortMode = sortSelect.value;
      if (lastState) render(lastState);
    });

    applyView("results");
    applyView("fastest");
    applyView("history");

    load().catch((err) => { statusLine.textContent = err.message; });
    setInterval(() => load().catch(() => {}), 5000);
    setInterval(() => loadRate().catch(() => {}), 1000);
  </script>
</body>
</html>`;
}
