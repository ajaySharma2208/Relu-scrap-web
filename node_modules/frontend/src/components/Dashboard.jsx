import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Brain,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function Dashboard({ companies = [], healthStatus = { api: 'online', mongodb: 'online', gemini: 'online' } }) {
  const navigate = useNavigate();

  // 1. Calculate dynamic statistics from backend database values
  const stats = useMemo(() => {
    const total = companies.length;
    
    // Count today's enrichments
    const today = new Date();
    const todayCount = companies.filter(c => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      return created.getDate() === today.getDate() &&
             created.getMonth() === today.getMonth() &&
             created.getFullYear() === today.getFullYear();
    }).length;

    // Count total unique emails extracted
    const totalEmails = companies.reduce((acc, curr) => {
      const emailCount = Array.isArray(curr.emails) ? curr.emails.length : 0;
      return acc + emailCount;
    }, 0);

    // Average processing time placeholder (can be linked to logs/performance headers later)
    const avgTime = total > 0 ? '9.4s' : '0.0s';

    return { total, todayCount, totalEmails, avgTime };
  }, [companies]);

  // 2. Generate chart data for "Last 7 days enrichments"
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = {};
    
    // Initialize last 7 days with 0 counts
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = days[d.getDay()];
      dataMap[label] = 0;
    }

    // Populate counts from database
    companies.forEach(c => {
      if (!c.createdAt) return;
      const created = new Date(c.createdAt);
      const label = days[created.getDay()];
      if (dataMap[label] !== undefined) {
        dataMap[label] += 1;
      }
    });

    return Object.keys(dataMap).map(day => ({
      name: day,
      Enrichments: dataMap[day]
    }));
  }, [companies]);

  // 3. Get last 5 enriched companies
  const recentCompanies = useMemo(() => {
    return companies.slice(0, 5);
  }, [companies]);

  // 4. Generate a simulated activity timeline based on real data
  const activities = useMemo(() => {
    return companies.slice(0, 4).map((c, index) => {
      const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';
      return {
        id: c._id || index,
        type: 'enrichment',
        title: `Enriched ${c.companyName || c.websiteName}`,
        desc: `Scraped contacts & AI profile saved for ${c.websiteUrl}`,
        time: dateStr
      };
    });
  }, [companies]);

  return (
    <div className="dashboard-grid-layout">
      {/* Welcome Hero Banner */}
      <section className="welcome-hero-banner">
        <div className="hero-left">
          <span className="badge">Platform Activated</span>
          <h2>RELU CONSULTANCY</h2>
          <p>
            Welcome to the modern Lead Enricher Dashboard. Scrape coordinates, extract validated emails/phones, and generate outreach openers utilizing Gemini models.
          </p>
          <button onClick={() => navigate('/enrich')} className="btn-primary">
            <span>Enrich Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="hero-right">
          <div className="geometric-graphic">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
          </div>
        </div>
      </section>

      {/* Stats Summary Grid */}
      <div className="stats-row-grid">
        <div className="stat-card">
          <div className="card-top">
            <span className="card-label">Total Companies</span>
            <div className="icon-badge blue">
              <Building2 size={18} />
            </div>
          </div>
          <div className="card-val">{stats.total}</div>
          <div className="card-footer">
            <TrendingUp size={14} className="text-success" />
            <span>Database Total Records</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-top">
            <span className="card-label">Today's Enrichments</span>
            <div className="icon-badge green">
              <Calendar size={18} />
            </div>
          </div>
          <div className="card-val">{stats.todayCount}</div>
          <div className="card-footer">
            <Activity size={14} className="text-success" />
            <span>Processed Today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-top">
            <span className="card-label">Emails Extracted</span>
            <div className="icon-badge purple">
              <Mail size={18} />
            </div>
          </div>
          <div className="card-val">{stats.totalEmails}</div>
          <div className="card-footer">
            <CheckCircle2 size={14} className="text-success" />
            <span>Validated Leads</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-top">
            <span className="card-label">Avg. Processing Time</span>
            <div className="icon-badge orange">
              <Clock size={18} />
            </div>
          </div>
          <div className="card-val">{stats.avgTime}</div>
          <div className="card-footer">
            <span>Selective Scraper Heuristic</span>
          </div>
        </div>
      </div>

      {/* Mid row: Chart and Side widgets */}
      <div className="dashboard-mid-row">
        {/* Left: Recharts Area chart */}
        <div className="chart-wrapper-card">
          <div className="chart-header">
            <h3>Enrichment Trends</h3>
            <p>Leads processed over the last 7 days</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnrich" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.8)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Enrichments" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorEnrich)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Actions & Health */}
        <div className="widgets-column">
          {/* Health widget */}
          <div className="widget-card">
            <h3>Backend Connectivity</h3>
            <div className="health-grid">
              <div className="health-box">
                <span className={`indicator ${healthStatus.api}`}></span>
                <span className="label">API Server</span>
              </div>
              <div className="health-box">
                <span className={`indicator ${healthStatus.mongodb}`}></span>
                <span className="label">MongoDB</span>
              </div>
              <div className="health-box">
                <span className={`indicator ${healthStatus.gemini}`}></span>
                <span className="label">Gemini AI</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="widget-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions-row">
              <Link to="/enrich" className="action-btn-link">
                <Sparkles size={16} />
                <span>Enrich URL</span>
              </Link>
              <Link to="/results" className="action-btn-link">
                <Database size={16} />
                <span>Browse Leads</span>
              </Link>
              <Link to="/analytics" className="action-btn-link">
                <TrendingUp size={16} />
                <span>KPI Metrics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent leads and Activity timeline */}
      <div className="dashboard-bottom-row">
        {/* Left: Recent Companies Table */}
        <div className="bottom-table-card">
          <div className="card-header-flex">
            <div>
              <h3>Recent Companies</h3>
              <p>The latest 5 leads added to database</p>
            </div>
            <Link to="/results" className="view-all-link">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive-wrapper">
            {recentCompanies.length === 0 ? (
              <div className="empty-table-state">
                <Building2 size={32} />
                <p>No enriched company records found.</p>
              </div>
            ) : (
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Website URL</th>
                    <th>Date Added</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompanies.map((c) => (
                    <tr key={c._id}>
                      <td className="font-semibold">{c.companyName || c.websiteName}</td>
                      <td className="text-secondary">{c.websiteUrl}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          onClick={() => navigate('/results')} 
                          className="btn-table-action"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Recent activity timeline */}
        <div className="activity-timeline-card">
          <h3>Activity Logs</h3>
          <p>Real-time system events</p>
          <div className="timeline-container">
            {activities.length === 0 ? (
              <div className="empty-timeline-state">
                <Activity size={24} />
                <p>No recent activity events log.</p>
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-bullet"></div>
                  <div className="timeline-content">
                    <span className="time">{act.time}</span>
                    <span className="title">{act.title}</span>
                    <span className="desc">{act.desc}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
