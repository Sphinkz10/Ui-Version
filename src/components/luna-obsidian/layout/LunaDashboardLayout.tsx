// src/components/luna-obsidian/layout/LunaDashboardLayout.tsx
import React, { useEffect, useRef, useState } from 'react';

interface LunaDashboardLayoutProps {
  children: React.ReactNode;
  openModal?: (modalId: string) => void;
  showToast?: (msg: string) => void;
}

export const LunaDashboardLayout: React.FC<LunaDashboardLayoutProps> = ({ 
  children, 
  openModal, 
  showToast 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Motor de Partículas LUNA.OS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w: number, h: number;
    let reqId: number;
    const dots: any[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 80; i++) {
      const t = Math.random();
      const col = t > 0.7 ? '255,183,1' : (t > 0.4 ? '32,158,187' : '142,202,230');
      const warm = t > 0.7;
      dots.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * (warm ? 2.5 : 1.5) + 0.5,
        dx: (Math.random() - 0.5) * 0.15, dy: (Math.random() - 0.5) * 0.15,
        o: Math.random() * (warm ? 0.3 : 0.15) + 0.05,
        c: col
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of dots) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.o})`; ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(32,158,187,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      reqId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(reqId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="pts" />
      <div className="bg-base"></div>
      <div className="bg-grad"></div>
      <div className="vignette"></div>

      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-left">
            <button className="menu-mobile-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#023047" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div className="logo-text">LUNA<b>.</b>OS</div>
            </div>
            <div className="workspace-selector">
              <span className="workspace-dot"></span>
              <span className="workspace-name">Equipa Principal</span>
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div className="header-divider"></div>
          </div>
          
          <div className="search-global" onClick={() => openModal?.('searchModal')}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>Pesquisar atletas, sessões...</span>
            <span className="kbd">⌘K</span>
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={() => openModal?.('decisions')}>
              <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="badge-count">3</span>
            </button>
            <button className="icon-btn" onClick={() => openModal?.('notifModal')}>
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="badge-count">5</span>
            </button>
            <button className="icon-btn" onClick={() => showToast?.('Mensagens')}>
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button className="icon-btn" onClick={() => openModal?.('shortcutsModal')}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <div className="header-divider"></div>
            <button className="profile-btn" onClick={() => showToast?.('Perfil do utilizador')}>
              <div className="profile-avatar">TS</div>
              <div className="profile-info">
                <div className="profile-name">Treinador Silva</div>
                <div className="profile-role">Head Coach</div>
              </div>
            </button>
          </div>
        </header>

        {/* BODY & SIDEBAR */}
        <div className="body">
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
            <div className="nav-section">
              <div className="nav-section-title">Navegação</div>
              <button className="nav-item active"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('Navegando para Atletas...'); }}><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Atletas</span><span className="nav-badge">12</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('A abrir Calendário...'); }}><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Calendário</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('A abrir Lab...'); }}><svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span>Lab</span></button>
            </div>
            
            <div className="nav-section">
              <div className="nav-section-title">Ferramentas</div>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('Design Studio não implementado'); }}><svg viewBox="0 0 24 24"><path d="M6.5 6.5L17.5 17.5"/><path d="M21 21l-1-1"/><path d="M3 3l1 1"/><path d="M18 22l4-4"/><path d="M2 6l4-4"/><path d="M3 10l7-7"/><path d="M14 21l7-7"/></svg><span>Design Studio</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); openModal?.('decisions'); }}><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>Data OS</span><span className="nav-badge">3</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('Form Center em breve'); }}><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Form Center</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('Histórico em branco'); }}><svg viewBox="0 0 24 24"><polyline points="13 2 13 9 20 9"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg><span>Histórico</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); showToast?.('Automações indisponíveis'); }}><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Automation</span></button>
              <button className="nav-item" onClick={() => { setSidebarOpen(false); openModal?.('execute'); }}><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span>Live Command</span><span className="nav-badge danger">1</span></button>
            </div>
          </aside>
          
          <div 
            className={`sidebar-drawer-overlay ${sidebarOpen ? 'open' : ''}`} 
            onClick={() => setSidebarOpen(false)}
          ></div>

          {/* O MAIN CONTENT ENTRA AQUI */}
          <main className="content" id="mainContent">
            {children}
          </main>
        </div>
      </div>

      <button className="fab" onClick={() => showToast?.('Menu rápido')}>
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </>
  );
};
