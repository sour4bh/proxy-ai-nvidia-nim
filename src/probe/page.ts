export type ProbePageBoot = {
  proxyPublicUrl?: string;
  listenNonLoopback?: boolean;
};

export function probePage(boot: ProbePageBoot = {}): string {
  const bootJson = JSON.stringify({
    proxyPublicUrl: boot.proxyPublicUrl ?? null,
    listenNonLoopback: Boolean(boot.listenNonLoopback),
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>ProxyAI Probe</title>
  <style>
    /* ─── Tokens ─── */
    :root {
      color-scheme: light dark;
      --bg: #f6f7f9;
      --bg-elevated: #ffffff;
      --bg-subtle: #f0f1f4;
      --bg-inset: #ebedf2;
      --border: #e4e5e9;
      --border-strong: #d0d2d8;
      --text: #111318;
      --text-secondary: #4d515e;
      --text-tertiary: #8b8f9c;
      --accent: #5745d7;
      --accent-soft: rgba(87, 69, 215, 0.10);
      --accent-glow: rgba(87, 69, 215, 0.30);
      --alive: #0d9f6e;
      --alive-soft: rgba(13, 159, 110, 0.10);
      --timeout: #e09400;
      --timeout-soft: rgba(224, 148, 0, 0.10);
      --error: #e24c4c;
      --error-soft: rgba(226, 76, 76, 0.10);
      --rate: #d4a000;
      --rate-soft: rgba(212, 160, 0, 0.12);
      --skipped: #8f96a8;
      --skipped-soft: rgba(143, 150, 168, 0.10);
      --shadow-xs: 0 1px 2px rgba(15,23,42,0.04);
      --shadow-sm: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.03);
      --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.03);
      --shadow-lg: 0 12px 28px -8px rgba(15,23,42,0.14);
      --radius-xl: 16px;
      --radius-lg: 12px;
      --radius-md: 8px;
      --radius-sm: 6px;
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 20px;
      --space-6: 24px;
      --space-8: 32px;
      --space-10: 40px;
      --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #080a10;
        --bg-elevated: #0d0f16;
        --bg-subtle: #11131a;
        --bg-inset: #161924;
        --border: #1a1d27;
        --border-strong: #272b3a;
        --text: #eeeff3;
        --text-secondary: #a0a5b5;
        --text-tertiary: #5c6275;
        --accent: #9480ff;
        --accent-soft: rgba(148, 128, 255, 0.14);
        --accent-glow: rgba(148, 128, 255, 0.40);
        --alive: #2dd4a0;
        --alive-soft: rgba(45, 212, 160, 0.14);
        --timeout: #fbbf24;
        --timeout-soft: rgba(251, 191, 36, 0.14);
        --error: #fb7c7c;
        --error-soft: rgba(251, 124, 124, 0.14);
        --rate: #fde047;
        --rate-soft: rgba(253, 224, 71, 0.14);
        --skipped: #94a3b8;
        --skipped-soft: rgba(148, 163, 184, 0.12);
        --shadow-xs: 0 1px 2px rgba(0,0,0,0.35);
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.25);
        --shadow-md: 0 4px 12px -2px rgba(0,0,0,0.50), 0 2px 4px rgba(0,0,0,0.30);
        --shadow-lg: 0 12px 28px -8px rgba(0,0,0,0.60);
      }
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    .probe-hints { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-2); }
    body {
      margin: 0;
      font-family: var(--font-sans);
      font-feature-settings: "cv11","ss01","ss03";
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      letter-spacing: -0.005em;
      line-height: 1.5;
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .num { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
    .wrap {
      width: min(1200px, calc(100% - var(--space-6)));
      max-width: 100%;
      margin: 0 auto;
    }

    /* ─── Header ─── */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      padding-top: env(safe-area-inset-top, 0px);
      backdrop-filter: saturate(160%) blur(16px);
      -webkit-backdrop-filter: saturate(160%) blur(16px);
      background: color-mix(in srgb, var(--bg) 85%, transparent);
      border-bottom: 1px solid var(--border);
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      min-height: 60px;
      padding: var(--space-2) 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
    }
    .brand-mark {
      width: 26px; height: 26px; border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #60a5fa));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent), 0 4px 14px -4px var(--accent-glow);
      position: relative; overflow: hidden;
    }
    .brand-mark::after {
      content: ""; position: absolute; inset: 5px; border-radius: 3px; background: rgba(255,255,255,0.14);
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.15; }
    .brand-name { font-size: 14.5px; font-weight: 650; letter-spacing: -0.015em; }
    .brand-tag { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .status-pill {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 5px 11px 5px 9px; border-radius: 999px;
      background: var(--bg-elevated); border: 1px solid var(--border);
      font-size: 11.5px; color: var(--text-secondary); font-weight: 500;
      box-shadow: var(--shadow-xs); max-width: min(480px, 46vw);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1;
    }
    .status-pill .pulse {
      width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary);
      flex-shrink: 0; position: relative;
    }
    .status-pill[data-state="running"] .pulse { background: var(--accent); }
    .status-pill[data-state="running"] .pulse::after {
      content: ""; position: absolute; inset: -4px; border-radius: 50%; background: var(--accent);
      opacity: 0.35; animation: ping 1.6s cubic-bezier(0,0,0.2,1) infinite;
    }
    .status-pill[data-state="paused"] .pulse { background: var(--timeout); }
    .status-pill[data-state="idle"] .pulse { background: var(--alive); }
    @keyframes ping {
      0% { transform: scale(0.6); opacity: 0.5; }
      80%,100% { transform: scale(1.8); opacity: 0; }
    }

    button.run {
      display: inline-flex; align-items: center; gap: var(--space-2);
      border: 1px solid transparent; color: #fff;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 68%, #60a5fa));
      border-radius: var(--radius-md); padding: 8px 14px;
      font-weight: 600; font-size: 12.5px; letter-spacing: -0.005em;
      cursor: pointer; box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent), 0 4px 14px -4px var(--accent-glow);
      transition: transform 80ms ease, box-shadow 200ms ease, opacity 200ms ease; flex-shrink: 0;
    }
    button.run:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 50%, transparent), 0 8px 20px -6px var(--accent-glow);
    }
    button.run:active:not(:disabled) { transform: translateY(0); }
    button.run:disabled { cursor: not-allowed; opacity: 0.5; }
    button.run svg { width: 13px; height: 13px; }

    /* ─── Live banner ─── */
    .live-banner {
      background: linear-gradient(90deg, var(--accent-soft), transparent 60%);
      border: 1px solid var(--border);
      border-top: 0;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }
    .live-banner.running { background: linear-gradient(90deg, var(--accent-soft), transparent 55%); }
    .live-banner.paused { background: linear-gradient(90deg, var(--timeout-soft), transparent 55%); }
    .live-banner.idle { display: none; }
    .live-progress-wrap {
      flex: 1 1 260px;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .live-progress-track {
      height: 5px;
      background: var(--bg-inset);
      border-radius: 999px;
      overflow: hidden;
    }
    .live-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #60a5fa));
      border-radius: 999px;
      transition: width 400ms cubic-bezier(0.22,1,0.36,1);
      box-shadow: 0 0 10px var(--accent-glow);
    }
    .live-banner.paused .live-progress-fill { background: var(--timeout); box-shadow: none; }
    .live-meta {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .live-meta strong { color: var(--text); font-weight: 600; }

    /* ─── Metrics ─── */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: var(--space-3);
      margin-top: var(--space-3);
    }
    .metric {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-4) var(--space-4) 17px;
      box-shadow: var(--shadow-xs);
      position: relative;
      overflow: hidden;
      transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    }
    .metric:hover { border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .metric::before {
      content: ""; position: absolute; inset: 0 auto 0 0; width: 3px;
      border-radius: 3px 0 0 3px; background: var(--accent);
    }
    .metric.alive::before { background: var(--alive); }
    .metric.timeout::before { background: var(--timeout); }
    .metric.rate_limited::before { background: var(--rate); }
    .metric.error::before { background: var(--error); }
    .metric.skipped::before { background: var(--skipped); }
    .metric.clients::before { background: var(--accent); }
    .metric.paused::before { background: var(--timeout); }
    .metric-label { color: var(--text-tertiary); font-size: 10.5px; text-transform: uppercase; font-weight: 650; letter-spacing: 0.07em; }
    .metric-value { margin-top: var(--space-2); font-size: 26px; font-weight: 600; line-height: 1; letter-spacing: -0.025em; }
    .metric-note { color: var(--text-tertiary); margin-top: var(--space-1); font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ─── Panel ─── */
    .panel {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      overflow: hidden;
      min-width: 0;
    }
    .panel-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-3); padding: var(--space-4) var(--space-4) 0; flex-wrap: wrap;
    }
    .panel-title { font-size: 12px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); margin: 0; }
    .panel-body { padding: var(--space-3) var(--space-4) var(--space-4); min-width: 0; }
    .panel-body.compact { padding: var(--space-3); min-width: 0; }

    .split-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: stretch;
      margin-top: 12px;
    }
    .panel-head-tools {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      flex: 1 1 auto;
      min-width: 0;
      justify-content: flex-end;
    }

    /* ─── Rate limit ─── */
    .rate-panel { margin-top: var(--space-3); }
    .rate-hero {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: var(--space-4); flex-wrap: wrap;
      padding: var(--space-4) var(--space-4) var(--space-3);
    }
    .rate-hero-left { display: flex; flex-direction: column; gap: 2px; }
    .rate-hero-label { font-size: 11px; text-transform: uppercase; font-weight: 650; letter-spacing: 0.07em; color: var(--text-tertiary); }
    .rate-hero-row { display: flex; align-items: baseline; gap: var(--space-2); }
    .rate-hero-value {
      font-size: clamp(22px, 6vw, 30px);
      font-weight: 600;
      line-height: 1;
      letter-spacing: -0.025em;
    }
    .rate-hero-cap { color: var(--text-tertiary); font-size: 15px; font-weight: 500; }
    .rate-hero-pct { font-size: 12px; font-weight: 600; color: var(--accent); background: var(--accent-soft); padding: 3px 8px; border-radius: 999px; }
    .rate-meta {
      font-size: 11.5px; color: var(--text-tertiary);
      display: inline-flex; align-items: center; gap: var(--space-2);
    }
    .rate-meta .dotmini { width: 5px; height: 5px; border-radius: 50%; background: var(--text-tertiary); }
    .rate-meta[data-paused="true"] .dotmini { background: var(--timeout); }
    .rate-progress {
      height: 5px; width: calc(100% - var(--space-8)); margin: 0 var(--space-4);
      background: var(--bg-inset); border-radius: 999px; overflow: hidden;
    }
    .rate-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #60a5fa));
      border-radius: 999px; transition: width 400ms cubic-bezier(0.22,1,0.36,1);
      box-shadow: 0 0 10px var(--accent-glow);
    }
    .rate-stats {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--space-4); padding: var(--space-4);
    }
    .rate-stat-label { color: var(--text-tertiary); font-size: 10.5px; text-transform: uppercase; font-weight: 650; letter-spacing: 0.06em; }
    .rate-stat-value { margin-top: var(--space-1); font-size: 16px; font-weight: 600; line-height: 1.2; letter-spacing: -0.015em; }
    .rate-stat-note { color: var(--text-tertiary); margin-top: 2px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rate-window-wrap { padding: 0 var(--space-4) var(--space-4); }
    .rate-window {
      display: grid; grid-template-columns: repeat(24, minmax(0, 1fr));
      gap: 2px; height: 56px; align-items: end;
    }
    .rate-bar {
      min-height: 2px; border-radius: 3px 3px 1px 1px;
      background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 50%, transparent));
      transition: height 260ms cubic-bezier(0.22,1,0.36,1); cursor: crosshair;
    }
    .rate-bar.empty { background: var(--border); opacity: 0.5; }
    .rate-axis { display: flex; justify-content: space-between; color: var(--text-tertiary); font-size: 10px; margin-top: 5px; letter-spacing: 0.02em; }

    /* ─── Tabs ─── */
    .tabs {
      display: inline-flex; background: var(--bg-subtle); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 2px; gap: 2px;
      flex-shrink: 0;
    }
    .tabs button {
      background: transparent; border: 0; color: var(--text-tertiary);
      font-size: 11.5px; padding: 5px 12px; border-radius: var(--radius-sm);
      cursor: pointer; font-weight: 600; transition: background 150ms ease, color 150ms ease;
      min-width: 0; box-shadow: none; letter-spacing: 0.01em;
    }
    .tabs button:hover { color: var(--text-secondary); }
    .tabs button.active { background: var(--bg-elevated); color: var(--text); box-shadow: var(--shadow-xs); }

    /* ─── Search ─── */
    .search-wrap { position: relative; display: inline-flex; align-items: center; }
    .search-wrap svg {
      position: absolute; left: 8px; width: 13px; height: 13px;
      color: var(--text-tertiary); pointer-events: none;
    }
    .search-input {
      appearance: none; -webkit-appearance: none;
      background: var(--bg-subtle); border: 1px solid var(--border);
      border-radius: var(--radius-md); color: var(--text);
      font-family: inherit; font-size: 12px; font-weight: 500;
      padding: 5px 24px 5px 26px; width: 170px;
      transition: border-color 150ms ease, box-shadow 150ms ease, width 200ms ease;
    }
    .search-input::placeholder { color: var(--text-tertiary); }
    .search-input:hover { border-color: var(--border-strong); }
    .search-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); width: 210px; }
    .search-clear {
      position: absolute; right: 6px; background: none; border: none;
      color: var(--text-tertiary); cursor: pointer; padding: 2px;
      border-radius: 4px; display: none; font-size: 14px; line-height: 1;
    }
    .search-clear:hover { color: var(--text); background: var(--bg-inset); }
    .search-wrap.has-value .search-clear { display: block; }

    /* ─── Filter chips ─── */
    .filter-chips {
      display: inline-flex; gap: 4px; flex-wrap: wrap;
    }
    .filter-chips button {
      background: transparent; border: 1px solid transparent;
      color: var(--text-tertiary); font-size: 11px; font-weight: 600;
      padding: 4px 10px; border-radius: 999px; cursor: pointer;
      transition: all 150ms ease;
    }
    .filter-chips button:hover { color: var(--text-secondary); background: var(--bg-subtle); }
    .filter-chips button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-soft); }

    /* ─── Sort ─── */
    .sort-select {
      appearance: none; -webkit-appearance: none;
      background: var(--bg-subtle); border: 1px solid var(--border);
      border-radius: var(--radius-md); color: var(--text-tertiary);
      font-family: inherit; font-size: 11.5px; font-weight: 600;
      letter-spacing: 0.01em; padding: 5px 24px 5px 10px; cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%236b7280'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 8px center; background-size: 8px 5px;
      transition: border-color 150ms ease, color 150ms ease;
    }
    .sort-select:hover { color: var(--text-secondary); border-color: var(--border-strong); }
    .sort-select:focus { outline: 2px solid var(--accent-soft); outline-offset: 1px; color: var(--text); border-color: var(--accent); }

    /* ─── Table ─── */
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { text-align: left; padding: 9px 8px; vertical-align: middle; }
    th {
      color: var(--text-tertiary); font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.07em; font-weight: 650; border-bottom: 1px solid var(--border);
      position: sticky; top: 0; background: var(--bg-elevated); z-index: 1;
    }
    tbody tr { transition: background 120ms ease; }
    tbody tr:hover { background: var(--bg-subtle); }
    tbody td { border-bottom: 1px solid var(--border); }
    tbody tr:last-child td { border-bottom: 0; }
    .model-id {
      font-family: var(--font-mono); font-size: 11.5px; letter-spacing: -0.01em;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .copy-btn {
      opacity: 0; background: none; border: none; color: var(--text-tertiary);
      cursor: pointer; padding: 2px; border-radius: 4px;
      transition: opacity 120ms ease, color 120ms ease, background 120ms ease;
      display: inline-flex;
    }
    tr:hover .copy-btn, .hbar-row:hover .copy-btn { opacity: 1; }
    .copy-btn:hover { color: var(--accent); background: var(--accent-soft); }
    .copy-btn:active { transform: scale(0.95); }

    /* ─── Alias chips ─── */
    .alias-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 999px;
      font-size: 10.5px; font-weight: 600; letter-spacing: -0.005em;
      background: var(--accent-soft); color: var(--accent);
      border: 1px solid transparent; cursor: pointer;
      white-space: nowrap; transition: filter 120ms ease, transform 80ms ease;
      vertical-align: middle;
    }
    .alias-chip:hover { filter: brightness(1.15); }
    .alias-chip:active { transform: scale(0.96); }
    .alias-chip.add {
      background: transparent; color: var(--text-tertiary);
      border: 1px dashed var(--border); padding: 2px 7px;
    }
    .alias-chip.add:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }

    /* ─── Badges ─── */
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 8px 3px 7px; border-radius: 999px;
      font-size: 11px; font-weight: 600; letter-spacing: -0.005em;
      text-transform: capitalize; border: 1px solid transparent;
    }
    .badge .dot { width: 5px; height: 5px; border-radius: 50%; }
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

    /* ─── Latency ─── */
    .latency {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-variant-numeric: tabular-nums; white-space: nowrap;
    }
    .latency-bar {
      width: 68px; height: 3px; background: var(--border);
      border-radius: 999px; overflow: hidden; flex-shrink: 0;
    }
    .latency-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--alive), color-mix(in srgb, var(--alive) 55%, var(--accent)));
      border-radius: 999px; transition: width 300ms cubic-bezier(0.22,1,0.36,1);
    }
    .latency-value { white-space: nowrap; font-size: 11.5px; }
    td.latency-cell { width: 1%; }

    /* ─── Scroll / empty ─── */
    .scroll {
      overflow: auto;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      max-height: 460px;
      margin: 0 -8px;
      padding: 0 8px;
      min-width: 0;
    }
    .empty { color: var(--text-tertiary); padding: var(--space-6) 0; font-size: 12.5px; text-align: center; }

    /* ─── Horizontal bars ─── */
    .hbar-list {
      display: flex; flex-direction: column; gap: 3px;
      max-height: 480px; overflow-y: auto; overflow-x: hidden;
      padding: 4px 2px 4px 0;
      min-width: 0;
    }
    .hbar-row {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) 60px;
      align-items: center; gap: var(--space-2);
      padding: 4px 8px; border-radius: var(--radius-sm);
      cursor: default; transition: background 120ms ease; position: relative;
    }
    .hbar-row:hover { background: var(--bg-subtle); }
    .hbar-row.dim { opacity: 0.25; }
    .hbar-label {
      font-family: var(--font-mono); font-size: 11px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em;
      display: flex; align-items: center; gap: 6px;
    }
    .hbar-track { position: relative; height: 13px; background: var(--border); border-radius: 4px; overflow: hidden; }
    .hbar-track.empty { background: transparent; border: 1px dashed var(--border); }
    .hbar-fill {
      height: 100%; border-radius: 4px;
      transition: width 320ms cubic-bezier(0.22,1,0.36,1); position: relative;
    }
    .hbar-fill::after {
      content: ""; position: absolute; inset: 0; border-radius: 4px;
      background: linear-gradient(180deg, rgba(255,255,255,0.14), transparent 55%); pointer-events: none;
    }
    .hbar-fill.alive { background: linear-gradient(90deg, var(--alive), color-mix(in srgb, var(--alive) 55%, var(--accent))); }
    .hbar-fill.timeout { background: linear-gradient(90deg, var(--timeout), color-mix(in srgb, var(--timeout) 65%, var(--error))); }
    .hbar-fill.error { background: linear-gradient(90deg, var(--error), color-mix(in srgb, var(--error) 75%, #000)); }
    .hbar-fill.rate_limited { background: linear-gradient(90deg, var(--rate), color-mix(in srgb, var(--rate) 65%, var(--timeout))); }
    .hbar-fill.skipped { background: var(--skipped); }
    .hbar-value { font-variant-numeric: tabular-nums; font-size: 11px; color: var(--text-secondary); font-weight: 500; text-align: right; white-space: nowrap; }
    .hbar-value .badge-mini { display: inline-block; width: 5px; height: 5px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
    .hbar-axis {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) 60px;
      gap: var(--space-2); padding: 0 8px 6px;
      font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;
      letter-spacing: 0.06em; font-weight: 650; border-bottom: 1px solid var(--border); margin-bottom: 4px;
    }
    .hbar-axis-mid { display: flex; justify-content: space-between; }

    /* ─── Category group headers in hbar list ─── */
    .hbar-group-header {
      position: sticky; top: 0; z-index: 2;
      background: var(--bg-elevated);
      padding: 6px 8px; margin: 4px 0 2px;
      font-size: 10.5px; font-weight: 650; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-tertiary);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 8px;
    }
    .hbar-group-header .dot { width: 6px; height: 6px; border-radius: 50%; }

    /* ─── History ─── */
    .history-chart-wrap { padding: 4px 4px 0; }
    .history-chart { width: 100%; height: 170px; display: block; overflow: visible; }
    .history-bar-group { cursor: pointer; }
    .history-bar-group:hover .history-hit { fill: var(--accent-soft); }
    .history-bar-group rect.seg { transition: opacity 150ms ease, filter 150ms ease; }
    .history-bar-group:hover rect.seg { filter: brightness(1.12); }
    .history-axis-line { stroke: var(--border); stroke-width: 1; }
    .history-grid-line { stroke: var(--border); stroke-width: 1; stroke-dasharray: 2 4; opacity: 0.5; }
    .history-axis-text { fill: var(--text-tertiary); font-size: 9.5px; font-family: inherit; }
    .history-legend {
      display: flex; flex-wrap: wrap; gap: 6px 12px;
      padding: 8px 4px 2px; font-size: 10.5px; color: var(--text-secondary);
    }
    .history-legend span { display: inline-flex; align-items: center; gap: 5px; }
    .history-legend .swatch { width: 8px; height: 8px; border-radius: 3px; }
    .history-legend .swatch.alive { background: var(--alive); }
    .history-legend .swatch.rate_limited { background: var(--rate); }
    .history-legend .swatch.timeout { background: var(--timeout); }
    .history-legend .swatch.error { background: var(--error); }
    .history-legend .swatch.skipped { background: var(--skipped); }

    /* ─── Scatter ─── */
    .scatter-wrap { padding: 4px 4px 0; }
    .scatter-svg { width: 100%; display: block; aspect-ratio: 560 / 190; overflow: visible; }
    .scatter-dot { cursor: pointer; transition: opacity 120ms ease, r 150ms ease; }
    .scatter-dot:hover { opacity: 0.75; r: 7; }
    .scatter-axis-text { fill: var(--text-tertiary); font-size: 9.5px; font-family: inherit; }
    .scatter-axis-line { stroke: var(--border-strong); stroke-width: 1; }
    .scatter-grid-line { stroke: var(--border); stroke-width: 1; stroke-dasharray: 2 4; opacity: 0.5; }
    .scatter-axis-label { fill: var(--text-secondary); font-size: 10.5px; font-family: inherit; }

    /* ─── Tooltip ─── */
    .tooltip {
      position: absolute; z-index: 100; pointer-events: none;
      background: var(--bg-elevated); border: 1px solid var(--border-strong);
      border-radius: var(--radius-md); padding: 8px 12px;
      font-size: 11.5px; color: var(--text); box-shadow: var(--shadow-lg);
      max-width: 300px; transform: translate(-50%, calc(-100% - 10px));
      transition: opacity 100ms ease;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    }
    .tooltip[hidden] { display: none; }
    .tooltip::after {
      content: ""; position: absolute; left: 50%; bottom: -5px;
      transform: translateX(-50%) rotate(45deg);
      width: 8px; height: 8px; background: var(--bg-elevated);
      border-right: 1px solid var(--border-strong); border-bottom: 1px solid var(--border-strong);
    }
    .tooltip-title { font-weight: 600; font-size: 11.5px; letter-spacing: -0.005em; margin-bottom: 5px; font-family: var(--font-mono); word-break: break-all; }
    .tooltip-meta { display: flex; gap: 8px; align-items: center; margin-bottom: 5px; }
    .tooltip-row { display: flex; justify-content: space-between; gap: var(--space-4); color: var(--text-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
    .tooltip-row strong { color: var(--text); font-weight: 500; }
    .tooltip-note { margin-top: 5px; padding-top: 5px; border-top: 1px solid var(--border); font-size: 10.5px; color: var(--text-tertiary); max-height: 80px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; word-break: break-word; }

    /* ─── Aliases ─── */
    .alias-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .alias-table th, .alias-table td { padding: 10px 8px; text-align: left; vertical-align: middle; }
    .alias-table th { color: var(--text-tertiary); font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 650; border-bottom: 1px solid var(--border); }
    .alias-table tbody tr { transition: background 120ms ease; }
    .alias-table tbody tr:hover { background: var(--bg-subtle); }
    .alias-table tbody td { border-bottom: 1px solid var(--border); }
    .alias-table tbody tr:last-child td { border-bottom: 0; }
    .alias-name { font-family: var(--font-mono); font-size: 12px; color: var(--text); }
    .alias-target { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary); }
    .alias-actions { display: flex; gap: var(--space-2); justify-content: flex-end; }
    .alias-actions button {
      background: var(--bg-subtle); border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: var(--radius-sm); font-size: 11px; font-weight: 600; padding: 4px 8px;
      cursor: pointer; transition: all 120ms ease;
    }
    .alias-actions button:hover { background: var(--bg-inset); color: var(--text); border-color: var(--border-strong); }
    .alias-actions button.danger { color: var(--error); border-color: var(--error-soft); background: var(--error-soft); }
    .alias-actions button.danger:hover { background: var(--error); color: #fff; }

    /* ─── Modal ─── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 120;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-4); opacity: 0; transition: opacity 200ms ease;
    }
    .modal-backdrop.open { opacity: 1; }
    .modal-backdrop[hidden] { display: none; }
    .alias-modal {
      width: min(460px, calc(100vw - var(--space-6)));
      background: var(--bg-elevated); border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: var(--space-5);
      transform: translateY(8px) scale(0.98); transition: transform 200ms cubic-bezier(0.22,1,0.36,1);
    }
    .modal-backdrop.open .alias-modal { transform: translateY(0) scale(1); }
    .alias-modal h3 { margin: 0 0 var(--space-2); font-size: 15px; letter-spacing: -0.01em; font-weight: 650; }
    .alias-modal .target { font-family: var(--font-mono); font-size: 11.5px; margin-bottom: var(--space-3); color: var(--text-secondary); word-break: break-all; }
    .alias-modal label { display: block; font-size: 11.5px; color: var(--text-tertiary); margin-bottom: var(--space-1); font-weight: 600; }
    .alias-modal select, .alias-modal input {
      width: 100%; border: 1px solid var(--border); border-radius: var(--radius-md);
      background: var(--bg-subtle); color: var(--text); font-size: 13px; font-family: inherit;
      padding: 7px 10px; margin-bottom: var(--space-3);
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .alias-modal select:focus, .alias-modal input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .alias-modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-1); }
    .alias-modal-actions button {
      border-radius: var(--radius-md); padding: 7px 12px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border); background: var(--bg-subtle); color: var(--text-secondary);
      transition: all 120ms ease;
    }
    .alias-modal-actions button:hover { background: var(--bg); color: var(--text); border-color: var(--border-strong); }
    .alias-modal-actions button.primary { color: #fff; border-color: transparent; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 68%, #60a5fa)); }
    .alias-modal-actions button.primary:hover { filter: brightness(1.08); }
    .alias-modal-actions button.danger { color: var(--error); border-color: var(--error-soft); background: var(--error-soft); }
    .alias-modal-actions button.danger:hover { background: var(--error); color: #fff; }

    /* ─── Toast ─── */
    .toast-container {
      position: fixed; bottom: var(--space-5); right: var(--space-5); z-index: 130;
      display: flex; flex-direction: column; gap: var(--space-2); pointer-events: none;
    }
    .toast {
      background: var(--bg-elevated); border: 1px solid var(--border-strong);
      border-radius: var(--radius-md); padding: 10px 14px; font-size: 12.5px;
      font-weight: 500; color: var(--text); box-shadow: var(--shadow-lg);
      display: flex; align-items: center; gap: var(--space-2);
      transform: translateX(120%); opacity: 0;
      transition: transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease;
      pointer-events: auto; max-width: 300px;
    }
    .toast.show { transform: translateX(0); opacity: 1; }
    .toast.success { border-left: 3px solid var(--alive); }
    .toast.error { border-left: 3px solid var(--error); }

    /* ─── Skeleton ─── */
    .skeleton { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4) 8px; }
    .skeleton-row {
      height: 16px;
      background: linear-gradient(90deg, var(--border) 30%, var(--bg-subtle) 50%, var(--border) 70%);
      background-size: 200% 100%; border-radius: var(--space-1);
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .skeleton-row:nth-child(2) { width: 85%; }
    .skeleton-row:nth-child(3) { width: 65%; }
    .skeleton-row:nth-child(4) { width: 75%; }
    .skeleton-row:nth-child(5) { width: 55%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ─── Section meta ─── */
    .section-meta { color: var(--text-tertiary); font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .muted { color: var(--text-tertiary); }

    /* ─── Config foot ─── */
    .config-foot { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 11px; color: var(--text-tertiary); padding: var(--space-3) var(--space-4); }
    .config-foot span strong { color: var(--text-secondary); font-weight: 600; font-variant-numeric: tabular-nums; margin-right: 4px; }

    .banner-public, .banner-listen {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);
      border: 1px solid var(--border); margin-bottom: var(--space-3); font-size: 12.5px;
    }
    .banner-public { background: var(--accent-soft); }
    .banner-listen { background: var(--timeout-soft); }
    .banner-public a { color: var(--accent); font-weight: 600; word-break: break-all; }
    .banner-actions { display: flex; gap: var(--space-2); flex-shrink: 0; }

    .telemetry-table { width: 100%; font-size: 11.5px; border-collapse: collapse; }
    .telemetry-table th, .telemetry-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--border); }
    .telemetry-table th { color: var(--text-tertiary); font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
    .telemetry-phase { font-family: var(--font-mono); font-size: 11px; }

    .badge-new {
      display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 999px;
      font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
      background: var(--accent-soft); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    }
    .catalog-pop {
      position: relative; display: inline-block;
    }
    .catalog-pop:focus-within .catalog-pop-panel, .catalog-pop:hover .catalog-pop-panel { opacity: 1; visibility: visible; pointer-events: auto; }
    .catalog-pop-panel {
      position: absolute; left: 0; top: calc(100% + 6px); z-index: 80;
      min-width: 280px; max-width: min(420px, 90vw); max-height: 240px; overflow: auto;
      padding: var(--space-3); background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-md);
      font-size: 11px; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 120ms ease;
    }
    .catalog-pop-panel table { width: 100%; border-collapse: collapse; }
    .catalog-pop-panel td, .catalog-pop-panel th { padding: 4px 6px; border-bottom: 1px solid var(--border); text-align: left; }
    .rate-rpm { font-size: 13px; color: var(--text-secondary); margin-left: 8px; }

    @media (hover: none) {
      tbody tr .copy-btn, .hbar-row .copy-btn { opacity: 1; }
    }

    /* ─── Responsive ─── */
    @media (max-width: 960px) {
      .metrics-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .rate-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 900px) {
      .split-panels { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .metric-value { font-size: clamp(20px, 5.5vw, 26px); }
      .rate-hero-row { flex-wrap: wrap; row-gap: var(--space-1); }
    }
    @media (max-width: 600px) {
      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .top { flex-wrap: wrap; padding: var(--space-2) 0; }
      .status-pill { max-width: 100%; order: 3; flex-basis: 100%; }
      button.run { width: 100%; justify-content: center; order: 2; }
      .hbar-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) 52px; }
      .hbar-axis { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) 52px; }
      .live-meta { font-size: 11px; }
      .panel-head .panel-title { flex: 1 1 100%; }
      .section-meta {
        max-width: 100%;
        flex-basis: 100%;
      }
      .panel-head-tools {
        flex-basis: 100%;
        justify-content: flex-start;
        gap: var(--space-2);
      }
      .panel-head-tools .search-wrap {
        flex: 1 1 100%;
        max-width: 100%;
      }
      .panel-head-tools .search-input {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
      .panel-head-tools .search-input:focus {
        width: 100%;
        max-width: 100%;
      }
      .panel-head .tabs {
        max-width: 100%;
        overflow-x: auto;
        flex-wrap: nowrap;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
      }
      .panel-head .tabs button {
        flex: 0 0 auto;
      }
      .rate-window-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: var(--space-1);
      }
      .rate-window { min-width: 380px; }
      .rate-progress {
        width: calc(100% - var(--space-6));
        max-width: 100%;
        margin-left: var(--space-3);
        margin-right: var(--space-3);
      }
      .catalog-pop-panel {
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        max-width: calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px));
      }
    }
    @media (max-width: 480px) {
      .filter-chips { max-width: 100%; }
      .panel-head-tools .sort-select {
        flex: 1 1 auto;
        min-width: 0;
      }
      .rate-stat-value { font-size: 15px; }
    }
  </style>
