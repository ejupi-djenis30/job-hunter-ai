import React from 'react';

export function Sidebar({ view, setView, searchState, totalJobs, username, onLogout, isOpen, onClose, isCollapsed, onToggleCollapse }) {
  // Adjusted NavItem to handle collapsed state
  const NavItem = ({ id, label, icon, badge, specialClass = '' }) => (
    <button
      onClick={() => {
        setView(id);
        if (window.innerWidth < 992) onClose(); // Auto-close on mobile
      }}
      className={`w-100 btn text-start d-flex align-items-center ${isCollapsed ? 'justify-content-center px-0' : 'justify-content-start px-3'} mb-1 py-2 border-0
        ${view === id ? 'bg-primary-subtle text-white' : 'text-secondary hover-bg-white-5'}
        ${specialClass}
      `}
      title={isCollapsed ? label : ''}
      style={{ 
        transition: 'all 0.2s ease',
        borderRadius: 'var(--radius-md)',
        background: view === id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
        color: view === id ? 'var(--primary-glow)' : 'var(--text-secondary)'
      }}
    >
      <i className={`bi ${icon} fs-5 ${isCollapsed ? 'm-0' : 'me-3'}`}></i>
      {!isCollapsed && <span className="fw-medium text-nowrap">{label}</span>}
      {!isCollapsed && badge && (
        <span className="ms-auto badge bg-white text-dark rounded-pill fw-bold" style={{ fontSize: '0.7em' }}>
          {badge}
        </span>
      )}
      {isCollapsed && badge && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light p-1" style={{fontSize: '0.5em'}}>
           <span className="visually-hidden">unread messages</span>
        </span>
      )}
    </button>
  );

  return (
    <div className={`d-flex flex-column h-100 p-3 border-0 rounded-0 sidebar-mobile ${isOpen ? 'show' : ''} d-lg-flex`} 
         style={{ 
             width: isCollapsed ? '80px' : '280px', 
             position: 'fixed', 
             left: 0, 
             top: 0, 
             borderRight: '1px solid var(--border-subtle)', 
             background: 'var(--bg-sidebar)',
             transition: 'width 0.3s ease',
             zIndex: 1040
         }}>
      
      {/* Brand */}
      <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} mb-5 px-2 mt-2`}>
        <div className="d-flex align-items-center">
          <div className="rounded-circle d-flex align-items-center justify-content-center" 
               style={{ 
                 minWidth: 40, width: 40, height: 40, 
                 background: 'linear-gradient(135deg, var(--primary-base), var(--accent-violet))',
                 boxShadow: 'var(--glow-primary)'
               }}>
            <i className="bi bi-search text-white fs-5"></i>
          </div>
          {!isCollapsed && <span className="h5 mb-0 fw-bold tracking-tight text-white ms-3">JobHunter</span>}
        </div>
        
        {/* Desktop Toggle */}
        <button className="btn btn-icon btn-link text-secondary d-none d-lg-block" onClick={onToggleCollapse}>
            <i className={`bi ${isCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
        </button>

        {/* Mobile Close Button */}
        <button className="btn btn-icon btn-link text-secondary d-lg-none" onClick={onClose}>
            <i className="bi bi-x-lg fs-4"></i>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-grow-1 overflow-auto custom-scrollbar no-scrollbar-when-collapsed">
        {!isCollapsed && (
            <div className="small text-uppercase text-tertiary fw-bold mb-3 px-2 tracking-wide" style={{ fontSize: '0.75rem' }}>
            Main Menu
            </div>
        )}
        
        <NavItem 
          id="jobs" 
          label="Dashboard" 
          icon="bi-grid-fill" 
          badge={totalJobs > 0 ? totalJobs : null} 
        />
        
        <NavItem 
          id="schedules" 
          label="Schedules" 
          icon="bi-alarm-fill" 
        />
        
        <NavItem 
          id="history" 
          label="History" 
          icon="bi-clock-history" 
        />

        <div className="my-4 border-top border-white-10"></div>

        {!isCollapsed && (
            <div className="small text-uppercase text-tertiary fw-bold mb-3 px-2 tracking-wide" style={{ fontSize: '0.75rem' }}>
            Actions
            </div>
        )}

        <button
          onClick={() => {
            setView('new');
            if (window.innerWidth < 992) onClose();
          }}
          className={`w-100 btn mb-2 py-2 px-3 d-flex align-items-center ${isCollapsed ? 'justify-content-center px-0' : 'justify-content-center'} fw-bold`}
          title={isCollapsed ? "New Search" : ""}
          style={{ 
            background: 'linear-gradient(135deg, var(--bg-card), var(--bg-sidebar))',
            border: '1px solid var(--border-highlight)',
            color: 'white',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <i className={`bi bi-plus-circle-fill text-primary ${isCollapsed ? 'fs-4 m-0' : 'me-2'}`}></i>
          {!isCollapsed && "New Search"}
        </button>

        {/* Dynamic Search Status */}
        {searchState && (
          <NavItem 
            id="progress" 
            label={
              searchState === 'running' ? 'Searching...' : 
              searchState === 'done' ? 'Results Ready' : 'Search Error'
            }
            icon={
              searchState === 'running' ? 'bi-arrow-clockwise spinner-border-sm' : 
              searchState === 'done' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
            }
            specialClass={
              searchState === 'running' ? 'text-warning' : 
              searchState === 'done' ? 'text-success' : 'text-danger'
            }
          />
        )}
      </div>

      {/* User Footer */}
      <div className="mt-auto pt-3 border-top border-white-10">
        <div className={`d-flex align-items-center p-2 rounded hover-bg-white-5 ${isCollapsed ? 'justify-content-center' : ''}`} style={{ transition: '0.2s' }}>
          <div className={`rounded-circle bg-white bg-opacity-10 d-flex align-items-center justify-content-center ${isCollapsed ? '' : 'me-3'}`} 
               style={{ width: 36, height: 36 }}>
            <i className="bi bi-person-fill text-secondary"></i>
          </div>
          {!isCollapsed && (
            <>
                <div className="flex-grow-1 overflow-hidden">
                    <div className="fw-medium text-white text-truncate" style={{ fontSize: '0.9rem' }}>{username}</div>
                    <div className="small text-secondary" style={{ fontSize: '0.75rem' }}>Online</div>
                </div>
                <button 
                    onClick={onLogout}
                    className="btn btn-link text-secondary p-0 ms-2"
                    title="Sign Out"
                >
                    <i className="bi bi-box-arrow-right fs-5"></i>
                </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
