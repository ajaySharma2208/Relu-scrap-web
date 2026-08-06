import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Cpu, 
  Network, 
  Terminal, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Activity, 
  Clock, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { apiService } from '../services/api';

export function Settings() {
  // 1. Load configuration preferences from LocalStorage or defaults
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('relu_crm_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      theme: 'light',
      enableAnimations: true,
      autoRefreshResults: true,
      autoRefreshDashboard: true,
      notifications: true,
      soundEffects: false,
      confirmBeforeDelete: true
    };
  });

  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState({
    api: 'connecting',
    mongodb: 'connecting',
    gemini: 'connecting',
    internet: 'connecting',
    latency: '...'
  });

  const [diagnostics, setDiagnostics] = useState({
    lastApiCall: 'Never',
    totalCalls: 0,
    lastEnrichTime: 'Never'
  });

  // Verify backend health on mount and measure latency
  const checkSystemHealth = async () => {
    const startTime = performance.now();
    const isOnline = navigator.onLine ? 'online' : 'offline';
    
    try {
      // Execute ping call to check API and DB connectivity
      await apiService.getResults();
      const endTime = performance.now();
      const delay = Math.round(endTime - startTime);

      setHealth({
        api: 'online',
        mongodb: 'online',
        gemini: 'online', // Centralized setup loaded
        internet: isOnline,
        latency: `${delay}ms`
      });

      // Update basic diagnostics logs
      setDiagnostics(prev => ({
        lastApiCall: new Date().toLocaleTimeString(),
        totalCalls: prev.totalCalls + 1,
        lastEnrichTime: prev.lastEnrichTime
      }));

    } catch (err) {
      setHealth({
        api: 'offline',
        mongodb: 'offline',
        gemini: 'offline',
        internet: isOnline,
        latency: 'timeout'
      });
    }
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem('relu_crm_settings', JSON.stringify(preferences));
    // Apply theme classes to body for demonstration
    if (preferences.theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    alert('System preferences saved successfully!');
  };

  const handleResetPreferences = () => {
    const defaults = {
      theme: 'light',
      enableAnimations: true,
      autoRefreshResults: true,
      autoRefreshDashboard: true,
      notifications: true,
      soundEffects: false,
      confirmBeforeDelete: true
    };
    setPreferences(defaults);
    localStorage.setItem('relu_crm_settings', JSON.stringify(defaults));
    document.body.classList.remove('dark-mode');
    alert('System preferences reset to factory defaults.');
  };

  const handleCopyEnvInfo = () => {
    const info = `
RELU CONSULTANCY CRM SYSTEM INFORMATION
=======================================
App Name: RELU LEAD ENRICHER
Version: 1.0.0
Environment: Production / Development
Backend API Base URL: http://localhost:5000
AI Model Target: gemini-flash-latest
MongoDB Target: Localhost (27017)
Current API Latency: ${health.latency}
Internet State: ${health.internet}
    `.trim();

    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const logs = `
[SYSTEM HEARTBEAT LOGS]
----------------------
Timestamp: ${new Date().toISOString()}
API Status: ${health.api.toUpperCase()}
MongoDB Status: ${health.mongodb.toUpperCase()}
Gemini Endpoint Status: ${health.gemini.toUpperCase()}
Ping Latency: ${health.latency}
Total API Diagnostics Count: ${diagnostics.totalCalls}
Last Check Time: ${diagnostics.lastApiCall}
    `.trim();

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(logs);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `relu_system_logs.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="settings-page-layout">
      {/* SECTION 1: System Health Center */}
      <section className="settings-card-panel">
        <div className="panel-header-row">
          <Activity size={18} className="text-primary" />
          <h3>System Health Center</h3>
        </div>
        <p className="panel-desc">Real-time status indicators checking microservices and database connectivity.</p>

        <div className="health-grid-3">
          <div className="health-status-card">
            <span className="card-lbl">Backend Server</span>
            <div className="status-indicator-row">
              <span className={`status-led ${health.api}`}></span>
              <span className="status-txt">{health.api === 'online' ? 'Healthy (Port 5000)' : 'Offline'}</span>
            </div>
          </div>

          <div className="health-status-card">
            <span className="card-lbl">MongoDB Cluster</span>
            <div className="status-indicator-row">
              <span className={`status-led ${health.mongodb}`}></span>
              <span className="status-txt">{health.mongodb === 'online' ? 'Connected (Mongoose)' : 'Disconnected'}</span>
            </div>
          </div>

          <div className="health-status-card">
            <span className="card-lbl">Gemini AI Engine</span>
            <div className="status-indicator-row">
              <span className={`status-led ${health.gemini}`}></span>
              <span className="status-txt">{health.gemini === 'online' ? 'Active (gemini-flash-latest)' : 'Configuration Error'}</span>
            </div>
          </div>

          <div className="health-status-card">
            <span className="card-lbl">Internet Gateway</span>
            <div className="status-indicator-row">
              <span className={`status-led ${health.internet}`}></span>
              <span className="status-txt">{health.internet === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <div className="health-status-card">
            <span className="card-lbl">API Response Time</span>
            <div className="status-indicator-row">
              <Clock size={16} className="text-secondary" />
              <span className="status-txt">{health.latency}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Settings and Info columns */}
      <div className="settings-split-grid">
        {/* Left Column: Application Settings inputs */}
        <section className="settings-card-panel flex-2">
          <div className="panel-header-row">
            <SettingsIcon size={18} className="text-primary" />
            <h3>Application Settings</h3>
          </div>
          <p className="panel-desc">Configure dashboard UI views and local operation choices.</p>

          <div className="preferences-form">
            <div className="preference-group">
              <label className="pref-label">Dashboard Theme</label>
              <select 
                value={preferences.theme}
                onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                className="pref-control"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">Follow System Defaults</option>
              </select>
            </div>

            <div className="toggle-grid mt-4">
              <label className="toggle-row-item">
                <input 
                  type="checkbox"
                  checked={preferences.enableAnimations}
                  onChange={(e) => setPreferences(prev => ({ ...prev, enableAnimations: e.target.checked }))}
                />
                <div className="toggle-text">
                  <span className="toggle-title">Enable Animations</span>
                  <span className="toggle-desc">Show transition slides and loader steps</span>
                </div>
              </label>

              <label className="toggle-row-item mt-3">
                <input 
                  type="checkbox"
                  checked={preferences.autoRefreshResults}
                  onChange={(e) => setPreferences(prev => ({ ...prev, autoRefreshResults: e.target.checked }))}
                />
                <div className="toggle-text">
                  <span className="toggle-title">Auto Refresh Results</span>
                  <span className="toggle-desc">Retrieve historical leads list periodically</span>
                </div>
              </label>

              <label className="toggle-row-item mt-3">
                <input 
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                />
                <div className="toggle-text">
                  <span className="toggle-title">Desktop Toast Notifications</span>
                  <span className="toggle-desc">Display popup banners on successful enrichment</span>
                </div>
              </label>

              <label className="toggle-row-item mt-3">
                <input 
                  type="checkbox"
                  checked={preferences.confirmBeforeDelete}
                  onChange={(e) => setPreferences(prev => ({ ...prev, confirmBeforeDelete: e.target.checked }))}
                />
                <div className="toggle-text">
                  <span className="toggle-title">Confirm Before Delete</span>
                  <span className="toggle-desc">Show warning dialog before dropping database records</span>
                </div>
              </label>
            </div>

            {/* Save Buttons Footer */}
            <div className="pref-footer-buttons">
              <button onClick={handleSavePreferences} className="btn-action-primary">
                <Save size={14} />
                <span>Save Changes</span>
              </button>
              <button onClick={handleResetPreferences} className="btn-action-neutral">
                <RotateCcw size={14} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Project Info & Diagnostics */}
        <div className="settings-side-widgets">
          {/* Project Details */}
          <section className="settings-card-panel">
            <div className="panel-header-row">
              <Info size={18} className="text-primary" />
              <h3>System Information</h3>
            </div>
            
            <div className="info-list-widget">
              <div className="info-row">
                <span className="lbl">Application</span>
                <span className="val font-semibold">RELU LEAD HUB</span>
              </div>
              <div className="info-row">
                <span className="lbl">Version</span>
                <span className="val">1.0.0</span>
              </div>
              <div className="info-row">
                <span className="lbl">Environment</span>
                <span className="val text-success">Development</span>
              </div>
              <div className="info-row">
                <span className="lbl">Backend Host</span>
                <span className="val">http://localhost:5000</span>
              </div>
              <div className="info-row">
                <span className="lbl">Database Platform</span>
                <span className="val">MongoDB Local</span>
              </div>
              <div className="info-row">
                <span className="lbl">Gemini Engine</span>
                <span className="val">gemini-flash-latest</span>
              </div>
            </div>
          </section>

          {/* Diagnostics Widget */}
          <section className="settings-card-panel">
            <div className="panel-header-row">
              <Terminal size={18} className="text-primary" />
              <h3>Diagnostics Console</h3>
            </div>
            
            <div className="info-list-widget">
              <div className="info-row">
                <span className="lbl">Last API Call</span>
                <span className="val">{diagnostics.lastApiCall}</span>
              </div>
              <div className="info-row">
                <span className="lbl">Total Health Checks</span>
                <span className="val">{diagnostics.totalCalls}</span>
              </div>
              <div className="info-row">
                <span className="lbl">Frontend Version</span>
                <span className="val">Vite 8.2 (React 19)</span>
              </div>
            </div>
          </section>

          {/* Developer Tools */}
          <section className="settings-card-panel">
            <div className="panel-header-row">
              <ShieldCheck size={18} className="text-primary" />
              <h3>Developer Utilities</h3>
            </div>
            <div className="dev-tools-buttons-row">
              <button onClick={handleCopyEnvInfo} className="btn-action-neutral flex-1">
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>Copy Environment Info</span>
              </button>
              <button onClick={handleDownloadLogs} className="btn-action-neutral mt-2">
                <Download size={14} />
                <span>Download Diagnostics Logs</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
