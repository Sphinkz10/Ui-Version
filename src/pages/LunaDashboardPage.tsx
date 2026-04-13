import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useAnalyticsDashboard, useCalendarEvents } from "@/hooks/use-api";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";
import { useDecisions } from "@/hooks/useDecisions";

// ─── CSS EXACTO DO HTML ORIGINAL (prefixado com #luna-root para isolar do Tailwind) ──
const RAW_CSS = `
  #luna-root, #luna-root * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  #luna-root {
    position:fixed; inset:0; overflow:hidden;
    --sky:#8ECAE6; --teal:#209EBB; --navy:#023047; --navy-light:#0a4060; --navy-mid:#0d3550;
    --gold:#FFB701; --orange:#FC8500; --muted:#6A9DB8; --muted-hi:#A8CFE0;
    --danger:#E05555; --success:#4CAF50; --white:#FFFFFF;
    --sidebar-width:240px; --right-col-width:320px; --header-height:72px;
    --transition:all 0.3s cubic-bezier(0.2,0.9,0.4,1.1);
    --surf-bg:    linear-gradient(170deg,rgba(28,66,98,1) 0%,rgba(20,52,80,1) 30%,rgba(13,36,62,1) 65%,rgba(8,22,44,1) 100%);
    --surf-inner: linear-gradient(170deg,rgba(30,72,106,1) 0%,rgba(22,56,86,1) 30%,rgba(15,40,68,1) 65%,rgba(9,25,50,1) 100%);
    --surf-teal:  linear-gradient(170deg,rgba(16,62,84,1) 0%,rgba(10,44,66,1) 35%,rgba(6,26,48,1) 70%,rgba(3,14,30,1) 100%);
    --surf-gold:  linear-gradient(170deg,rgba(48,38,8,1) 0%,rgba(28,24,6,1) 35%,rgba(10,22,38,1) 70%,rgba(4,12,24,1) 100%);
    --surf-amber: linear-gradient(170deg,rgba(50,28,6,1) 0%,rgba(30,18,4,1) 35%,rgba(10,20,36,1) 70%,rgba(4,12,22,1) 100%);
    --surf-danger:linear-gradient(170deg,rgba(56,14,14,1) 0%,rgba(32,8,8,1) 35%,rgba(10,18,32,1) 70%,rgba(3,10,22,1) 100%);
    --surf-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 -2px 5px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.42),0 16px 48px rgba(0,0,0,.48);
  }

  /* FUNDOS */
  #luna-root canvas#pts { position:fixed; inset:0; z-index:1; pointer-events:none; }
  #luna-root .bg-base   { position:fixed; inset:0; z-index:0; background:url('https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1920&q=85') center 35%/cover no-repeat; filter:brightness(0.18) saturate(0.8) hue-rotate(-5deg) contrast(1.1); }
  #luna-root .bg-grad   { position:fixed; inset:0; z-index:2; background:radial-gradient(ellipse at 20% 0%,rgba(32,158,187,0.1) 0%,transparent 45%),radial-gradient(ellipse at 80% 15%,rgba(255,183,1,0.06) 0%,transparent 40%),radial-gradient(ellipse at 50% 100%,rgba(2,48,71,0.95) 0%,transparent 55%); }
  #luna-root .vignette  { position:fixed; inset:0; z-index:3; pointer-events:none; background:radial-gradient(ellipse at center,transparent 30%,rgba(2,48,71,0.5) 75%,rgba(2,48,71,0.85) 100%); }

  /* APP SHELL */
  #luna-root .app { position:relative; z-index:10; height:100vh; display:flex; flex-direction:column; padding-bottom:12px; }

  /* HEADER */
  #luna-root .header { position:sticky; top:0; z-index:50; height:var(--header-height); display:flex; align-items:center; justify-content:space-between; padding:0 28px; gap:24px; border-radius:0 0 24px 24px; overflow:hidden; backdrop-filter:blur(48px) saturate(1.3); background:var(--surf-bg); border-top:none; border-left:1px solid rgba(255,255,255,.04); border-right:1px solid rgba(0,0,0,.15); border-bottom:1px solid rgba(0,0,0,.3); box-shadow:inset 0 -2px 5px rgba(0,0,0,.2),0 6px 20px rgba(0,0,0,.36),0 16px 48px rgba(0,0,0,.38); }
  #luna-root .header::before { content:''; position:absolute; top:0; left:0; right:0; height:42%; background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,transparent 100%); pointer-events:none; }
  #luna-root .header::after  { content:''; position:absolute; bottom:0; left:8%; right:8%; height:2px; background:linear-gradient(90deg,transparent,var(--gold),var(--teal),var(--gold),transparent); background-size:200% 100%; animation:shimmerLine 4s ease-in-out infinite; border-radius:2px 2px 0 0; }
  @keyframes shimmerLine { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

  #luna-root .header-left { display:flex; align-items:center; gap:32px; }
  #luna-root .logo { display:flex; align-items:center; gap:12px; cursor:pointer; transition:var(--transition); }
  #luna-root .logo:hover { transform:scale(1.02); }
  #luna-root .logo-icon { width:40px; height:40px; border-radius:14px; background:linear-gradient(135deg,var(--gold),var(--orange)); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(255,183,1,0.35); }
  #luna-root .logo-icon svg { width:20px; height:20px; stroke:#023047; fill:none; stroke-width:2.5; }
  #luna-root .logo-text { font-family:'Space Grotesk',sans-serif; font-size:1.2rem; font-weight:700; color:var(--white); letter-spacing:2px; }
  #luna-root .logo-text b { color:var(--gold); }
  #luna-root .workspace-selector { display:flex; align-items:center; gap:10px; padding:8px 18px; border-radius:50px; background:rgba(8,55,82,0.5); border:1px solid rgba(142,202,230,0.15); cursor:pointer; transition:var(--transition); }
  #luna-root .workspace-selector:hover { border-color:rgba(255,183,1,0.4); transform:translateY(-1px); }
  #luna-root .workspace-dot { width:8px; height:8px; border-radius:50%; background:var(--teal); box-shadow:0 0 6px rgba(32,158,187,0.6); flex-shrink:0; }
  #luna-root .workspace-name { font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:600; color:var(--white); }
  #luna-root .workspace-selector svg { width:14px; height:14px; stroke:var(--sky); fill:none; }
  #luna-root .header-divider { width:1px; height:32px; background:linear-gradient(180deg,transparent,rgba(255,183,1,0.6),transparent); margin:0 4px; flex-shrink:0; }
  #luna-root .search-global { display:flex; align-items:center; gap:12px; padding:8px 20px; border-radius:60px; background:rgba(2,48,71,0.6); border:1px solid rgba(142,202,230,0.15); width:320px; cursor:pointer; transition:var(--transition); }
  #luna-root .search-global:hover { border-color:rgba(255,183,1,0.4); background:rgba(2,48,71,0.8); }
  #luna-root .search-global svg { width:16px; height:16px; stroke:var(--muted); fill:none; stroke-width:2; flex-shrink:0; }
  #luna-root .search-global span { font-family:'Inter',sans-serif; flex:1; font-size:0.85rem; color:var(--muted); }
  #luna-root .kbd { font-family:'Manrope',sans-serif; font-size:0.65rem; font-weight:700; color:var(--gold); background:rgba(255,183,1,0.1); border:1px solid rgba(255,183,1,0.3); padding:3px 8px; border-radius:6px; }
  #luna-root .header-right { display:flex; align-items:center; gap:16px; }
  #luna-root .icon-btn { position:relative; width:42px; height:42px; border-radius:14px; background:rgba(8,55,82,0.5); border:1px solid rgba(142,202,230,0.15); display:flex; align-items:center; justify-content:center; color:var(--sky); cursor:pointer; transition:var(--transition); }
  #luna-root .icon-btn:hover { border-color:rgba(255,183,1,0.4); color:var(--gold); transform:translateY(-2px); }
  #luna-root .icon-btn svg { width:18px; height:18px; stroke:currentColor; fill:none; stroke-width:2; }
  #luna-root .badge-count { position:absolute; top:-4px; right:-4px; min-width:18px; height:18px; padding:0 5px; border-radius:20px; background:var(--gold); color:var(--navy); font-family:'Manrope',sans-serif; font-size:0.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid var(--navy); }
  #luna-root .profile-btn { display:flex; align-items:center; gap:12px; padding:6px 16px 6px 6px; border-radius:50px; background:rgba(8,55,82,0.5); border:1px solid rgba(142,202,230,0.15); cursor:pointer; transition:var(--transition); }
  #luna-root .profile-btn:hover { border-color:rgba(255,183,1,0.4); transform:translateY(-1px); }
  #luna-root .profile-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--orange)); display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif; font-size:0.8rem; font-weight:800; color:var(--navy); flex-shrink:0; }
  #luna-root .profile-name { font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:600; color:var(--white); line-height:1.2; }
  #luna-root .profile-role { font-family:'Manrope',sans-serif; font-size:0.6rem; font-weight:600; color:var(--muted); line-height:1.2; text-transform:uppercase; letter-spacing:0.5px; }
  #luna-root .menu-mobile-btn { display:none; width:42px; height:42px; border-radius:14px; background:rgba(8,55,82,0.5); border:1px solid rgba(142,202,230,0.15); color:var(--sky); cursor:pointer; align-items:center; justify-content:center; font-size:1.5rem; }

  /* BODY */
  #luna-root .body { display:flex; flex:1; min-height:0; overflow:hidden; }

  /* SIDEBAR */
  #luna-root .sidebar { width:var(--sidebar-width); flex-shrink:0; display:flex; flex-direction:column; padding:20px 12px; margin:14px 0 12px 12px; border-radius:32px; overflow-y:auto; backdrop-filter:blur(44px) saturate(1.2); background:var(--surf-bg); border-top:1px solid rgba(255,255,255,.07); border-left:1px solid rgba(255,255,255,.04); border-right:1px solid rgba(0,0,0,.14); border-bottom:1px solid rgba(0,0,0,.32); box-shadow:inset 0 1px 0 rgba(255,255,255,.05),inset 0 -2px 5px rgba(0,0,0,.22),0 6px 20px rgba(0,0,0,.32),0 14px 44px rgba(0,0,0,.36); position:relative; transition:transform 0.35s cubic-bezier(0.2,0.9,0.4,1.1); }
  #luna-root .sidebar::before { content:''; position:absolute; top:0; left:0; right:0; height:35%; background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,transparent 100%); border-radius:32px 32px 0 0; pointer-events:none; }
  #luna-root .sidebar::-webkit-scrollbar { width:3px; }
  #luna-root .sidebar::-webkit-scrollbar-thumb { background:rgba(32,158,187,0.2); border-radius:2px; }
  #luna-root .nav-section { display:flex; flex-direction:column; gap:6px; margin-bottom:28px; }
  #luna-root .nav-section-title { font-family:'Manrope',sans-serif; font-size:0.65rem; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; padding:0 12px 8px; }
  #luna-root .nav-item { display:flex; align-items:center; gap:14px; padding:10px 12px; border-radius:12px; border:none; background:transparent; border-left:2px solid transparent; cursor:pointer; transition:var(--transition); text-align:left; color:var(--sky); width:100%; }
  #luna-root .nav-item:hover { background:rgba(142,202,230,0.05); transform:translateX(4px); }
  #luna-root .nav-item svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.8; flex-shrink:0; }
  #luna-root .nav-item span { font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:500; color:inherit; flex:1; }
  #luna-root .nav-item.active { background:linear-gradient(135deg,rgba(255,183,1,0.15),rgba(252,133,0,0.05)); border-left-color:var(--gold); color:var(--gold); }
  #luna-root .nav-badge { font-family:'Manrope',sans-serif; font-size:0.6rem; font-weight:700; padding:2px 8px; border-radius:40px; background:rgba(255,183,1,0.15); color:var(--gold); }
  #luna-root .nav-badge.danger { background:rgba(224,85,85,0.15); color:var(--danger); }
  #luna-root .sidebar-drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:39; display:none; }
  #luna-root .sidebar-drawer-overlay.open { display:block; }

  /* CONTENT */
  #luna-root .content { flex:1; overflow-y:auto; padding:32px; min-width:0; }
  #luna-root .content::-webkit-scrollbar { width:6px; }
  #luna-root .content::-webkit-scrollbar-thumb { background:rgba(32,158,187,0.3); border-radius:4px; }

  /* PAGE HEADER */
  #luna-root .page-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px; flex-wrap:wrap; gap:20px; }
  #luna-root .page-title { font-family:'Space Grotesk',sans-serif; font-size:clamp(1.8rem,4vw,2.5rem); font-weight:700; color:var(--white); margin-bottom:6px; letter-spacing:-0.02em; }
  #luna-root .page-sub { font-family:'Inter',sans-serif; font-size:0.9rem; color:var(--muted-hi); }
  #luna-root .page-sub b { color:var(--gold); }
  #luna-root .date-pill { display:flex; align-items:center; gap:10px; padding:8px 20px; border-radius:50px; background:rgba(255,183,1,0.1); border:1px solid rgba(255,183,1,0.25); transition:var(--transition); }
  #luna-root .date-pill:hover { background:rgba(255,183,1,0.15); transform:translateY(-1px); }
  #luna-root .date-pill svg { width:16px; height:16px; stroke:var(--gold); fill:none; stroke-width:2; }
  #luna-root .date-pill span { font-family:'Manrope',sans-serif; font-size:0.75rem; font-weight:700; color:var(--gold); letter-spacing:1px; }

  /* KPI GRID */
  #luna-root .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; margin-bottom:32px; }
  #luna-root .kpi-card { border-radius:28px; padding:22px; transition:var(--transition); cursor:pointer; position:relative; overflow:hidden; background:var(--surf-bg); border-top:1px solid rgba(255,255,255,.12); border-left:1px solid rgba(255,255,255,.05); border-right:1px solid rgba(0,0,0,.25); border-bottom:1px solid rgba(0,0,0,.65); box-shadow:var(--surf-shadow); }
  #luna-root .kpi-card::after  { content:''; position:absolute; top:0; left:0; right:0; height:38%; background:linear-gradient(180deg,rgba(255,255,255,.045) 0%,transparent 100%); border-radius:inherit; pointer-events:none; z-index:0; }
  #luna-root .kpi-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:2px; background:linear-gradient(90deg,transparent,var(--gold),var(--teal),transparent); transform:translateX(-100%); transition:transform 0.6s ease; z-index:1; }
  #luna-root .kpi-card:hover::before { transform:translateX(100%); }
  #luna-root .kpi-card:hover { border-color:rgba(255,183,1,0.4); transform:translateY(-6px); box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -2px 5px rgba(0,0,0,.4),0 20px 48px rgba(0,0,0,.6),0 32px 64px rgba(0,0,0,.5); }
  #luna-root .kpi-card.c-teal   { background:var(--surf-teal);   border-top-color:rgba(32,158,187,.35); }
  #luna-root .kpi-card.c-gold   { background:var(--surf-gold);   border-top-color:rgba(255,183,1,.35); }
  #luna-root .kpi-card.c-amber  { background:var(--surf-amber);  border-top-color:rgba(252,133,0,.35); }
  #luna-root .kpi-card.c-danger { background:var(--surf-danger); border-top-color:rgba(224,85,85,.35); }
  #luna-root .kpi-card.c-teal::before   { background:rgba(32,158,187,.55); transform:none; width:auto; left:12%; right:12%; height:2px; border-radius:0 0 2px 2px; }
  #luna-root .kpi-card.c-gold::before   { background:rgba(255,183,1,.55);  transform:none; width:auto; left:12%; right:12%; height:2px; border-radius:0 0 2px 2px; }
  #luna-root .kpi-card.c-amber::before  { background:rgba(252,133,0,.55);  transform:none; width:auto; left:12%; right:12%; height:2px; border-radius:0 0 2px 2px; }
  #luna-root .kpi-card.c-danger::before { background:rgba(224,85,85,.55);  transform:none; width:auto; left:12%; right:12%; height:2px; border-radius:0 0 2px 2px; }
  #luna-root .kpi-head  { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:relative; z-index:2; }
  #luna-root .kpi-label { font-family:'Manrope',sans-serif; font-size:0.7rem; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; }
  #luna-root .kpi-icon  { width:44px; height:44px; border-radius:16px; display:flex; align-items:center; justify-content:center; }
  #luna-root .kpi-icon svg { width:22px; height:22px; stroke:currentColor; fill:none; stroke-width:1.8; }
  #luna-root .kpi-value { font-family:'Space Grotesk',sans-serif; font-size:2.2rem; font-weight:700; color:var(--white); line-height:1; margin-bottom:8px; position:relative; z-index:2; }
  #luna-root .kpi-value small { font-family:'Inter',sans-serif; font-size:0.9rem; color:var(--muted); font-weight:500; margin-left:6px; }
  #luna-root .kpi-trend { font-family:'Inter',sans-serif; font-size:0.7rem; display:flex; align-items:center; gap:6px; padding:4px 0; position:relative; z-index:2; }
  #luna-root .kpi-trend.up   { color:var(--gold); }
  #luna-root .kpi-trend.flat { color:var(--teal); }
  #luna-root .kpi-trend.down { color:var(--danger); }

  /* SKELETON */
  #luna-root .skeleton { background:linear-gradient(90deg,rgba(142,202,230,0.05) 25%,rgba(142,202,230,0.12) 50%,rgba(142,202,230,0.05) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:20px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* TABS */
  #luna-root .tabs { display:flex; gap:8px; background:rgba(8,55,82,0.5); border:1px solid rgba(142,202,230,0.1); border-radius:60px; padding:6px; width:fit-content; margin-bottom:32px; }
  #luna-root .tab { padding:10px 28px; border-radius:50px; background:transparent; border:none; font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:600; color:var(--sky); cursor:pointer; transition:var(--transition); }
  #luna-root .tab.active { background:linear-gradient(135deg,var(--gold),var(--orange)); color:var(--navy); box-shadow:0 4px 12px rgba(255,183,1,0.3); }
  #luna-root .tab:not(.active):hover { color:var(--white); background:rgba(255,255,255,.06); }

  /* MAIN GRID */
  #luna-root .main-grid { display:grid; grid-template-columns:1fr var(--right-col-width); gap:28px; }

  /* LIVE CARD */
  #luna-root .live-card { border-radius:28px; padding:24px; margin-bottom:28px; transition:var(--transition); position:relative; overflow:hidden; background:var(--surf-danger); border-top:1px solid rgba(224,85,85,.38); border-left:1px solid rgba(255,255,255,.06); border-right:1px solid rgba(0,0,0,.28); border-bottom:1px solid rgba(0,0,0,.65); box-shadow:inset 0 1px 0 rgba(224,85,85,.22),inset 0 -2px 6px rgba(0,0,0,.45),0 6px 18px rgba(0,0,0,.45),0 16px 48px rgba(0,0,0,.48),0 0 28px rgba(224,85,85,.1); }
  #luna-root .live-card::after { content:''; position:absolute; top:0; left:0; right:0; height:38%; background:linear-gradient(180deg,rgba(255,255,255,.035) 0%,transparent 100%); pointer-events:none; }
  #luna-root .live-card:hover { border-top-color:rgba(224,85,85,.6); transform:translateY(-2px); }
  #luna-root .live-head  { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; z-index:1; }
  #luna-root .live-title { display:flex; align-items:center; gap:12px; }
  #luna-root .live-pulse { width:12px; height:12px; border-radius:50%; background:var(--danger); box-shadow:0 0 12px var(--danger); animation:pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
  #luna-root .live-title h3 { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:700; color:var(--white); }
  #luna-root .live-timer { font-family:'Space Grotesk',sans-serif; font-size:1.4rem; font-weight:800; color:var(--danger); }
  #luna-root .live-info { display:flex; align-items:center; gap:20px; position:relative; z-index:1; }
  #luna-root .session-avatar { width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:800; background:linear-gradient(135deg,var(--orange),var(--gold)); color:var(--navy); flex-shrink:0; }
  #luna-root .live-info-text p { font-family:'Inter',sans-serif; font-size:1rem; font-weight:600; color:var(--white); margin-bottom:4px; }
  #luna-root .live-info-text small { font-family:'Manrope',sans-serif; font-size:0.75rem; font-weight:500; color:var(--muted); }
  #luna-root .btn-live { background:var(--danger); border:none; padding:10px 20px; border-radius:50px; color:white; font-family:'Inter',sans-serif; font-weight:700; font-size:0.75rem; display:flex; align-items:center; gap:8px; cursor:pointer; transition:var(--transition); margin-left:auto; }
  #luna-root .btn-live:hover { transform:translateY(-2px); background:#c94444; box-shadow:0 6px 14px rgba(224,85,85,0.4); }

  /* CARD */
  #luna-root .card { border-radius:28px; overflow:hidden; transition:var(--transition); position:relative; background:var(--surf-bg); border-top:1px solid rgba(255,255,255,.15); border-left:1px solid rgba(255,255,255,.06); border-right:1px solid rgba(0,0,0,.22); border-bottom:1px solid rgba(0,0,0,.6); box-shadow:var(--surf-shadow); }
  #luna-root .card:hover { border-top-color:rgba(255,255,255,.22); box-shadow:inset 0 1px 0 rgba(255,255,255,.15),inset 0 -2px 5px rgba(0,0,0,.4),0 12px 32px rgba(0,0,0,.55),0 24px 60px rgba(0,0,0,.5); }
  #luna-root .card-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid rgba(255,255,255,.065); background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,transparent 100%); }
  #luna-root .card-header h3 { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:var(--white); }
  #luna-root .badge { font-family:'Manrope',sans-serif; font-size:0.65rem; font-weight:700; padding:5px 12px; border-radius:50px; }
  #luna-root .badge-teal   { background:rgba(32,158,187,0.15); color:var(--teal);   border:1px solid rgba(32,158,187,0.3); }
  #luna-root .badge-gold   { background:rgba(255,183,1,0.12);  color:var(--gold);   border:1px solid rgba(255,183,1,0.25); }
  #luna-root .badge-orange { background:rgba(252,133,0,0.1);   color:var(--orange); border:1px solid rgba(252,133,0,0.2); }
  #luna-root .badge-danger { background:rgba(224,85,85,0.1);   color:var(--danger); border:1px solid rgba(224,85,85,0.25); }

  /* SESSIONS */
  #luna-root .sessions-list { display:flex; flex-direction:column; }
  #luna-root .session-item { display:flex; align-items:center; gap:16px; padding:16px 24px; border-bottom:1px solid rgba(255,255,255,.04); transition:var(--transition); }
  #luna-root .session-item:hover { background:rgba(40,88,128,0.18); transform:translateX(4px); }
  #luna-root .session-status { width:4px; align-self:stretch; border-radius:4px; flex-shrink:0; }
  #luna-root .session-status.completed   { background:var(--success); }
  #luna-root .session-status.in-progress { background:var(--danger); animation:pulse 1.5s infinite; }
  #luna-root .session-status.next        { background:var(--gold); box-shadow:0 0 8px rgba(255,183,1,0.5); }
  #luna-root .session-status.upcoming    { background:var(--sky); }
  #luna-root .session-time { min-width:60px; text-align:center; flex-shrink:0; }
  #luna-root .session-time-hour { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:700; color:var(--sky); }
  #luna-root .session-time-hour.live     { color:var(--danger); }
  #luna-root .session-time-hour.featured { color:var(--gold); }
  #luna-root .session-time-dur { font-family:'Manrope',sans-serif; font-size:0.6rem; font-weight:600; color:var(--muted); letter-spacing:0.5px; }
  #luna-root .session-info { flex:1; min-width:0; }
  #luna-root .session-name { font-family:'Inter',sans-serif; font-weight:600; color:var(--white); font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #luna-root .session-meta { display:flex; align-items:center; gap:10px; margin-top:4px; }
  #luna-root .session-type { font-family:'Manrope',sans-serif; font-size:0.7rem; font-weight:600; color:var(--sky); text-transform:uppercase; letter-spacing:0.5px; }
  #luna-root .session-actions { display:flex; gap:10px; opacity:0; transform:translateX(10px); transition:var(--transition); }
  #luna-root .session-item:hover .session-actions { opacity:1; transform:translateX(0); }
  #luna-root .action-btn { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; transition:var(--transition); }
  #luna-root .action-btn svg { width:16px; height:16px; stroke:currentColor; fill:none; stroke-width:2; }
  #luna-root .action-play   { background:rgba(32,158,187,0.2); border:1px solid rgba(32,158,187,0.4); color:var(--teal); }
  #luna-root .action-play:hover   { background:rgba(32,158,187,0.4); transform:translateY(-2px); }
  #luna-root .action-cancel { background:rgba(224,85,85,0.15); border:1px solid rgba(224,85,85,0.3); color:var(--danger); }
  #luna-root .action-cancel:hover { background:rgba(224,85,85,0.3); transform:translateY(-2px); }

  /* QA CARD */
  #luna-root .qa-card { border-radius:28px; padding:24px; margin-bottom:28px; transition:var(--transition); position:relative; overflow:hidden; background:var(--surf-bg); border-top:1px solid rgba(255,255,255,.15); border-left:1px solid rgba(255,255,255,.06); border-right:1px solid rgba(0,0,0,.22); border-bottom:1px solid rgba(0,0,0,.6); box-shadow:var(--surf-shadow); }
  #luna-root .qa-card::after { content:''; position:absolute; top:0; left:0; right:0; height:34%; background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,transparent 100%); pointer-events:none; }
  #luna-root .qa-card:hover { border-top-color:rgba(255,255,255,.22); transform:translateY(-2px); }
  #luna-root .qa-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; z-index:1; }
  #luna-root .qa-header h3 { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:700; color:var(--white); }
  #luna-root .qa-list { display:flex; flex-direction:column; gap:12px; position:relative; z-index:1; }
  #luna-root .qa-btn { display:flex; align-items:center; gap:14px; padding:14px; border-radius:20px; background:var(--surf-inner); border-top:1px solid rgba(255,255,255,.17); border-left:3px solid transparent; border-right:1px solid rgba(0,0,0,.18); border-bottom:1px solid rgba(0,0,0,.42); box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 4px 14px rgba(0,0,0,.28); cursor:pointer; transition:var(--transition); text-align:left; width:100%; }
  #luna-root .qa-btn:hover { transform:translateX(6px); box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 7px 22px rgba(0,0,0,.36); }
  #luna-root .qa-btn.gold   { border-left-color:var(--gold); }
  #luna-root .qa-btn.teal   { border-left-color:var(--teal); }
  #luna-root .qa-btn.orange { border-left-color:var(--orange); }
  #luna-root .qa-icon { width:48px; height:48px; border-radius:18px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  #luna-root .qa-icon svg { width:22px; height:22px; stroke:currentColor; fill:none; stroke-width:1.8; }
  #luna-root .qa-icon.gold   { background:rgba(255,183,1,0.12);  color:var(--gold); }
  #luna-root .qa-icon.teal   { background:rgba(32,158,187,0.12); color:var(--teal); }
  #luna-root .qa-icon.orange { background:rgba(252,133,0,0.12);  color:var(--orange); }
  #luna-root .qa-text  { flex:1; }
  #luna-root .qa-title { font-family:'Space Grotesk',sans-serif; font-size:0.85rem; font-weight:700; color:var(--white); margin-bottom:4px; }
  #luna-root .qa-sub   { font-family:'Manrope',sans-serif; font-size:0.7rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; }

  /* ALERT ITEM */
  #luna-root .alert-item { display:flex; gap:14px; padding:14px; border-radius:20px; background:var(--surf-inner); border-top:1px solid rgba(255,255,255,.17); border-left:1px solid rgba(255,255,255,.08); border-right:1px solid rgba(0,0,0,.18); border-bottom:1px solid rgba(0,0,0,.42); box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 3px 10px rgba(0,0,0,.24); margin-bottom:14px; transition:var(--transition); }
  #luna-root .alert-item:hover { transform:translateX(4px); }
  #luna-root .alert-icon { width:40px; height:40px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  #luna-root .alert-icon.danger { background:rgba(224,85,85,0.15); color:var(--danger); }
  #luna-root .alert-icon.gold   { background:rgba(255,183,1,0.15);  color:var(--gold); }
  #luna-root .alert-icon svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.8; }
  #luna-root .alert-text p     { font-family:'Inter',sans-serif; font-size:0.8rem; font-weight:600; color:var(--white); margin-bottom:4px; }
  #luna-root .alert-text small { font-family:'Manrope',sans-serif; font-size:0.65rem; font-weight:500; color:var(--muted); }

  /* DECISION */
  #luna-root .decision-card { background:var(--surf-gold); border-top:1px solid rgba(255,183,1,.2); border-left:1px solid rgba(255,255,255,.05); border-right:1px solid rgba(0,0,0,.22); border-bottom:1px solid rgba(0,0,0,.55); box-shadow:inset 0 1px 0 rgba(255,183,1,.14),0 4px 14px rgba(0,0,0,.32); border-radius:20px; padding:18px; margin-bottom:16px; transition:var(--transition); position:relative; overflow:hidden; }
  #luna-root .decision-card::after { content:''; position:absolute; top:0; left:0; right:0; height:36%; background:linear-gradient(180deg,rgba(255,255,255,.03) 0%,transparent 100%); pointer-events:none; }
  #luna-root .decision-card:hover { border-top-color:rgba(255,183,1,.35); transform:translateX(4px); }
  #luna-root .decision-title { font-family:'Space Grotesk',sans-serif; font-weight:700; color:var(--gold); font-size:0.85rem; margin-bottom:8px; position:relative; z-index:1; }
  #luna-root .decision-desc  { font-family:'Inter',sans-serif; font-size:0.75rem; font-weight:500; color:var(--white); margin-bottom:12px; line-height:1.4; position:relative; z-index:1; }
  #luna-root .decision-actions { display:flex; gap:12px; justify-content:flex-end; position:relative; z-index:1; }

  /* BUTTONS */
  #luna-root .btn { padding:10px 24px; border-radius:50px; font-family:'Inter',sans-serif; font-weight:600; font-size:0.8rem; border:none; cursor:pointer; transition:var(--transition); }
  #luna-root .btn-primary { background:linear-gradient(135deg,var(--gold),var(--orange)); color:var(--navy); }
  #luna-root .btn-primary:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(255,183,1,0.4); }
  #luna-root .btn-secondary { background:var(--surf-inner); border-top:1px solid rgba(255,255,255,.13); border-left:1px solid rgba(255,255,255,.05); border-right:1px solid rgba(0,0,0,.28); border-bottom:1px solid rgba(0,0,0,.6); box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 3px 10px rgba(0,0,0,.3); color:var(--sky); }
  #luna-root .btn-secondary:hover { border-top-color:rgba(255,183,1,.35); color:var(--gold); transform:translateY(-2px); }

  /* FAB */
  #luna-root .fab { position:fixed; bottom:28px; right:28px; width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--orange)); border:none; color:var(--navy); cursor:pointer; box-shadow:0 10px 30px rgba(255,183,1,0.5); transition:var(--transition); z-index:45; display:flex; align-items:center; justify-content:center; }
  #luna-root .fab:hover { transform:scale(1.08); box-shadow:0 15px 35px rgba(255,183,1,0.6); }
  #luna-root .fab svg { width:28px; height:28px; stroke:currentColor; fill:none; stroke-width:2.5; }

  /* MODALS */
  #luna-root .modal-backdrop { position:fixed; inset:0; z-index:100; background:rgba(2,20,30,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity 0.25s; }
  #luna-root .modal-backdrop.open { opacity:1; pointer-events:auto; }
  #luna-root .modal { width:90%; max-width:520px; max-height:85vh; overflow-y:auto; border-radius:32px; background:var(--surf-bg); border-top:1px solid rgba(255,255,255,.12); border-left:1px solid rgba(255,255,255,.05); border-right:1px solid rgba(0,0,0,.25); border-bottom:1px solid rgba(0,0,0,.65); box-shadow:var(--surf-shadow); position:relative; transform:scale(0.95); transition:transform 0.2s; }
  #luna-root .modal::after { content:''; position:absolute; top:0; left:0; right:0; height:34%; background:linear-gradient(180deg,rgba(255,255,255,.045) 0%,transparent 100%); border-radius:32px 32px 0 0; pointer-events:none; }
  #luna-root .modal-backdrop.open .modal { transform:scale(1); }
  #luna-root .modal-header { display:flex; justify-content:space-between; align-items:center; padding:24px 28px; border-bottom:1px solid rgba(255,255,255,.065); background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,transparent 100%); }
  #luna-root .modal-header h2 { font-family:'Space Grotesk',sans-serif; font-size:1.3rem; font-weight:700; color:var(--white); }
  #luna-root .modal-close { width:36px; height:36px; border-radius:12px; background:rgba(142,202,230,0.08); border:1px solid rgba(142,202,230,0.15); color:var(--sky); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--transition); font-size:1rem; }
  #luna-root .modal-close:hover { border-color:rgba(255,183,1,0.3); color:var(--gold); transform:translateY(-2px); }
  #luna-root .modal-body   { padding:24px 28px; }
  #luna-root .modal-footer { padding:20px 28px; border-top:1px solid rgba(255,255,255,.065); display:flex; justify-content:flex-end; gap:14px; }
  #luna-root .field { margin-bottom:20px; }
  #luna-root .field-label { font-family:'Manrope',sans-serif; display:block; font-size:0.7rem; font-weight:800; text-transform:uppercase; color:var(--muted-hi); margin-bottom:8px; }
  #luna-root .field-input, #luna-root .field-select, #luna-root .field-textarea { width:100%; padding:12px 16px; background:rgba(2,48,71,0.6); border:1px solid rgba(142,202,230,0.15); border-left:3px solid var(--teal); border-radius:16px; color:var(--white); font-family:'Inter',sans-serif; font-size:0.85rem; outline:none; transition:var(--transition); }
  #luna-root .field-input:focus, #luna-root .field-select:focus { border-color:var(--gold); border-left-color:var(--gold); box-shadow:0 0 0 3px rgba(255,183,1,0.1); }
  #luna-root .field-select option { background:#0d3550; }

  /* TOAST */
  #luna-root .toast-box { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); z-index:200; display:flex; flex-direction:column; gap:10px; pointer-events:none; align-items:center; }
  #luna-root .toast { background:linear-gradient(135deg,var(--navy-light),var(--navy-mid)); border:1px solid rgba(255,183,1,0.4); color:var(--gold); padding:12px 28px; border-radius:60px; font-family:'Inter',sans-serif; font-weight:600; font-size:0.85rem; animation:fadeUp 0.3s ease; box-shadow:0 8px 20px rgba(0,0,0,0.3); white-space:nowrap; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  /* RESPONSIVE */
  @media (max-width:1200px) { #luna-root .main-grid{gap:20px} #luna-root .kpi-grid{gap:20px} #luna-root .content{padding:24px} }
  @media (max-width:1100px) {
    #luna-root .sidebar { position:fixed; top:calc(var(--header-height) + 12px); left:12px; bottom:12px; transform:translateX(calc(-100% - 24px)); z-index:45; margin:0; }
    #luna-root .sidebar.open { transform:translateX(0); }
    #luna-root .menu-mobile-btn { display:flex; }
    #luna-root .search-global { display:none; }
    #luna-root .main-grid { grid-template-columns:1fr; }
  }
  @media (max-width:768px) {
    #luna-root .content{padding:16px}
    #luna-root .kpi-grid{grid-template-columns:repeat(2,1fr);gap:16px}
    #luna-root .page-title{font-size:1.6rem}
    #luna-root .header{padding:0 16px}
    #luna-root .workspace-selector,#luna-root .header-divider{display:none}
    #luna-root .session-item{padding:12px 16px;gap:12px}
    #luna-root .session-time{min-width:50px}
    #luna-root .session-time-hour{font-size:0.9rem}
    #luna-root .card-header{padding:16px 20px}
    #luna-root .card-header h3{font-size:1rem}
  }
`;

