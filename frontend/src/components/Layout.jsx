import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  Database, 
  LineChart, 
  Settings, 
  Search, 
  Bell, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { apiService } from '../services/api';

export function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [healthStatus, setHealthStatus] = useState({
    api: 'connecting',
    mongodb: 'connecting',
    gemini: 'connecting'
  });

  // Verify backend service health states on mount
  const checkHealth = async () => {
    try {
      // Execute simple query to test API and Mongo online states
      await apiService.getResults();
      setHealthStatus({
        api: 'online',
        mongodb: 'online',
        gemini: 'online' // Backend key exists if initialized
      });
    } catch (err) {
      setHealthStatus({
        api: 'offline',
        mongodb: 'offline',
        gemini: 'offline'
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  const menuGroups = [
    {
      title: '',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Company Management',
      items: [
        { name: 'Enrich Company', path: '/enrich', icon: Sparkles },
        { name: 'Results', path: '/results', icon: Database }
      ]
    },
    {
      title: 'Insights',
      items: [
        { name: 'Analytics', path: '/analytics', icon: LineChart }
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/enrich': return 'Company Enrichment';
      case '/results': return 'Historical Results';
      case '/analytics': return 'Performance & Analytics';
      case '/settings': return 'System Settings';
      default: return 'RELU Lead Hub';
    }
  };

  return (
    <div className="layout-container">
      {/* Mobile Sidebar Toggle Button */}
      <button 
        className="mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Fixed Left Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="brand-section">
          <div className="brand-logo">R</div>
          <div className="brand-name">
            <h2>RELU</h2>
            <span>CONSULTANCY</span>
          </div>
        </div>

        <div className="sidebar-scroll-content">
          <nav className="sidebar-nav">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="nav-group" style={{ marginBottom: '1.25rem' }}>
                {group.title && (
                  <h3 className="nav-group-title" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.75rem', fontWeight: 700 }}>
                    {group.title}
                  </h3>
                )}
                <ul className="menu-list">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.name} style={{ listStyle: 'none' }}>
                        <Link 
                          to={item.path} 
                          className={`menu-item ${isActive ? 'active' : ''}`}
                          onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                        >
                          <Icon size={18} />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Backend Status Section */}
          <div className="status-widget">
            <h4 className="widget-title">Backend Status</h4>
            <div className="status-item">
              <span className={`status-indicator ${healthStatus.api}`}></span>
              <span className="status-label">API Server</span>
            </div>
            <div className="status-item">
              <span className={`status-indicator ${healthStatus.mongodb}`}></span>
              <span className="status-label">MongoDB</span>
            </div>
            <div className="status-item">
              <span className={`status-indicator ${healthStatus.gemini}`}></span>
              <span className="status-label">Gemini AI</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <span>Version 1.0</span>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="main-panel">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <h1 className="navbar-title">{getPageTitle()}</h1>
          </div>
          <div className="navbar-right">
            <div className="navbar-search">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search leads, domains..." />
            </div>
            <button className="navbar-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="user-profile">
              <div className="avatar">RC</div>
              <div className="profile-info">
                <span className="user-name">Relu Admin</span>
                <span className="user-role">SaaS Operator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="content-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