</head>
<body>
  <script type="application/json" id="probe-boot">${bootJson}</script>
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
      <button class="run" id="runBtn" type="button" title="Run probe now (R)">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 2.5v11l9-5.5-9-5.5z" fill="currentColor"/></svg>
        <span>Run probe</span>
      </button>
    </div>
  </header>

  <main class="wrap">
    <div class="probe-hints" id="probeHints"></div>
    <div class="panel live-banner idle" id="liveBanner">
      <div class="live-progress-wrap">
        <div class="live-meta" id="liveMeta"></div>
        <div class="live-progress-track"><div class="live-progress-fill" id="liveProgress" style="width:0%"></div></div>
      </div>
    </div>

    <div class="metrics-grid" id="metrics" aria-live="polite">
      <div class="panel metric" id="loadingIndicator">
        <div class="skeleton"><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div></div>
      </div>
    </div>

    <section class="panel" style="margin-top:0">
      <div class="panel-head">
        <h2 class="panel-title">Recent client requests</h2>
        <div class="panel-head-tools">
          <span class="section-meta muted" id="telemetryMeta"></span>
          <button type="button" class="run" id="copyTelemetryBtn" style="padding:6px 10px;font-size:11px">Copy JSON</button>
        </div>
      </div>
      <div class="panel-body compact">
        <div class="scroll">
          <table class="telemetry-table">
            <thead><tr><th>Time</th><th>Path</th><th>Model</th><th>Phase</th><th>HTTP</th><th>ms</th><th>Client</th></tr></thead>
            <tbody id="telemetryBody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="panel rate-panel">
      <div class="rate-hero">
        <div class="rate-hero-left">
          <span class="rate-hero-label">Rate limit</span>
          <div class="rate-hero-row">
            <span class="rate-hero-value num" id="rateUsed">0</span>
            <span class="rate-hero-cap num" id="rateCap">/ 40</span>
            <span class="rate-hero-pct num" id="ratePct">0%</span>
            <span class="rate-rpm num" id="rateRpm" title="Rolling admissions in the last 60s"></span>
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

    <section class="panel" style="margin-top:12px;">
      <div class="panel-head">
        <h2 class="panel-title">NIM catalog</h2>
        <div class="panel-head-tools">
          <span class="section-meta" id="catalogMeta"></span>
          <div class="search-wrap" id="catalogSearchWrap">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7 2a5 5 0 013.8 8.2l2.5 2.5a.7.7 0 11-1 1l-2.5-2.5A5 5 0 117 2zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="currentColor"/></svg>
            <input type="text" id="catalogSearch" class="search-input" placeholder="Filter catalog..." autocomplete="off">
          </div>
          <button type="button" class="run" id="catalogRefreshBtn" style="padding:6px 12px;font-size:12px">Refresh from NIM</button>
        </div>
      </div>
      <div class="panel-body compact">
        <div class="scroll">
          <table>
            <thead><tr><th>Model</th><th>Probe</th><th>Owned by</th><th>History</th></tr></thead>
            <tbody id="catalogBody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="panel" style="margin-top:12px;">
      <div class="panel-head">
        <h2 class="panel-title">Models</h2>
        <div class="panel-head-tools">
          <span class="section-meta" id="latestMeta"></span>
          <div class="search-wrap" id="searchWrap">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7 2a5 5 0 013.8 8.2l2.5 2.5a.7.7 0 11-1 1l-2.5-2.5A5 5 0 117 2zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="currentColor"/></svg>
            <input type="text" id="modelSearch" class="search-input" placeholder="Filter models or aliases..." autocomplete="off">
            <button type="button" class="search-clear" id="searchClear" aria-label="Clear search">×</button>
          </div>
          <div class="filter-chips" id="filterChips">
            <button type="button" data-filter="all" class="active">All</button>
            <button type="button" data-filter="aliased">Aliased</button>
            <button type="button" data-filter="unaliased">Unaliased</button>
          </div>
          <select id="sortSelect" class="sort-select" title="Sort by">
            <option value="category">Category</option>
            <option value="latency-asc">Latency ↑</option>
            <option value="latency-desc">Latency ↓</option>
            <option value="index-desc">AI Index ↓</option>
          </select>
          <div class="tabs" data-target="results">
            <button type="button" data-mode="chart" class="active">Chart</button>
            <button type="button" data-mode="table">Table</button>
          </div>
        </div>
      </div>
      <div class="panel-body compact">
        <div class="view" data-view="results-chart">
          <div class="hbar-axis"><span>Model</span><span class="hbar-axis-mid"><span id="resultsAxisMin">0</span><span id="resultsAxisMax">—</span></span><span style="text-align:right">Latency</span></div>
          <div class="hbar-list" id="resultsChart"></div>
        </div>
        <div class="view" data-view="results-table" hidden>
          <div class="scroll">
            <table>
              <thead><tr><th>Model</th><th>Status</th><th>Alias</th><th>Code</th><th>Latency</th><th>Note</th></tr></thead>
              <tbody id="resultsBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="split-panels">
        <div class="panel">
          <div class="panel-head">
            <h2 class="panel-title">Fastest alive</h2>
            <div class="panel-head-tools">
              <span class="section-meta muted" id="fastestMeta"></span>
              <div class="tabs" data-target="fastest">
                <button type="button" data-mode="chart" class="active">Chart</button>
                <button type="button" data-mode="table">Table</button>
              </div>
            </div>
          </div>
          <div class="panel-body compact">
            <div class="view" data-view="fastest-chart">
              <div class="hbar-list" id="fastestChart"></div>
            </div>
            <div class="view" data-view="fastest-table" hidden>
              <div class="scroll">
                <table>
                  <thead><tr><th>Model</th><th>Alias</th><th>Latency</th></tr></thead>
                  <tbody id="fastestBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2 class="panel-title">History</h2>
            <div class="tabs" data-target="history">
              <button type="button" data-mode="chart" class="active">Chart</button>
              <button type="button" data-mode="table">Table</button>
            </div>
          </div>
          <div class="panel-body compact">
            <div class="view" data-view="history-chart">
              <div class="history-chart-wrap" id="historyChartWrap">
                <svg class="history-chart" id="historyChart" viewBox="0 0 600 170" preserveAspectRatio="none"></svg>
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
        </div>
      </div>
    </section>

    <div class="panel" style="margin-top:12px;">
      <div class="config-foot" id="configFoot"></div>
    </div>

    <section class="panel" style="margin-top:12px;">
      <div class="panel-head">
        <h2 class="panel-title">Model aliases</h2>
        <span class="section-meta muted" id="aliasMeta"></span>
      </div>
      <div class="panel-body compact">
        <div class="scroll">
          <table class="alias-table">
            <thead><tr><th>Alias</th><th>Maps to</th><th style="text-align:right">Action</th></tr></thead>
            <tbody id="aliasTableBody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="panel" id="scatterPanel" hidden style="margin-top:12px;">
      <div class="panel-head">
        <h2 class="panel-title">Quality vs latency</h2>
        <span class="section-meta muted" id="scatterMeta"></span>
      </div>
      <div class="panel-body compact">
        <div class="scatter-wrap">
          <svg class="scatter-svg" id="scatterChart" viewBox="0 0 560 190"></svg>
        </div>
      </div>
    </section>
  </main>

  <div class="tooltip" id="tooltip" hidden></div>

  <div class="modal-backdrop" id="aliasModalBackdrop" hidden>
    <div class="alias-modal" role="dialog" aria-modal="true" aria-labelledby="aliasModalTitle">
      <h3 id="aliasModalTitle">Assign alias</h3>
      <div class="target" id="aliasModalTarget"></div>
      <label for="aliasPresetSelect">Use existing alias name</label>
      <select id="aliasPresetSelect"></select>
      <label for="aliasCustomInput">Or create custom alias name</label>
      <input id="aliasCustomInput" type="text" placeholder="example: claude-sonnet-4-6" autocomplete="off">
      <div class="alias-modal-actions">
        <button type="button" id="aliasRemoveBtn" class="danger">Remove mapping</button>
        <button type="button" id="aliasCancelBtn">Cancel</button>
        <button type="button" id="aliasApplyBtn" class="primary">Apply</button>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toastContainer"></div>

  <script>
    const runBtn = document.getElementById("runBtn");
    const statusPill = document.getElementById("statusPill");
    const statusLine = document.getElementById("statusLine");
    const liveBanner = document.getElementById("liveBanner");
    const liveMeta = document.getElementById("liveMeta");
    const liveProgress = document.getElementById("liveProgress");
    const metrics = document.getElementById("metrics");
    const loadingIndicator = document.getElementById("loadingIndicator");
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
    const modelSearch = document.getElementById("modelSearch");
    const searchWrap = document.getElementById("searchWrap");
    const searchClear = document.getElementById("searchClear");
    const filterChips = document.getElementById("filterChips");
    const tooltip = document.getElementById("tooltip");
    const aliasMeta = document.getElementById("aliasMeta");
    const aliasTableBody = document.getElementById("aliasTableBody");
    const aliasModalBackdrop = document.getElementById("aliasModalBackdrop");
    const aliasModalTarget = document.getElementById("aliasModalTarget");
    const aliasPresetSelect = document.getElementById("aliasPresetSelect");
    const aliasCustomInput = document.getElementById("aliasCustomInput");
    const aliasCancelBtn = document.getElementById("aliasCancelBtn");
    const aliasApplyBtn = document.getElementById("aliasApplyBtn");
    const aliasRemoveBtn = document.getElementById("aliasRemoveBtn");
    const toastContainer = document.getElementById("toastContainer");
    const probeBootEl = document.getElementById("probe-boot");
    const BOOT = probeBootEl ? JSON.parse(probeBootEl.textContent || "{}") : {};
    const probeHints = document.getElementById("probeHints");
    const telemetryBody = document.getElementById("telemetryBody");
    const telemetryMeta = document.getElementById("telemetryMeta");
    const copyTelemetryBtn = document.getElementById("copyTelemetryBtn");
    const rateRpm = document.getElementById("rateRpm");
    const catalogMeta = document.getElementById("catalogMeta");
    const catalogBody = document.getElementById("catalogBody");
    const catalogSearch = document.getElementById("catalogSearch");
    const catalogRefreshBtn = document.getElementById("catalogRefreshBtn");

    const CATEGORY_LABEL = { alive: "Alive", timeout: "Timeout", rate_limited: "Rate limited", error: "Error", skipped: "Skipped" };
    const STACK_ORDER = ["alive", "rate_limited", "timeout", "error", "skipped"];
    const CATEGORY_RANK = { error: 0, timeout: 1, rate_limited: 2, skipped: 3, alive: 4 };
    const CATEGORY_COLOR = { alive: "alive", timeout: "timeout", rate_limited: "rate", error: "error", skipped: "skipped" };

    const viewMode = { results: "chart", fastest: "chart", history: "chart" };
    let sortMode = "category";
    let searchQuery = "";
    let aliasFilter = "all";
    let lastState = null;
    let aliasMap = {};
    let selectedAliasTargetModel = "";
    let catalogQuery = "";
    let lastCatalog = null;

    /* ─── Helpers ─── */
    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function fmtTime(value) {
      if (!value) return "pending";
      const d = new Date(value); const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      return sameDay ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }
    function fmtRelative(value) {
      if (!value) return "—";
      const ms = new Date(value).getTime() - Date.now();
      const abs = Math.abs(ms);
      if (abs < 1000) return ms >= 0 ? "now" : "just now";
      const s = Math.round(abs / 1000);
      const sign = ms >= 0 ? "in " : "";
      const suffix = ms >= 0 ? "" : " ago";
      if (s < 60) return sign + s + "s" + suffix;
      const m = Math.round(s / 60);
      if (m < 60) return sign + m + "m" + suffix;
      const h = Math.round(m / 60);
      if (h < 24) return sign + h + "h" + suffix;
      return sign + Math.round(h / 24) + "d" + suffix;
    }
    function fmtMs(value) {
      if (typeof value !== "number") return "—";
      return value < 1000 ? value + " ms" : (value / 1000).toFixed(2) + " s";
    }
    function fmtDuration(value) {
      if (typeof value !== "number") return "—";
      if (value <= 0) return "now";
      if (value < 1000) return value + " ms";
      const s = Math.ceil(value / 1000);
      if (s < 60) return s + " s";
      const m = Math.floor(s / 60);
      const r = s % 60;
      return r ? m + "m " + r + "s" : m + "m";
    }
    function fmtPct(value) { return typeof value === "number" ? Math.round(value * 100) + "%" : "—"; }
    function categoryColor(category) { return "var(--" + (CATEGORY_COLOR[category] || "skipped") + ")"; }

    function toast(message, type = "success") {
      const el = document.createElement("div");
      el.className = "toast " + type;
      el.textContent = message;
      toastContainer.appendChild(el);
      requestAnimationFrame(() => el.classList.add("show"));
      setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3000);
    }
    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard"), () => toast("Copy failed", "error"));
    }
    function copyBtn(modelId) {
      return '<button class="copy-btn" type="button" data-copy="' + esc(modelId) + '" title="Copy model ID">'
        + '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4v7h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="6" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>'
        + '</button>';
    }

    function getAliasForModel(modelId) {
      const keys = Object.keys(aliasMap);
      return keys.find((key) => aliasMap[key] === modelId) || "";
    }
    function aliasChip(modelId) {
      const alias = getAliasForModel(modelId);
      if (alias) {
        return '<span class="alias-chip" data-alias-model="' + esc(modelId) + '" title="Click to change alias">' + esc(alias) + '</span>';
      }
      return '<span class="alias-chip add" data-alias-model="' + esc(modelId) + '" title="Click to add alias">+ alias</span>';
    }

    function sortResults(results, analysis) {
      return [...results].sort((a, b) => {
        if (sortMode === "latency-asc") return (a.ms || 0) - (b.ms || 0);
        if (sortMode === "latency-desc") return (b.ms || 0) - (a.ms || 0);
        if (sortMode === "index-desc") {
          const ai = analysis?.[a.id]?.intelligenceIndex ?? -1;
          const bi = analysis?.[b.id]?.intelligenceIndex ?? -1;
          return bi !== ai ? bi - ai : CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category];
        }
        return CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category] || (b.ms || 0) - (a.ms || 0);
      });
    }
    function filterResults(results) {
      let filtered = results;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((r) => {
          if (r.id.toLowerCase().includes(q)) return true;
          const alias = getAliasForModel(r.id);
          return alias && alias.toLowerCase().includes(q);
        });
      }
      if (aliasFilter === "aliased") {
        filtered = filtered.filter((r) => getAliasForModel(r.id));
      } else if (aliasFilter === "unaliased") {
        filtered = filtered.filter((r) => !getAliasForModel(r.id));
      }
      return filtered;
    }

    /* ─── Renderers ─── */
    function metric(label, value, note, kind) {
      return '<div class="panel metric ' + esc(kind) + '"><div class="metric-label">' + esc(label) + '</div><div class="metric-value num">' + esc(value) + '</div><div class="metric-note">' + esc(note) + '</div></div>';
    }
    function rateStat(label, value, note) {
      return '<div><div class="rate-stat-label">' + esc(label) + '</div><div class="rate-stat-value num">' + esc(value) + '</div><div class="rate-stat-note">' + esc(note) + '</div></div>';
    }
    function row(result, maxAliveMs) {
      const cat = result.category;
      const latency = cat === "alive" && typeof result.ms === "number"
        ? '<span class="latency"><span class="latency-bar"><span class="latency-bar-fill" style="width:' + Math.max(4, Math.round((result.ms / Math.max(1, maxAliveMs)) * 100)) + '%"></span></span><span class="latency-value">' + esc(fmtMs(result.ms)) + '</span></span>'
        : '<span class="muted">' + esc(fmtMs(result.ms)) + '</span>';
      return '<tr>'
        + '<td><span class="model-id">' + esc(result.id) + copyBtn(result.id) + '</span></td>'
        + '<td><span class="badge ' + esc(cat) + '"><span class="dot"></span>' + esc(CATEGORY_LABEL[cat] || cat) + '</span></td>'
        + '<td>' + aliasChip(result.id) + '</td>'
        + '<td class="muted num">' + esc(result.status || "—") + '</td>'
        + '<td>' + latency + '</td>'
        + '<td class="muted">' + esc(result.note || "") + '</td>'
        + '</tr>';
    }

    function renderHints(state) {
      if (!probeHints) return;
      const rows = [];
      const pub = BOOT.proxyPublicUrl || state?.ui?.proxyPublicUrl;
      if (pub) {
        const base = String(pub).replace(/\/+$/, "");
        const probeUrl = base + "/probe";
        rows.push(
          '<div class="banner-public"><span>Public dashboard URL <span class="muted">(Tailscale / LAN)</span></span>'
          + '<div class="banner-actions"><a href="' + esc(probeUrl) + '" target="_blank" rel="noopener">Open /probe</a>'
          + '<button type="button" class="run" style="padding:6px 10px;font-size:11px" data-copy="' + esc(probeUrl) + '">Copy URL</button></div></div>',
        );
      }
      if (BOOT.listenNonLoopback || state?.ui?.listenNonLoopback) {
        rows.push('<div class="banner-listen"><span>Listening on non-loopback — restrict access (Tailscale ACLs / firewall).</span></div>');
      }
      probeHints.innerHTML = rows.join("");
    }

    function renderTelemetryRows(entries, maxCap) {
      if (!telemetryBody) return;
      const list = entries || [];
      if (telemetryMeta) {
        telemetryMeta.textContent = list.length
          ? "Last " + list.length + (maxCap ? " (cap " + maxCap + ")" : "")
          : "No requests yet";
      }
      telemetryBody.innerHTML = list.length
        ? list.map((e) => {
            const model = esc(e.requestedModel || "")
              + (e.resolvedModel && e.resolvedModel !== e.requestedModel ? " → " + esc(e.resolvedModel) : "");
            const cli = (e.clientIp ? e.clientIp + " · " : "") + String(e.userAgent || "").slice(0, 64);
            return '<tr>'
              + '<td class="muted">' + esc(fmtTime(e.at)) + '</td>'
              + '<td>' + esc(e.path || "") + '</td>'
              + '<td class="model-id">' + model + '</td>'
              + '<td class="telemetry-phase">' + esc(e.phase || "") + '</td>'
              + '<td class="num">' + (e.upstreamStatus != null ? esc(String(e.upstreamStatus)) : "—") + '</td>'
              + '<td class="num">' + (e.totalMs != null ? esc(String(e.totalMs)) : "—") + '</td>'
              + '<td class="muted" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(cli) + '">' + esc(cli) + '</td>'
              + '</tr>';
          }).join("")
        : '<tr><td colspan="7"><div class="empty">No proxy requests recorded yet.</div></td></tr>';
    }

    function timelinePopHtml(tl) {
      if (!tl || !tl.length) return "";
      const head = '<table><thead><tr><th>Run</th><th>When</th><th>Cat</th><th>ms</th></tr></thead><tbody>';
      const body = tl.map((p) => '<tr><td class="muted">' + esc((p.runId || "").slice(0, 12)) + '</td><td>' + esc(fmtTime(p.startedAt)) + '</td><td><span class="badge ' + esc(p.category) + '"><span class="dot"></span>' + esc(CATEGORY_LABEL[p.category] || p.category) + '</span></td><td class="num">' + esc(fmtMs(p.ms)) + '</td></tr>').join("");
      return head + body + '</tbody></table>';
    }

    function renderCatalogTable(cat) {
      if (!catalogBody || !cat || !cat.entries) return;
      const q = catalogQuery.toLowerCase();
      const rows = cat.entries.filter(
        (e) => !q || e.id.toLowerCase().includes(q) || String(e.owned_by || "").toLowerCase().includes(q),
      );
      catalogMeta.textContent =
        rows.length + " / " + cat.entries.length + " · probe tests " + (cat.probeChatIds?.length ?? 0) + " · filtered " + (cat.filteredOut ?? 0);
      catalogBody.innerHTML = rows.length
        ? rows.map((e) => {
            const badge = e.isNew ? '<span class="badge-new">New</span>' : "";
            const probe = e.probed
              ? '<span class="badge alive"><span class="dot"></span>yes</span>'
              : '<span class="muted">skip</span>';
            const pop =
              e.timeline && e.timeline.length
                ? '<div class="catalog-pop" tabindex="0"><button type="button" class="run" style="padding:4px 8px;font-size:10px">' + e.timeline.length + '</button><div class="catalog-pop-panel" role="tooltip">' + timelinePopHtml(e.timeline) + "</div></div>"
                : "—";
            return (
              '<tr><td><span class="model-id">' + esc(e.id) + copyBtn(e.id) + "</span> " + badge + ' <button type="button" data-alias-model="' + esc(e.id) + '" style="font-size:10px;margin-left:4px">Alias</button></td><td>' + probe + '</td><td class="muted">' + esc(e.owned_by || "") + "</td><td>" + pop + "</td></tr>"
            );
          }).join("")
        : '<tr><td colspan="4"><div class="empty">No catalog entries.</div></td></tr>';
    }

    async function loadCatalog() {
      if (!catalogBody) return;
      try {
        const res = await fetch("/probe/catalog");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "catalog failed");
        lastCatalog = data;
        renderCatalogTable(data);
      } catch (err) {
        if (catalogMeta) catalogMeta.textContent = err.message || "catalog error";
      }
    }

    function renderLiveBanner(state) {
      const run = state.activeRun;
      if (!run && !state.pause) {
        liveBanner.className = "panel live-banner idle";
        liveBanner.hidden = true;
        return;
      }
      liveBanner.hidden = false;
      if (state.pause) {
        liveBanner.className = "panel live-banner paused";
        liveMeta.innerHTML = '<strong>Paused</strong> waiting for client traffic to quiet — ' + state.pause.activeClients + " active client" + (state.pause.activeClients === 1 ? "" : "s");
        liveProgress.style.width = "0%";
        return;
      }
      liveBanner.className = "panel live-banner running";
      const tested = run.results.length;
      const total = run.config?.modelCount || tested;
      const pct = total > 0 ? Math.min(100, Math.round((tested / total) * 100)) : 0;
      const elapsed = Date.now() - Date.parse(run.startedAt);
      const eta = tested > 0 && tested < total ? Math.round((elapsed / tested) * (total - tested)) : null;
      liveMeta.innerHTML = '<strong>' + tested + " / " + total + '</strong> models tested · <strong>' + esc(fmtDuration(elapsed)) + '</strong> elapsed' + (eta !== null ? ' · ~<strong>' + esc(fmtDuration(eta)) + '</strong> remaining' : '');
      liveProgress.style.width = pct + "%";
    }

    function renderRate(rate) {
      if (!rate) {
        rateUsed.textContent = "0"; rateCap.textContent = "/ 40"; ratePct.textContent = "0%";
        rateProgress.style.width = "0%"; rateMetaText.textContent = "";
        rateStats.innerHTML = ""; rateWindow.innerHTML = "";
        if (rateRpm) rateRpm.textContent = "";
        return;
      }
      const paused = typeof rate.pauseRemainingMs === "number";
      rateUsed.textContent = rate.inUse;
      rateCap.textContent = "/ " + rate.capacity;
      ratePct.textContent = fmtPct(rate.usageRatio);
      rateProgress.style.width = Math.min(100, Math.round((rate.usageRatio || 0) * 100)) + "%";
      rateMeta.dataset.paused = String(paused);
      rateMetaText.textContent = paused ? "Paused " + fmtDuration(rate.pauseRemainingMs) : "Rolling " + fmtDuration(rate.windowMs) + " window";
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
        const height = count === 0 ? 2 : Math.max(6, Math.round((count / max) * 50));
        const ageEnd = Math.round((bucketCount - i) * bucketMs);
        const ageStart = Math.round((bucketCount - i - 1) * bucketMs);
        const attrs = count ? ' data-count="' + count + '" data-start="' + ageStart + '" data-end="' + ageEnd + '"' : '';
        return '<div class="rate-bar ' + (count ? "" : "empty") + '" style="height:' + height + 'px"' + attrs + '></div>';
      }).join("");
      rateOldest.textContent = "−" + fmtDuration(rate.windowMs);
      if (rateRpm) {
        const adm60 = (rate.window || []).filter((e) => typeof e.ageMs === "number" && e.ageMs < 60000).length;
        let t = adm60 ? adm60 + " adm / 60s" : "";
        if (paused) t += (t ? " · " : "") + "paused " + fmtDuration(rate.pauseRemainingMs);
        rateRpm.textContent = t;
      }
    }

    function showTooltip(target, html) {
      tooltip.innerHTML = html; tooltip.hidden = false;
      const rect = target.getBoundingClientRect();
      const x = rect.left + window.scrollX + rect.width / 2;
      const y = rect.top + window.scrollY;
      tooltip.style.left = Math.round(x) + "px";
      tooltip.style.top = Math.round(y) + "px";
      let tipRect = tooltip.getBoundingClientRect();
      if (tipRect.left < 8) tooltip.style.left = (Math.round(x) + (8 - tipRect.left)) + "px";
      else if (tipRect.right > window.innerWidth - 8) tooltip.style.left = (Math.round(x) - (tipRect.right - window.innerWidth + 8)) + "px";
      tipRect = tooltip.getBoundingClientRect();
      if (tipRect.top < 8) tooltip.style.top = (Math.round(y) + (8 - tipRect.top)) + "px";
      else if (tipRect.bottom > window.innerHeight - 8) tooltip.style.top = (Math.round(y) - (tipRect.bottom - window.innerHeight + 8)) + "px";
    }
    function hideTooltip() { tooltip.hidden = true; }

    function tooltipForResult(r) {
      return '<div class="tooltip-title">' + esc(r.id) + '</div>'
        + '<div class="tooltip-meta"><span class="badge ' + esc(r.category) + '"><span class="dot"></span>' + esc(CATEGORY_LABEL[r.category] || r.category) + '</span>'
        + (r.status ? '<span class="muted num">HTTP ' + esc(r.status) + '</span>' : '') + '</div>'
        + '<div class="tooltip-row"><span>Latency</span><strong>' + esc(fmtMs(r.ms)) + '</strong></div>'
        + (r.note ? '<div class="tooltip-note">' + esc(r.note) + '</div>' : '');
    }
    function tooltipForRun(item) {
      const total = STACK_ORDER.reduce((s, k) => s + (item.counts[k] || 0), 0);
      const rows = STACK_ORDER.filter((k) => (item.counts[k] || 0) > 0)
        .map((k) => '<div class="tooltip-row"><span><span class="badge-mini" style="background:' + esc(categoryColor(k)) + '"></span>' + esc(CATEGORY_LABEL[k]) + '</span><strong>' + esc(item.counts[k]) + '</strong></div>')
        .join("");
      return '<div class="tooltip-title">' + esc(fmtTime(item.startedAt)) + '</div>'
        + '<div class="tooltip-meta"><span class="muted">' + esc(item.source) + " · " + esc(item.status) + '</span>'
        + (item.durationMs ? '<span class="muted num">' + esc(fmtDuration(item.durationMs)) + '</span>' : '') + '</div>'
        + rows
        + '<div class="tooltip-row" style="margin-top:5px;padding-top:5px;border-top:1px solid var(--border)"><span>Total</span><strong>' + esc(total) + '</strong></div>';
    }
    function tooltipForRateBucket(count, ageStart, ageEnd) {
      return '<div class="tooltip-title" style="font-family:inherit">' + esc(count) + ' admitted</div>'
        + '<div class="tooltip-row"><span>Window age</span><strong>' + esc(fmtDuration(ageStart)) + " – " + esc(fmtDuration(ageEnd)) + ' ago</strong></div>';
    }
    function tooltipForScatterDot(p) {
      return '<div class="tooltip-title">' + esc(p.id) + '</div>'
        + '<div class="tooltip-meta"><span class="badge alive"><span class="dot"></span>Alive</span></div>'
        + '<div class="tooltip-row"><span>AI Index</span><strong>' + esc(p.index) + '</strong></div>'
        + '<div class="tooltip-row"><span>Latency</span><strong>' + esc(fmtMs(p.ms)) + '</strong></div>';
    }

    function renderResultsChart(results) {
      if (!results.length) {
        resultsChart.innerHTML = '<div class="empty">' + (searchQuery || aliasFilter !== "all" ? "No models match your filters." : "No probe results yet — run one to populate this view.") + '</div>';
        resultsAxisMax.textContent = "—";
        return;
      }
      const maxMs = Math.max(1, ...results.map((r) => r.ms || 0));
      resultsAxisMax.textContent = fmtMs(maxMs);

      let html = "";
      if (sortMode === "category") {
        const groups = {};
        for (const r of results) { (groups[r.category] = groups[r.category] || []).push(r); }
        for (const cat of STACK_ORDER) {
          const group = groups[cat];
          if (!group) continue;
          html += '<div class="hbar-group-header"><span class="dot" style="background:' + esc(categoryColor(cat)) + '"></span>' + esc(CATEGORY_LABEL[cat]) + " (" + group.length + ")</div>";
          html += group.map((r, gi) => {
            const ms = typeof r.ms === "number" ? r.ms : 0;
            const pct = ms > 0 ? Math.max(2, Math.round((ms / maxMs) * 100)) : 0;
            const trackClass = ms > 0 ? "" : " empty";
            const fill = ms > 0 ? '<div class="hbar-fill ' + esc(r.category) + '" style="width:' + pct + '%"></div>' : '';
            return '<div class="hbar-row" data-kind="result" data-idx="' + gi + '">'
              + '<span class="hbar-label">' + esc(r.id) + copyBtn(r.id) + aliasChip(r.id) + '</span>'
              + '<div class="hbar-track' + trackClass + '">' + fill + '</div>'
              + '<span class="hbar-value"><span class="badge-mini" style="background:' + esc(categoryColor(r.category)) + '"></span>' + esc(fmtMs(r.ms)) + '</span>'
              + '</div>';
          }).join("");
        }
      } else {
        html = results.map((r, i) => {
          const ms = typeof r.ms === "number" ? r.ms : 0;
          const pct = ms > 0 ? Math.max(2, Math.round((ms / maxMs) * 100)) : 0;
          const trackClass = ms > 0 ? "" : " empty";
          const fill = ms > 0 ? '<div class="hbar-fill ' + esc(r.category) + '" style="width:' + pct + '%"></div>' : '';
          return '<div class="hbar-row" data-kind="result" data-idx="' + i + '">'
            + '<span class="hbar-label">' + esc(r.id) + copyBtn(r.id) + aliasChip(r.id) + '</span>'
            + '<div class="hbar-track' + trackClass + '">' + fill + '</div>'
            + '<span class="hbar-value"><span class="badge-mini" style="background:' + esc(categoryColor(r.category)) + '"></span>' + esc(fmtMs(r.ms)) + '</span>'
            + '</div>';
        }).join("");
      }
      resultsChart.innerHTML = html;
      resultsChart._data = results;
    }

    function renderFastestChart(fastest) {
      if (!fastest.length) { fastestChart.innerHTML = '<div class="empty">No alive models yet.</div>'; return; }
      const max = Math.max(1, ...fastest.map((r) => r.ms || 0));
      fastestChart.innerHTML = fastest.map((r, i) => {
        const pct = Math.max(5, Math.round((r.ms / max) * 100));
        return '<div class="hbar-row" data-kind="fastest" data-idx="' + i + '">'
          + '<span class="hbar-label">' + esc(r.id) + copyBtn(r.id) + aliasChip(r.id) + '</span>'
          + '<div class="hbar-track"><div class="hbar-fill alive" style="width:' + pct + '%"></div></div>'
          + '<span class="hbar-value">' + esc(fmtMs(r.ms)) + '</span>'
          + '</div>';
      }).join("");
      fastestChart._data = fastest;
    }

    function renderHistoryChart(history) {
      const data = [...history].reverse();
      if (!data.length) {
        historyChart.innerHTML = '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="history-axis-text">No retained history yet</text>';
        return;
      }
      const w = 600, h = 170;
      const pad = { top: 10, right: 8, bottom: 24, left: 28 };
      const innerW = w - pad.left - pad.right;
      const innerH = h - pad.top - pad.bottom;
      const totals = data.map((d) => STACK_ORDER.reduce((s, k) => s + (d.counts[k] || 0), 0));
      const maxTotal = Math.max(1, ...totals);
      const ticks = niceTicks(maxTotal, 4);
      const tickMax = ticks[ticks.length - 1];
      const slot = innerW / data.length;
      const barW = Math.max(4, Math.min(26, slot - 4));
      const grid = ticks.map((t) => {
        const y = pad.top + innerH - (t / tickMax) * innerH;
        return '<line class="history-grid-line" x1="' + pad.left + '" x2="' + (w - pad.right) + '" y1="' + y.toFixed(2) + '" y2="' + y.toFixed(2) + '"/>'
          + '<text class="history-axis-text" x="' + (pad.left - 6) + '" y="' + (y + 3).toFixed(2) + '" text-anchor="end">' + t + '</text>';
      }).join("");
      const xAxisIdxs = data.length <= 6 ? data.map((_, i) => i) : [0, Math.floor(data.length / 2), data.length - 1];
      const xLabels = xAxisIdxs.map((i) => {
        const cx = pad.left + slot * (i + 0.5);
        return '<text class="history-axis-text" x="' + cx.toFixed(2) + '" y="' + (h - 6) + '" text-anchor="middle">' + esc(fmtTime(data[i].startedAt)) + '</text>';
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
      const points = (results || []).filter((r) => r.category === "alive" && analysis[r.id]).map((r) => ({ ...r, index: analysis[r.id].intelligenceIndex }));
      scatterPanel.hidden = points.length === 0;
      scatterMeta.textContent = points.length ? points.length + " scored" : "";
      if (!points.length) { scatterChart.innerHTML = ""; scatterChart._data = []; return; }

      const w = 560, h = 190;
      const pad = { top: 18, right: 22, bottom: 38, left: 52 };
      const innerW = w - pad.left - pad.right;
      const innerH = h - pad.top - pad.bottom;
      const yTicks = niceTicks(Math.max(1, ...points.map((p) => p.ms)), 4);
      const yTickMax = yTicks[yTicks.length - 1];
      const toX = (idx) => pad.left + (idx / 100) * innerW;
      const toY = (ms) => pad.top + (ms / yTickMax) * innerH;

      const xGrid = [20, 40, 60, 80, 100].map((v) => {
        const x = toX(v).toFixed(1);
        return '<line class="scatter-grid-line" x1="' + x + '" y1="' + pad.top + '" x2="' + x + '" y2="' + (pad.top + innerH) + '"/>'
          + '<text class="scatter-axis-text" x="' + x + '" y="' + (h - 6) + '" text-anchor="middle">' + v + '</text>';
      }).join("");
      const yGrid = yTicks.map((t) => {
        const y = toY(t).toFixed(1);
        return '<line class="scatter-grid-line" x1="' + pad.left + '" y1="' + y + '" x2="' + (w - pad.right) + '" y2="' + y + '"/>'
          + '<text class="scatter-axis-text" x="' + (pad.left - 6) + '" y="' + (parseFloat(y) + 3).toFixed(1) + '" text-anchor="end">' + esc(fmtMs(t)) + '</text>';
      }).join("");
      const axisLines = '<line class="scatter-axis-line" x1="' + pad.left + '" y1="' + pad.top + '" x2="' + pad.left + '" y2="' + (pad.top + innerH) + '"/>'
        + '<line class="scatter-axis-line" x1="' + pad.left + '" y1="' + (pad.top + innerH) + '" x2="' + (w - pad.right) + '" y2="' + (pad.top + innerH) + '"/>';
      const xLabel = '<text class="scatter-axis-label" x="' + (pad.left + innerW / 2).toFixed(1) + '" y="' + (h - 1) + '" text-anchor="middle">Intelligence Index →</text>';
      const yLabel = '<text class="scatter-axis-label" x="' + (-(pad.top + innerH / 2)).toFixed(1) + '" y="10" text-anchor="middle" transform="rotate(-90)">Latency</text>';
      const dots = points.map((p, i) => {
        const cx = toX(p.index).toFixed(1);
        const cy = toY(p.ms).toFixed(1);
        return '<circle class="scatter-dot" r="5.5" cx="' + cx + '" cy="' + cy + '" fill="var(--alive)" fill-opacity="0.7" stroke="var(--alive)" stroke-width="1.5" stroke-opacity="0.3" data-kind="dot" data-idx="' + i + '"/>';
      }).join("");
      scatterChart.innerHTML = yGrid + xGrid + axisLines + dots + xLabel + yLabel;
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

    function openAliasModal(modelId) {
      selectedAliasTargetModel = modelId;
      const keys = Object.keys(aliasMap).sort((a, b) => a.localeCompare(b));
      const currentAlias = keys.find((key) => aliasMap[key] === modelId) || "";
      aliasModalTarget.innerHTML = "Model target: <strong>" + esc(modelId) + "</strong>"
        + (currentAlias ? '<br><span class="muted" style="font-size:11px">Currently mapped to: <strong>' + esc(currentAlias) + '</strong></span>' : "");
      aliasPresetSelect.innerHTML = ['<option value="">Select existing alias name...</option>']
        .concat(keys.map((key) => '<option value="' + esc(key) + '">' + esc(key) + '</option>')).join("");
      aliasPresetSelect.value = currentAlias || "";
      aliasCustomInput.value = currentAlias || "";
      aliasCustomInput.placeholder = "Type a new alias name...";
      aliasModalBackdrop.hidden = false;
      requestAnimationFrame(() => aliasModalBackdrop.classList.add("open"));
      if (!currentAlias) aliasCustomInput.focus();
    }

    function closeAliasModal() {
      aliasModalBackdrop.classList.remove("open");
      setTimeout(() => { aliasModalBackdrop.hidden = true; selectedAliasTargetModel = ""; }, 180);
    }

    async function persistAliases(nextMap) {
      const res = await fetch("/probe/aliases", {
        method: "PUT", headers: { "Content-Type": "application/json" },
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
      if (entries.length) {
        aliasTableBody.innerHTML = entries.map((entry) => {
          return '<tr>'
            + '<td><span class="alias-name">' + esc(entry.id) + '</span></td>'
            + '<td><span class="alias-target">' + esc(entry.resolved) + '</span></td>'
            + '<td class="alias-actions">'
            + '<button type="button" data-alias-model="' + esc(entry.resolved) + '">Edit</button>'
            + '<button type="button" class="danger" data-remove-alias="' + esc(entry.id) + '">Remove</button>'
            + '</td>'
            + '</tr>';
        }).join("");
      } else {
        aliasTableBody.innerHTML = '<tr><td colspan="3"><div class="empty">No aliases configured.</div></td></tr>';
      }
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
      if (loadingIndicator) loadingIndicator.hidden = true;
      lastState = state;
      const run = state.activeRun || state.latest;
      const counts = run?.counts || { alive: 0, timeout: 0, rate_limited: 0, error: 0, skipped: 0 };
      runBtn.disabled = Boolean(state.activeRun);

      renderLiveBanner(state);

      renderHints(state);
      renderTelemetryRows(state.telemetry?.recent, state.telemetry?.max);

      const status = statusFor(state);
      statusPill.dataset.state = status.state;
      statusLine.textContent = status.text;

      const trafficNote = state.pause ? "probe paused"
        : typeof state.traffic?.quietForMs === "number" ? "quiet " + fmtDuration(state.traffic.quietForMs)
        : "no recent traffic";

      metrics.innerHTML = [
        metric("Alive", counts.alive, "ready models", "alive"),
        metric("Timeout", counts.timeout, "no bytes before timeout", "timeout"),
        metric("Rate limited", counts.rate_limited, "upstream 429", "rate_limited"),
        metric("Error", counts.error, "non-429 failures", "error"),
        metric("Skipped", counts.skipped, "limiter / backpressure", "skipped"),
        metric("Clients", state.traffic?.activeClients ?? 0, trafficNote, state.pause ? "paused" : "clients")
      ].join("");

      renderRate(state.rateLimit);
      renderConfig(state);
      renderAliases(state);

      latestMeta.textContent = run
        ? run.status + " · " + run.source + " · " + fmtTime(run.runStartedAt || run.startedAt) + (run.durationMs ? " · " + fmtDuration(run.durationMs) : "")
        : "";

      const allResults = sortResults(run?.results || [], state.analysis);
      const filtered = filterResults(allResults);
      const aliveResults = allResults.filter((r) => r.category === "alive");
      const maxAliveMs = Math.max(1, ...aliveResults.map((r) => r.ms || 0));

      renderResultsChart(filtered);
      resultsBody.innerHTML = filtered.length
        ? filtered.map((r) => row(r, maxAliveMs)).join("")
        : '<tr><td colspan="6"><div class="empty">' + (searchQuery || aliasFilter !== "all" ? "No models match your filters." : "No probe results yet — run one to populate this view.") + '</div></td></tr>';

      const fastest = aliveResults.slice().sort((a, b) => a.ms - b.ms).slice(0, 10);
      const fastestMax = Math.max(1, ...fastest.map((r) => r.ms || 0));
      fastestMeta.textContent = aliveResults.length ? aliveResults.length + " alive" : "";

      renderFastestChart(fastest);
      fastestBody.innerHTML = fastest.length
        ? fastest.map((r) => '<tr><td><span class="model-id">' + esc(r.id) + copyBtn(r.id) + '</span></td><td>' + aliasChip(r.id) + '</td><td class="latency-cell"><span class="latency"><span class="latency-bar"><span class="latency-bar-fill" style="width:' + Math.max(5, Math.round((r.ms / fastestMax) * 100)) + '%"></span></span><span class="latency-value">' + esc(fmtMs(r.ms)) + '</span></span></td></tr>').join("")
        : '<tr><td colspan="3"><div class="empty">No alive models yet.</div></td></tr>';

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
      document.querySelectorAll('.tabs[data-target="' + target + '"] button').forEach((b) => b.classList.toggle("active", b.dataset.mode === viewMode[target]));
      document.querySelectorAll('[data-view^="' + target + '-"]').forEach((el) => {
        const mode = el.dataset.view.split("-")[1];
        el.hidden = mode !== viewMode[target];
      });
    }

    document.querySelectorAll(".tabs").forEach((el) => {
      el.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-mode]");
        if (!btn) return;
        viewMode[el.dataset.target] = btn.dataset.mode;
        applyView(el.dataset.target);
      });
    });

    filterChips.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      aliasFilter = btn.dataset.filter;
      filterChips.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.filter === aliasFilter));
      if (lastState) render(lastState);
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
        if (data?.[idx]) showTooltip(row, tooltipForResult(data[idx]));
        return;
      }
      if (group) {
        const idx = parseInt(group.dataset.idx, 10);
        if (historyChart._data?.[idx]) showTooltip(group, tooltipForRun(historyChart._data[idx]));
        return;
      }
      if (bucket?.dataset.count) {
        showTooltip(bucket, tooltipForRateBucket(parseInt(bucket.dataset.count, 10), parseInt(bucket.dataset.start, 10), parseInt(bucket.dataset.end, 10)));
        return;
      }
      if (dot) {
        const idx = parseInt(dot.dataset.idx, 10);
        if (scatterChart._data?.[idx]) showTooltip(dot, tooltipForScatterDot(scatterChart._data[idx]));
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

    runBtn.addEventListener("click", async () => {
      runBtn.disabled = true;
      await fetch("/probe/run", { method: "POST" });
      await load();
    });

    document.addEventListener("click", (e) => {
      const copy = e.target.closest("[data-copy]");
      if (copy) { e.stopPropagation(); copyText(copy.dataset.copy); return; }
      const remove = e.target.closest("[data-remove-alias]");
      if (remove) {
        e.stopPropagation();
        const aliasName = remove.dataset.removeAlias;
        if (!aliasName || !confirm("Remove alias '" + aliasName + "'?")) return;
        const nextMap = { ...aliasMap };
        delete nextMap[aliasName];
        persistAliases(nextMap).then(() => { toast("Alias removed"); load(); }).catch((err) => toast(err.message || "Remove failed", "error"));
        return;
      }
      const target = e.target.closest("[data-alias-model]");
      if (target) openAliasModal(target.dataset.aliasModel);
    });

    aliasPresetSelect.addEventListener("change", () => {
      if (aliasPresetSelect.value) aliasCustomInput.value = aliasPresetSelect.value;
      else { aliasCustomInput.value = ""; aliasCustomInput.focus(); }
    });

    aliasCancelBtn.addEventListener("click", closeAliasModal);
    aliasModalBackdrop.addEventListener("click", (e) => { if (e.target === aliasModalBackdrop) closeAliasModal(); });

    aliasApplyBtn.addEventListener("click", async () => {
      const aliasName = aliasCustomInput.value.trim();
      if (!selectedAliasTargetModel) return;
      if (!aliasName) { toast("Alias name is required", "error"); return; }
      aliasApplyBtn.disabled = true;
      try {
        const nextMap = { ...aliasMap };
        Object.keys(nextMap).forEach((key) => { if (nextMap[key] === selectedAliasTargetModel) delete nextMap[key]; });
        nextMap[aliasName] = selectedAliasTargetModel;
        await persistAliases(nextMap);
        toast("Alias applied");
        closeAliasModal();
        await load();
      } catch (err) {
        toast(err.message || "Update failed", "error");
      } finally {
        aliasApplyBtn.disabled = false;
      }
    });

    aliasRemoveBtn.addEventListener("click", async () => {
      if (!selectedAliasTargetModel) return;
      aliasRemoveBtn.disabled = true;
      try {
        const nextMap = { ...aliasMap };
        let removed = false;
        Object.keys(nextMap).forEach((key) => { if (nextMap[key] === selectedAliasTargetModel) { delete nextMap[key]; removed = true; } });
        if (!removed) { toast("No mapping for this model", "error"); return; }
        await persistAliases(nextMap);
        toast("Alias removed");
        closeAliasModal();
        await load();
      } catch (err) {
        toast(err.message || "Remove failed", "error");
      } finally {
        aliasRemoveBtn.disabled = false;
      }
    });

    sortSelect.addEventListener("change", () => { sortMode = sortSelect.value; if (lastState) render(lastState); });

    modelSearch.addEventListener("input", () => {
      searchQuery = modelSearch.value.trim();
      searchWrap.classList.toggle("has-value", !!searchQuery);
      if (lastState) render(lastState);
    });
    searchClear.addEventListener("click", () => {
      modelSearch.value = "";
      searchQuery = "";
      searchWrap.classList.remove("has-value");
      if (lastState) render(lastState);
      modelSearch.focus();
    });

    if (copyTelemetryBtn) {
      copyTelemetryBtn.addEventListener("click", () => {
        const raw = JSON.stringify(lastState?.telemetry?.recent || [], null, 2);
        copyText(raw);
        toast("Telemetry copied");
      });
    }
    if (catalogSearch) {
      catalogSearch.addEventListener("input", () => {
        catalogQuery = catalogSearch.value.trim();
        if (lastCatalog) renderCatalogTable(lastCatalog);
      });
    }
    if (catalogRefreshBtn) {
      catalogRefreshBtn.addEventListener("click", async () => {
        catalogRefreshBtn.disabled = true;
        try {
          const res = await fetch("/probe/catalog/refresh", { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "refresh failed");
          toast("Catalog refreshed (" + (data.count ?? "?") + " models)");
          await loadCatalog();
        } catch (err) {
          toast(err.message || "Refresh failed", "error");
        } finally {
          catalogRefreshBtn.disabled = false;
        }
      });
    }

    applyView("results");
    applyView("fastest");
    applyView("history");

    let fullPollMs = 5000;
    if (typeof EventSource !== "undefined") {
      try {
        const es = new EventSource("/probe/stream");
        fullPollMs = 30000;
        es.onmessage = (ev) => {
          try {
            const p = JSON.parse(ev.data);
            if (p.rateLimit) renderRate(p.rateLimit);
            if (p.telemetry) renderTelemetryRows(p.telemetry, lastState?.telemetry?.max);
            if (p.traffic && lastState) {
              lastState = { ...lastState, traffic: p.traffic, rateLimit: p.rateLimit ?? lastState.rateLimit };
              const trafficNote = lastState.pause ? "probe paused"
                : typeof p.traffic?.quietForMs === "number" ? "quiet " + fmtDuration(p.traffic.quietForMs)
                : "no recent traffic";
              const counts = (lastState.activeRun || lastState.latest)?.counts || { alive: 0, timeout: 0, rate_limited: 0, error: 0, skipped: 0 };
              metrics.innerHTML = [
                metric("Alive", counts.alive, "ready models", "alive"),
                metric("Timeout", counts.timeout, "no bytes before timeout", "timeout"),
                metric("Rate limited", counts.rate_limited, "upstream 429", "rate_limited"),
                metric("Error", counts.error, "non-429 failures", "error"),
                metric("Skipped", counts.skipped, "limiter / backpressure", "skipped"),
                metric("Clients", p.traffic?.activeClients ?? 0, trafficNote, lastState.pause ? "paused" : "clients")
              ].join("");
            }
          } catch (_) { /* ignore */ }
        };
        es.onerror = () => { try { es.close(); } catch (_) { /* */ } };
      } catch (_) { fullPollMs = 5000; }
    }

    load().then(() => loadCatalog()).catch((err) => { statusLine.textContent = err.message; loadingIndicator?.remove(); });
    setInterval(() => load().catch(() => {}), fullPollMs);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load().catch(() => {}); });
    document.addEventListener("keydown", (e) => {
      if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && !e.target.closest("input, select, textarea, button")) {
        e.preventDefault(); runBtn.click();
      }
      if (e.key === "Escape") closeAliasModal();
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.target.closest("input, select, textarea")) {
        e.preventDefault(); modelSearch.focus();
      }
    });
  </script>
</body>
</html>`;
}
