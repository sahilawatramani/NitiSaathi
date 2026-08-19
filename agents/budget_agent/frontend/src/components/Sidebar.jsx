import { NavLink, useNavigate } from 'react-router-dom';
import { Home, UploadCloud, BarChart3, MessageSquare, Receipt, LogOut, Layers } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">FinAssist AI</div>
      <div className="sidebar-subtitle">Personal Finance Intelligence</div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-title">Wealth & Planning</div>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <Home size={18} /> Financial Command
          </NavLink>
          <NavLink to="/portfolio-xray" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Layers size={18} /> Portfolio X-Ray
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <MessageSquare size={18} /> Life Event Advisor
          </NavLink>
        </div>

        <div className="nav-group">
          <div className="nav-group-title">Tools</div>
          <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UploadCloud size={18} /> Upload CSV
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart3 size={18} /> Analytics
          </NavLink>
          <NavLink to="/tax" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Receipt size={18} /> Tax Report
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'User'}</span>
        </div>
        <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)', marginTop: '4px' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
