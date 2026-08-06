import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Download, 
  Activity, 
  TrendingUp, 
  Users, 
  Globe, 
  Layers,
  Inbox,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export function Analytics({ companies = [] }) {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all'); // today | 7days | 30days | all

  // 1. Filter companies by time period
  const filteredCompanies = useMemo(() => {
    if (timeFilter === 'all') return companies;
    
    const now = new Date();
    return companies.filter(c => {
      if (!c.createdAt) return false;
      const createdDate = new Date(c.createdAt);
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeFilter === 'today') {
        return createdDate.getDate() === now.getDate() &&
               createdDate.getMonth() === now.getMonth() &&
               createdDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === '7days') {
        return diffDays <= 7;
      }
      if (timeFilter === '30days') {
        return diffDays <= 30;
      }
      return true;
    });
  }, [companies, timeFilter]);

  // 2. Summary stats calculations
  const stats = useMemo(() => {
    const total = filteredCompanies.length;
    
    // Count today's enrichments
    const today = new Date();
    const todayCount = filteredCompanies.filter(c => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      return created.getDate() === today.getDate() &&
             created.getMonth() === today.getMonth() &&
             created.getFullYear() === today.getFullYear();
    }).length;

    // Email extraction total
    const totalEmails = filteredCompanies.reduce((acc, curr) => {
      return acc + (Array.isArray(curr.emails) ? curr.emails.length : 0);
    }, 0);

    // Phone extraction total
    const totalPhones = filteredCompanies.reduce((acc, curr) => {
      return acc + (curr.phoneNumber && curr.phoneNumber.trim().length > 0 ? 1 : 0);
    }, 0);

    // Average calculations
    const avgEmails = total > 0 ? (totalEmails / total).toFixed(1) : '0.0';
    const avgPhones = total > 0 ? (totalPhones / total).toFixed(1) : '0.0';

    return { total, todayCount, totalEmails, totalPhones, avgEmails, avgPhones };
  }, [filteredCompanies]);

  // 3. Top Email Domains count
  const topDomains = useMemo(() => {
    const domainCounts = {};
    filteredCompanies.forEach(c => {
      if (Array.isArray(c.emails)) {
        c.emails.forEach(email => {
          const parts = email.split('@');
          if (parts.length === 2) {
            const domain = parts[1].toLowerCase();
            // Ignore common placeholders or free-tier domains for SaaS target
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredCompanies]);

  // 4. Area Chart: Last 7 days processed
  const last7DaysChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = days[d.getDay()];
      dataMap[label] = { day: label, count: 0 };
    }

    filteredCompanies.forEach(c => {
      if (!c.createdAt) return;
      const created = new Date(c.createdAt);
      const label = days[created.getDay()];
      if (dataMap[label]) {
        dataMap[label].count += 1;
      }
    });

    return Object.values(dataMap);
  }, [filteredCompanies]);

  // 5. Bar Chart: Processed by month
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap = {};

    // Populate months of current year
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      dataMap[months[i]] = { name: months[i], count: 0 };
    }

    filteredCompanies.forEach(c => {
      if (!c.createdAt) return;
      const created = new Date(c.createdAt);
      if (created.getFullYear() === currentYear) {
        const label = months[created.getMonth()];
        dataMap[label].count += 1;
      }
    });

    return Object.values(dataMap);
  }, [filteredCompanies]);

  // 6. Line Chart: Email Extraction trends over 7 days
  const emailExtractionTrendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = days[d.getDay()];
      dataMap[label] = { day: label, emails: 0 };
    }

    filteredCompanies.forEach(c => {
      if (!c.createdAt || !Array.isArray(c.emails)) return;
      const created = new Date(c.createdAt);
      const label = days[created.getDay()];
      if (dataMap[label]) {
        dataMap[label].emails += c.emails.length;
      }
    });

    return Object.values(dataMap);
  }, [filteredCompanies]);

  // 7. Pie Chart: Details available vs Missing details
  const pieChartData = useMemo(() => {
    let withDetails = 0;
    let missingDetails = 0;

    filteredCompanies.forEach(c => {
      const hasEmail = Array.isArray(c.emails) && c.emails.length > 0;
      const hasPhone = !!c.phoneNumber && c.phoneNumber.trim().length > 0;
      const hasAddress = !!c.address && c.address.trim().length > 0;

      if (hasEmail || hasPhone || hasAddress) {
        withDetails += 1;
      } else {
        missingDetails += 1;
      }
    });

    return [
      { name: 'With Contact Details', value: withDetails, color: '#22C55E' },
      { name: 'Missing Contact Details', value: missingDetails, color: '#EF4444' }
    ];
  }, [filteredCompanies]);

  // Export Analytics summary helper
  const handleExportAnalyticsJson = () => {
    const payload = {
      filter: timeFilter,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalCompanies: stats.total,
        todayCount: stats.todayCount,
        totalEmails: stats.totalEmails,
        totalPhones: stats.totalPhones,
        avgEmailsPerCompany: stats.avgEmails,
        avgPhonesPerCompany: stats.avgPhones
      },
      topDomains,
      historicalLeads: filteredCompanies.map(c => ({
        companyName: c.companyName || c.websiteName,
        websiteUrl: c.websiteUrl,
        emails: c.emails,
        phone: c.phoneNumber,
        dateAdded: c.createdAt
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `relu_analytics_${timeFilter}_summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Recent leads inside widget
  const recentLeads = useMemo(() => {
    return filteredCompanies.slice(0, 5);
  }, [filteredCompanies]);

  return (
    <div className="analytics-page-layout">
      {/* Top Filter and Export bar */}
      <div className="analytics-header-row">
        <div className="header-titles">
          <h2>Performance & Analytics</h2>
          <p>Real-time analytics computed dynamically from your database records.</p>
        </div>
        <div className="action-buttons-group">
          {/* Time range selector */}
          <div className="btn-group-toggle">
            {['all', 'today', '7days', '30days'].map((filterVal) => (
              <button 
                key={filterVal}
                onClick={() => setTimeFilter(filterVal)}
                className={`btn-toggle-item ${timeFilter === filterVal ? 'active' : ''}`}
              >
                {filterVal === 'all' && 'All Time'}
                {filterVal === 'today' && 'Today'}
                {filterVal === '7days' && '7 Days'}
                {filterVal === '30days' && '30 Days'}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExportAnalyticsJson} 
            className="btn-action-primary"
            disabled={companies.length === 0}
          >
            <Download size={14} />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="results-empty-state-panel" style={{ marginTop: '2rem', padding: '4rem 2rem' }}>
          <div className="illustration-wrapper">
            <Inbox size={48} className="text-secondary animate-pulse" />
          </div>
          <h3>No Data Analytics Available</h3>
          <p>Please enrich some company domains first to unlock beautiful statistics and charts.</p>
          <button 
            onClick={() => navigate('/enrich')}
            className="btn-primary mt-4"
          >
            <span>Go to Enrich Company</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          {/* Summary Metrics Grid */}
          <div className="stats-row-grid">
            <div className="stat-card">
              <div className="card-top">
                <span className="card-label">Total Leads</span>
                <div className="icon-badge blue">
                  <Building2 size={18} />
                </div>
              </div>
              <div className="card-val">{stats.total}</div>
              <div className="card-footer">
                <Activity size={14} className="text-success" />
                <span>Companies Saved</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="card-top">
                <span className="card-label">Enriched Today</span>
                <div className="icon-badge green">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="card-val">{stats.todayCount}</div>
              <div className="card-footer">
                <TrendingUp size={14} className="text-success" />
                <span>Added Today</span>
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
                <span>Total Clean Business E-mails</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="card-top">
                <span className="card-label">Phones Extracted</span>
                <div className="icon-badge orange">
                  <Phone size={18} />
                </div>
              </div>
              <div className="card-val">{stats.totalPhones}</div>
              <div className="card-footer">
                <span>Validated Phone Lines</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Area (Processed over days) & Line (Emails over days) */}
          <div className="charts-row-grid">
            <div className="chart-card-wrapper">
              <div className="chart-header">
                <h3>Companies Processed (Last 7 Days)</h3>
                <p>Volume of domains crawled successfully</p>
              </div>
              <div className="chart-container-height">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7DaysChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#areaColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card-wrapper">
              <div className="chart-header">
                <h3>Email Extraction Trend</h3>
                <p>Volume of contacts matched per day</p>
              </div>
              <div className="chart-container-height">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emailExtractionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="emails" stroke="#4F46E5" strokeWidth={2} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Bar Chart (Monthly count) & Pie Chart (Missing fields) */}
          <div className="charts-row-grid grid-custom-2">
            <div className="chart-card-wrapper flex-2">
              <div className="chart-header">
                <h3>Processed by Month</h3>
                <p>Annual enrichment density breakdown</p>
              </div>
              <div className="chart-container-height">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card-wrapper flex-1">
              <div className="chart-header">
                <h3>Contact Coverage Density</h3>
                <p>Leads with contacts vs missing parameters</p>
              </div>
              <div className="chart-container-height flex-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend list details */}
                <div className="pie-legends-list">
                  {pieChartData.map((entry, idx) => (
                    <div key={idx} className="legend-item">
                      <span className="bullet" style={{ background: entry.color }}></span>
                      <span className="label-text">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Widgets Grid: Recent Leads, Domain Density, and Averages */}
          <div className="widgets-row-grid">
            {/* Top Domains Widget */}
            <div className="widget-card-panel">
              <h3>Top Email Domains</h3>
              <p>Common business domains identified</p>
              <div className="domains-list mt-3">
                {topDomains.length === 0 ? (
                  <div className="empty-panel-desc text-center py-4">No domain statistics available.</div>
                ) : (
                  topDomains.map((item, idx) => (
                    <div key={idx} className="domain-row-item">
                      <div className="domain-left">
                        <Globe size={14} className="text-secondary" />
                        <span className="domain-name font-semibold">{item.domain}</span>
                      </div>
                      <span className="badge-count green">{item.count} lead(s)</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Averages details widget */}
            <div className="widget-card-panel">
              <h3>Lead Contact Ratios</h3>
              <p>Coverage rates across MongoDB database</p>
              
              <div className="ratios-grid mt-4">
                <div className="ratio-item-card">
                  <span className="ratio-title">Emails / Company</span>
                  <span className="ratio-val">{stats.avgEmails}</span>
                  <div className="progress-bar-thin">
                    <div className="progress-fill purple" style={{ width: `${Math.min(Number(stats.avgEmails) * 30, 100)}%` }}></div>
                  </div>
                </div>

                <div className="ratio-item-card mt-3">
                  <span className="ratio-title">Phones / Company</span>
                  <span className="ratio-val">{stats.avgPhones}</span>
                  <div className="progress-bar-thin">
                    <div className="progress-fill orange" style={{ width: `${Math.min(Number(stats.avgPhones) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 5 Recent Enriched leads widget */}
            <div className="widget-card-panel">
              <h3>Top 5 Enriched Leads</h3>
              <p>Quick link to recently crawled sites</p>
              <div className="leads-list mt-3">
                {recentLeads.length === 0 ? (
                  <div className="empty-panel-desc text-center py-4">No recent leads found.</div>
                ) : (
                  recentLeads.map((c) => (
                    <div key={c._id} className="lead-row-item">
                      <div className="lead-left">
                        <span className="lead-initial">{(c.companyName || c.websiteName || 'C')[0].toUpperCase()}</span>
                        <div>
                          <h4 className="lead-name font-semibold">{c.companyName || c.websiteName}</h4>
                          <span className="lead-date text-secondary">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/results')} 
                        className="btn-arrow-icon"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
