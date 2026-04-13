import React, { useEffect } from 'react';

export type ModalType = 
  | 'quickSession' 
  | 'schedule' 
  | 'workout' 
  | 'athletes' 
  | 'todaySessions' 
  | 'alerts' 
  | 'decisions' 
  | 'notifModal' 
  | 'shortcutsModal' 
  | 'searchModal' 
  | 'execute' 
  | null;

interface LunaModalsProps {
  activeModal: ModalType;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const LunaModals: React.FC<LunaModalsProps> = ({ activeModal, onClose, showToast }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!activeModal) return null;

  const renderContent = () => {
    switch (activeModal) {
      case 'searchModal':
        return (
          <>
            <div className="modal-header">
              <h2>Pesquisa Global</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <input type="text" className="field-input" placeholder="Digite para pesquisar..." autoFocus />
            </div>
          </>
        );
      case 'notifModal':
        return (
          <>
            <div className="modal-header">
              <h2>Notificações</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>5 notificações pendentes</p>
            </div>
          </>
        );
      case 'shortcutsModal':
        return (
          <>
            <div className="modal-header">
              <h2>Atalhos</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>⌘K → Pesquisar</p>
              <p style={{ color: 'var(--muted)' }}>⌘N → Novo Atleta</p>
            </div>
          </>
        );
      case 'athletes':
        return (
          <>
            <div className="modal-header">
              <h2>Atletas Ativos</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>Lista de atletas presentes</p>
            </div>
          </>
        );
      case 'todaySessions':
        return (
          <>
            <div className="modal-header">
              <h2>Sessões de Hoje</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>Detalhe das sessões</p>
            </div>
          </>
        );
      case 'alerts':
        return (
          <>
            <div className="modal-header">
              <h2>Alertas</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>Central de alertas</p>
            </div>
          </>
        );
      case 'quickSession':
        return (
          <>
            <div className="modal-header">
              <h2>Sessão Rápida</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Selecionar Atletas</label>
                <select className="field-select">
                  <option>João Félix</option>
                  <option>Maria Costa</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { onClose(); showToast('A iniciar...'); }}>Iniciar</button>
            </div>
          </>
        );
      case 'schedule':
        return (
          <>
            <div className="modal-header">
              <h2>Agendar Sessão</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Título</label>
                <input className="field-input" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { onClose(); showToast('Agendado'); }}>Agendar</button>
            </div>
          </>
        );
      case 'workout':
        return (
          <>
            <div className="modal-header">
              <h2>Criar Workout</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Nome</label>
                <input className="field-input" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { onClose(); showToast('Workout criado'); }}>Continuar</button>
            </div>
          </>
        );
      case 'execute':
        return (
          <>
            <div className="modal-header">
              <h2>Executar Sessão</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>Preparar live command</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { onClose(); showToast('Live Command iniciado'); }}>Iniciar</button>
            </div>
          </>
        );
      case 'decisions':
        return (
          <>
            <div className="modal-header">
              <h2>Decisões IA</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--white)' }}>Motor de IA...</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {renderContent()}
      </div>
    </div>
  );
};