// ─── HELPER ───────────────────────────────────────────────────────────────────
function getSessionCardClasses(session: any) {
  const now   = new Date();
  const start = new Date(session.start);
  const end   = new Date(start.getTime() + session.duration * 60000);
  if (now > end)                  return { statusClass:"completed",   badge:"Concluída", badgeClass:"badge-teal" };
  if (now >= start && now <= end) return { statusClass:"in-progress", badge:"Ao Vivo",   badgeClass:"badge-danger" };
  if (session.status === "next")  return { statusClass:"next",        badge:"Próxima",   badgeClass:"badge-gold" };
  return                                 { statusClass:"upcoming",    badge:"Agendada",  badgeClass:"badge-orange" };
}

type ModalId = 'searchModal'|'notifModal'|'shortcutsModal'|'athletesModal'|'todaySessionsModal'|'alertsModal'|'quickSessionModal'|'scheduleModal'|'workoutModal'|'executeModal'|null;

interface LunaDashboardProps {
  onNavigate?: (page: string) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const LunaDashboardPage: React.FC<LunaDashboardProps> = ({ onNavigate = () => {} }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [openModal, setOpenModal]   = useState<ModalId>(null);
  const [sidebarOpen, setSidebar]   = useState(false);
  const [currentView, setView]      = useState<'today'|'week'|'alerts'|'decisions'>('today');
  const [toasts, setToasts]         = useState<{id:number;msg:string}[]>([]);

  // 1. Setup Supabase Real Data Hooks
  const workspaceId = 'workspace-demo';
  const { decisions: supabaseDecisions } = useDecisions({
    workspaceId, limit: 10, status: 'pending', autoRefresh: true, refreshInterval: 60000
  });
  
  const { 
    attendance, 
    sessions: sessionsKPI, 
    nextSession, 
    alerts: alertsKPI 
  } = useAnalyticsDashboard(workspaceId);
  
  const { alerts: allAlerts } = useDashboardAlerts(workspaceId);

  // Determine date bounds
  const nowStr = new Date().toISOString().split('T')[0];
  const wEnd = new Date(); wEnd.setDate(wEnd.getDate() + 7);
  
  const { events: calendarEventsRaw } = useCalendarEvents(workspaceId, {
    startDate: currentView === 'week' ? nowStr : nowStr,
    endDate: currentView === 'week' ? wEnd.toISOString().split('T')[0] : nowStr
  });

  // 2. Map Hooks Data to Component Variables
  const kpiData = {
    presentAthletes: attendance || { count: 0, total: 0, percentage: 0 },
    sessionsToday:   (sessionsKPI && Object.keys(sessionsKPI).length > 0) ? sessionsKPI : { completed: 0, total: 0, percentage: 0 },
    nextSession:     nextSession || { athlete: "Nenhum", in: "-" },
    alerts:          alertsKPI || { total: 0, critical: 0 }
  };

  const sessions = (calendarEventsRaw || []).map((event: any) => {
    const startObj = new Date(event.start_date);
    const endObj = new Date(event.end_date);
    const duration = Math.round((endObj.getTime() - startObj.getTime()) / 60000);
    const isPast = endObj < new Date();
    const isInProgress = event.status === 'active';
    return {
      id: event.id,
      title: event.title,
      athlete: (event.athlete_ids?.length || 0) + " atletas",
      start: event.start_date,
      duration: duration || 60,
      status: isPast ? 'completed' : (isInProgress ? 'in-progress' : 'upcoming'),
      type: event.workout?.name || 'Geral'
    };
  }).sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Mark first upcoming session as 'next'
  const nextIdx = sessions.findIndex((s: any) => s.status === 'upcoming');
  if(nextIdx !== -1) sessions[nextIdx].status = 'next';

  const alerts = [
    ...(allAlerts?.pain || []).map((a: any) => ({
      id: a.id,
      type: 'injury',
      severity: a.painLevel || 7,
      athlete: a.athleteName,
      description: `Dor nível ${a.painLevel} reportada ${a.location ? `(${a.location})` : ''}`,
      timeAgo: a.timeAgo || 'agora'
    })),
    ...(allAlerts?.pendingForms || []).map((a: any) => ({
      id: a.id,
      type: 'wellness',
      severity: 3,
      athlete: 'Equipa',
      description: `${a.pendingCount} pendentes em ${a.formName}`,
      timeAgo: 'recente'
    }))
  ];

  const decisions = (supabaseDecisions || []).map((d: any) => ({
    id: d.id,
    title: d.title || d.type,
    description: d.description
  }));

  const aiBadge = decisions.length;
  const loadingView = false; // Hooks handle internal loading, we render optimistic

  const toast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(p => [...p, {id, msg}]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800);
  }, []);

  // Keyboard
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenModal(null); setSidebar(false); }
      if ((e.metaKey||e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpenModal('searchModal'); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth > 1100) setSidebar(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Particle canvas (cópia exacta do HTML)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, raf = 0;
    const dots: any[] = [];
    const resize = () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight; };
    window.addEventListener('resize', resize); resize();
    for (let i = 0; i < 80; i++) {
      const t = Math.random();
      const col = t > 0.7 ? '255,183,1' : (t > 0.4 ? '32,158,187' : '142,202,230');
      const warm = t > 0.7;
      dots.push({ x:Math.random()*w, y:Math.random()*h, r:Math.random()*(warm?2.5:1.5)+0.5, dx:(Math.random()-.5)*.15, dy:(Math.random()-.5)*.15, o:Math.random()*(warm?.3:.15)+.05, c:col });
    }
    const draw = () => {
      ctx.clearRect(0,0,w,h);
      for (const p of dots) {
        p.x+=p.dx; p.y+=p.dy;
        if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(${p.c},${p.o})`; ctx.fill();
      }
      for (let i=0;i<dots.length;i++) for (let j=i+1;j<dots.length;j++) {
        const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<120) { ctx.beginPath(); ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y); ctx.strokeStyle=`rgba(32,158,187,${.06*(1-dist/120)})`; ctx.lineWidth=.6; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'short'}).replace('.','');
  const liveSession = sessions.find(s => { const st=new Date(s.start),en=new Date(st.getTime()+s.duration*60000); return now>=st&&now<=en; });
  const liveElapsed = liveSession ? Math.floor((now.getTime()-new Date(liveSession.start).getTime())/60000) : 0;
  const liveTimer   = `${Math.floor(liveElapsed/60)}:${(liveElapsed%60).toString().padStart(2,'0')}`;

  const Modal = ({ id, title, children, footer }: { id: ModalId; title: string; children: React.ReactNode; footer?: React.ReactNode }) => (
    <div className={`modal-backdrop${openModal===id?' open':''}`} onClick={e => { if(e.target===e.currentTarget) setOpenModal(null); }}>
      <div className="modal">
        <div className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={()=>setOpenModal(null)}>✕</button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  const RightCol = () => (
    <div>
      <div className="qa-card">
        <div className="qa-header"><h3>Ações Rápidas</h3></div>
        <div className="qa-list">
          <button className="qa-btn gold" onClick={()=>setOpenModal('quickSessionModal')}>
            <div className="qa-icon gold"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
            <div className="qa-text"><div className="qa-title">Sessão Rápida</div><div className="qa-sub">Walk-in / espontânea</div></div>
          </button>
          <button className="qa-btn teal" onClick={()=>setOpenModal('scheduleModal')}>
            <div className="qa-icon teal"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div className="qa-text"><div className="qa-title">Agendar Sessão</div><div className="qa-sub">Para um atleta específico</div></div>
          </button>
          <button className="qa-btn orange" onClick={()=>setOpenModal('workoutModal')}>
            <div className="qa-icon orange"><svg viewBox="0 0 24 24"><path d="M6.5 6.5L17.5 17.5"/><line x1="2" y1="22" x2="22" y2="2"/></svg></div>
            <div className="qa-text"><div className="qa-title">Novo Workout</div><div className="qa-sub">Criar template de treino</div></div>
          </button>
        </div>
      </div>
      <div className="qa-card">
        <div className="qa-header"><h3>Atenções Críticas</h3><span className="badge badge-danger">{alerts.length}</span></div>
        {alerts.map((a,i) => (
          <div key={i} className="alert-item">
            <div className={`alert-icon ${a.type==='injury'?'danger':'gold'}`}>
              <svg viewBox="0 0 24 24">{a.type==='injury'
                ?<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></>
                :<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              }</svg>
            </div>
            <div className="alert-text">
              <p>{a.type==='injury'?`${a.athlete} reportou ${a.description}`:a.description}</p>
              <small>{a.type==='injury'?`há ${a.timeAgo} · severidade ${a.severity}/10`:a.timeAgo}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: RAW_CSS}} />

      <div id="luna-root">
        {/* Fundos */}
        <div className="bg-base" />
        <canvas ref={canvasRef} id="pts" />
        <div className="bg-grad" />
        <div className="vignette" />

        <div className="app">
          {/* ── HEADER ── */}
          <header className="header">
            <div className="header-left">
              <button className="menu-mobile-btn" onClick={()=>setSidebar(true)}>☰</button>
              <div className="logo">
                <div className="logo-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
                <div className="logo-text">LUNA<b>.</b>OS</div>
              </div>
              <div className="workspace-selector">
                <span className="workspace-dot"/>
                <span className="workspace-name">Equipa Principal</span>
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div className="header-divider"/>
            </div>

            <div className="search-global" onClick={()=>setOpenModal('searchModal')}>
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Pesquisar atletas, sessões...</span>
              <span className="kbd">⌘K</span>
            </div>

            <div className="header-right">
              <button className="icon-btn" onClick={()=>setOpenModal(null)}>
                <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span className="badge-count">{aiBadge}</span>
              </button>
              <button className="icon-btn" onClick={()=>setOpenModal('notifModal')}>
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="badge-count">5</span>
              </button>
              <button className="icon-btn" onClick={()=>toast('Mensagens')}>
                <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </button>
              <button className="icon-btn" onClick={()=>setOpenModal('shortcutsModal')}>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <div className="header-divider"/>
              <button className="profile-btn" onClick={()=>toast('Perfil do utilizador')}>
                <div className="profile-avatar">TS</div>
                <div><div className="profile-name">Treinador Silva</div><div className="profile-role">Head Coach</div></div>
              </button>
            </div>
          </header>

          {/* ── BODY ── */}
          <div className="body">
            {/* SIDEBAR */}
            <aside className={`sidebar${sidebarOpen?' open':''}`}>
              <div className="nav-section">
                <div className="nav-section-title">Navegação</div>
                <button className="nav-item active"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('athletes')}}><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Atletas</span><span className="nav-badge">12</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('calendar')}}><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Calendário</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('lab')}}><svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span>Lab</span></button>
              </div>
              <div className="nav-section">
                <div className="nav-section-title">Ferramentas</div>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('design-studio')}}><svg viewBox="0 0 24 24"><path d="M6.5 6.5L17.5 17.5"/><path d="M21 21l-1-1"/><path d="M3 3l1 1"/><path d="M18 22l4-4"/><path d="M2 6l4-4"/><path d="M3 10l7-7"/><path d="M14 21l7-7"/></svg><span>Design Studio</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('data-os')}}><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>Data OS</span><span className="nav-badge">{aiBadge}</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('form-center')}}><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Form Center</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('form-submissions-history')}}><svg viewBox="0 0 24 24"><polyline points="13 2 13 9 20 9"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg><span>Histórico</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('automation-center')}}><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Automation</span></button>
                <button className="nav-item" onClick={()=>{setSidebar(false);onNavigate('live-command')}}><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span>Live Command</span><span className="nav-badge danger">1</span></button>
              </div>
            </aside>
            <div className={`sidebar-drawer-overlay${sidebarOpen?' open':''}`} onClick={()=>setSidebar(false)}/>

            {/* CONTENT */}
            <main className="content">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Dashboard</h1>
                  <p className="page-sub">Bem-vindo de volta, <b>Treinador Silva</b> · <span>{kpiData?`${kpiData.sessionsToday.completed} de ${kpiData.sessionsToday.total} sessões concluídas hoje`:'carregando...'}</span></p>
                </div>
                <div className="date-pill">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{dateStr}</span>
                </div>
              </div>

              {/* KPI */}
              <div className="kpi-grid">
                {!kpiData ? [0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:130}}/>) : (<>
                  <div className="kpi-card c-teal" onClick={()=>setOpenModal('athletesModal')}>
                    <div className="kpi-head"><span className="kpi-label">Atletas Presentes</span><div className="kpi-icon" style={{background:'rgba(32,158,187,0.15)',color:'var(--teal)'}}><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div></div>
                    <div className="kpi-value">{kpiData.presentAthletes.count}<small>/{kpiData.presentAthletes.total}</small></div>
                    <div className="kpi-trend flat">{kpiData.presentAthletes.percentage}% taxa de presença</div>
                  </div>
                  <div className="kpi-card c-gold" onClick={()=>setOpenModal('todaySessionsModal')}>
                    <div className="kpi-head"><span className="kpi-label">Sessões</span><div className="kpi-icon" style={{background:'rgba(255,183,1,0.15)',color:'var(--gold)'}}><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div>
                    <div className="kpi-value">{kpiData.sessionsToday.completed}<small>/{kpiData.sessionsToday.total}</small></div>
                    <div className="kpi-trend up">{kpiData.sessionsToday.percentage}% concluídas</div>
                  </div>
                  <div className="kpi-card c-amber">
                    <div className="kpi-head"><span className="kpi-label">Próxima Sessão</span><div className="kpi-icon" style={{background:'rgba(252,133,0,0.15)',color:'var(--orange)'}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div>
                    <div className="kpi-value" style={{fontSize:'1.4rem'}}>{kpiData.nextSession.athlete}</div>
                    <div className="kpi-trend up">em {kpiData.nextSession.in}</div>
                  </div>
                  <div className="kpi-card c-danger" onClick={()=>setOpenModal('alertsModal')}>
                    <div className="kpi-head"><span className="kpi-label">Atenções</span><div className="kpi-icon" style={{background:'rgba(224,85,85,0.15)',color:'var(--danger)'}}><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div>
                    <div className="kpi-value">{kpiData.alerts.total}</div>
                    <div className="kpi-trend down">{kpiData.alerts.critical} críticas</div>
                  </div>
                </>)}
              </div>

              {/* TABS */}
              <div className="tabs">
                {(['today','week','alerts','decisions'] as const).map(v => (
                  <button key={v} className={`tab${currentView===v?' active':''}`} onClick={()=>setView(v)}>
                    {{today:'Hoje',week:'Semana',alerts:'Atenções',decisions:'Decisões IA'}[v]}
                  </button>
                ))}
              </div>

              {/* MAIN GRID */}
              {loadingView
                ? <div className="main-grid"><div className="skeleton" style={{height:400}}/><div className="skeleton" style={{height:400}}/></div>
                : <div className="main-grid">
                    {/* LEFT */}
                    <div>
                      {(currentView==='today'||currentView==='week') && (<>
                        {liveSession && currentView==='today' && (
                          <div className="live-card">
                            <div className="live-head">
                              <div className="live-title"><div className="live-pulse"/><h3>Sessão Ao Vivo</h3></div>
                              <div className="live-timer">{liveTimer}</div>
                            </div>
                            <div className="live-info">
                              <div className="session-avatar">{liveSession.athlete.charAt(0)}</div>
                              <div className="live-info-text"><p>{liveSession.athlete} · {liveSession.title}</p><small>Bloco 2/4 · em progresso</small></div>
                              <button className="btn-live" onClick={()=>toast('A retomar sessão...')}><svg width="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Retomar</button>
                            </div>
                          </div>
                        )}
                        <div className="card">
                          <div className="card-header">
                            <h3>Agenda de {currentView==='today'?'Hoje':'Esta Semana'}</h3>
                            <button className="btn btn-secondary" style={{padding:'6px 16px',fontSize:'0.75rem'}} onClick={()=>setOpenModal('todaySessionsModal')}>Ver tudo</button>
                          </div>
                          <div className="sessions-list">
                            {sessions.map((s,i) => {
                              const cl = getSessionCardClasses(s);
                              const h  = new Date(s.start).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'});
                              return (
                                <div key={i} className="session-item">
                                  <div className={`session-status ${cl.statusClass}`}/>
                                  <div className="session-time">
                                    <div className={`session-time-hour${cl.statusClass==='in-progress'?' live':cl.statusClass==='next'?' featured':''}`}>{h}</div>
                                    <div className="session-time-dur">{s.duration} min</div>
                                  </div>
                                  <div className="session-avatar" style={{background:'linear-gradient(135deg,var(--teal),var(--navy-light))',width:40,height:40,fontSize:'0.85rem'}}>{s.athlete.charAt(0)}</div>
                                  <div className="session-info">
                                    <div className="session-name">{s.athlete}</div>
                                    <div className="session-meta"><span className="session-type">{s.title}</span><span className={`badge ${cl.badgeClass}`}>{cl.badge}</span></div>
                                  </div>
                                  <div className="session-actions">
                                    <button className="action-btn action-play" onClick={()=>setOpenModal('executeModal')}><svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg></button>
                                    <button className="action-btn action-cancel" onClick={()=>toast('Cancelar treino?')}><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>)}

                      {currentView==='alerts' && (
                        <div className="card">
                          <div className="card-header"><h3>Central de Alertas</h3></div>
                          <div style={{padding:24}}>
                            {alerts.map((a,i) => (
                              <div key={i} className="alert-item">
                                <div className={`alert-icon ${a.type==='injury'?'danger':'gold'}`}><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg></div>
                                <div className="alert-text"><p>{a.description}</p><small>{a.timeAgo}</small>
                                  <div style={{marginTop:12}}><button className="btn btn-secondary" style={{padding:'6px 16px',fontSize:'0.75rem'}} onClick={()=>toast('Alerta resolvido')}>Resolver</button></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentView==='decisions' && (
                        <div className="card">
                          <div className="card-header"><h3>Decisões Inteligentes (IA)</h3><span className="badge badge-gold">Atualizado a cada 60s</span></div>
                          <div style={{padding:24}}>
                            {decisions.map(d => (
                              <div key={d.id} className="decision-card">
                                <div className="decision-title">{d.title}</div>
                                <div className="decision-desc">{d.description}</div>
                                <div className="decision-actions">
                                  <button className="btn btn-primary" style={{padding:'6px 18px',fontSize:'0.75rem'}} onClick={async()=>{await MOCK_API.applyDecision(d.id);toast(`Decisão ${d.id} aplicada`);const nd=await MOCK_API.getDecisions();setDecisions(nd);setAiBadge(nd.length);}}>Aplicar</button>
                                  <button className="btn btn-secondary" style={{padding:'6px 18px',fontSize:'0.75rem'}} onClick={()=>{setDecisions(p=>p.filter(x=>x.id!==d.id));toast('Descartar');}}>Descartar</button>
                                </div>
                              </div>
                            ))}
                            {decisions.length===0 && <p style={{color:'var(--muted)',textAlign:'center',padding:'32px 0'}}>Sem decisões pendentes ✓</p>}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* RIGHT */}
                    <RightCol/>
                  </div>
              }
            </main>
          </div>
        </div>

        {/* FAB */}
        <button className="fab" onClick={()=>toast('Menu rápido (em breve)')}>
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>

        {/* TOASTS */}
        <div className="toast-box">{toasts.map(t=><div key={t.id} className="toast">{t.msg}</div>)}</div>

        {/* MODAIS */}
        <Modal id="searchModal" title="Pesquisa Global">
          <input type="text" className="field-input" placeholder="Digite para pesquisar..." autoFocus={openModal==='searchModal'}/>
        </Modal>
        <Modal id="notifModal" title="Notificações">
          <p style={{color:'var(--white)'}}>5 notificações pendentes</p>
        </Modal>
        <Modal id="shortcutsModal" title="Atalhos">
          <p style={{color:'var(--white)',marginBottom:8}}>⌘K → Pesquisar</p>
          <p style={{color:'var(--muted)'}}>⌘N → Novo Atleta</p>
        </Modal>
        <Modal id="athletesModal" title="Atletas Ativos">
          <p style={{color:'var(--white)'}}>Lista de atletas presentes</p>
        </Modal>
        <Modal id="todaySessionsModal" title="Sessões de Hoje">
          <p style={{color:'var(--white)'}}>{sessions.length} sessões no total</p>
        </Modal>
        <Modal id="alertsModal" title="Alertas">
          <p style={{color:'var(--white)'}}>Central de alertas</p>
        </Modal>
        <Modal id="quickSessionModal" title="Sessão Rápida"
          footer={<><button className="btn btn-secondary" onClick={()=>setOpenModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={()=>{setOpenModal(null);toast('A iniciar...');}}>Iniciar</button></>}>
          <div className="field"><label className="field-label">Selecionar Atletas</label><select className="field-select"><option>João Félix</option><option>Maria Costa</option></select></div>
        </Modal>
        <Modal id="scheduleModal" title="Agendar Sessão"
          footer={<><button className="btn btn-secondary" onClick={()=>setOpenModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={()=>{setOpenModal(null);toast('Agendado');}}>Agendar</button></>}>
          <div className="field"><label className="field-label">Título</label><input className="field-input" placeholder="Ex: Treino de força"/></div>
          <div className="field"><label className="field-label">Atleta</label><select className="field-select"><option>João Félix</option><option>Maria Costa</option></select></div>
          <div className="field"><label className="field-label">Data</label><input type="date" className="field-input"/></div>
        </Modal>
        <Modal id="workoutModal" title="Criar Workout"
          footer={<><button className="btn btn-secondary" onClick={()=>setOpenModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={()=>{setOpenModal(null);toast('Workout criado');}}>Continuar</button></>}>
          <div className="field"><label className="field-label">Nome</label><input className="field-input" placeholder="Ex: Força A"/></div>
        </Modal>
        <Modal id="executeModal" title="Executar Sessão"
          footer={<><button className="btn btn-secondary" onClick={()=>setOpenModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={()=>{setOpenModal(null);toast('Live Command iniciado');}}>Iniciar</button></>}>
          <p style={{color:'var(--white)'}}>Preparar live command</p>
        </Modal>
      </div>
    </>
  );
};
