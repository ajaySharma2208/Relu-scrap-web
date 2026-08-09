import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  RefreshCw, 
  Download, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  X,
  MapPin,
  Phone,
  Mail,
  Layers,
  Users,
  AlertTriangle,
  MessageSquare,
  Plus
} from 'lucide-react';

export function ResultsList({ companies = [], onDeleteCompany, onRefresh }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterOption, setFilterOption] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDrawerCompany, setSelectedDrawerCompany] = useState(null);
  const [copyStatus, setCopyStatus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageSize = 10;

  // Trigger copy to clipboard helper
  const handleCopy = (key, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Download entire result JSON helper
  const handleDownloadSingleJson = (company) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(company, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const filename = `${(company.companyName || company.websiteName || 'company').toLowerCase().replace(/\s+/g, '_')}_profile.json`;
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export all database entries to JSON helper
  const handleExportAllJson = () => {
    if (companies.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(companies, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `relu_enriched_leads_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 1. Process Filtering
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      // Search matching logic
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        (c.companyName || '').toLowerCase().includes(searchStr) ||
        (c.websiteName || '').toLowerCase().includes(searchStr) ||
        (c.websiteUrl || '').toLowerCase().includes(searchStr) ||
        (c.coreService || '').toLowerCase().includes(searchStr) ||
        (c.emails || []).some(email => email.toLowerCase().includes(searchStr));

      if (!matchesSearch) return false;

      // Filter attributes logic
      if (filterOption === 'all') return true;
      
      const now = new Date();
      const createdDate = c.createdAt ? new Date(c.createdAt) : null;

      if (filterOption === 'today') {
        return createdDate && 
               createdDate.getDate() === now.getDate() &&
               createdDate.getMonth() === now.getMonth() &&
               createdDate.getFullYear() === now.getFullYear();
      }
      
      if (filterOption === 'week') {
        if (!createdDate) return false;
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }

      if (filterOption === 'month') {
        return createdDate && 
               createdDate.getMonth() === now.getMonth() &&
               createdDate.getFullYear() === now.getFullYear();
      }

      if (filterOption === 'emails') {
        return Array.isArray(c.emails) && c.emails.length > 0;
      }

      if (filterOption === 'phone') {
        return !!c.phoneNumber && c.phoneNumber.trim().length > 0;
      }

      if (filterOption === 'missing') {
        return !c.address || !c.phoneNumber || !c.emails || c.emails.length === 0;
      }

      return true;
    });
  }, [companies, searchTerm, filterOption]);

  // 2. Process Sorting
  const sortedCompanies = useMemo(() => {
    const listCopy = [...filteredCompanies];
    if (sortOption === 'newest') {
      listCopy.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortOption === 'oldest') {
      listCopy.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortOption === 'name') {
      listCopy.sort((a, b) => {
        const nameA = (a.companyName || a.websiteName || '').toLowerCase();
        const nameB = (b.companyName || b.websiteName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === 'website') {
      listCopy.sort((a, b) => {
        const urlA = (a.websiteUrl || '').toLowerCase();
        const urlB = (b.websiteUrl || '').toLowerCase();
        return urlA.localeCompare(urlB);
      });
    }
    return listCopy;
  }, [filteredCompanies, sortOption]);

  // 3. Process Pagination
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedCompanies.slice(startIndex, startIndex + pageSize);
  }, [sortedCompanies, currentPage]);

  const totalPages = Math.ceil(sortedCompanies.length / pageSize) || 1;

  const handleDelete = async (id, name) => {
    await onDeleteCompany(id);
  };

  return (
    <div className="crm-results-layout">
      {/* Top Banner Control Panel */}
      <div className="crm-header-row">
        <div className="header-text">
          <h2>Enriched Companies</h2>
          <p>Analyze business intelligence models, contacts, and AI insights across {companies.length} entries.</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh} 
            className="btn-action-outline"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={handleExportAllJson} 
            className="btn-primary"
            disabled={companies.length === 0}
          >
            <Download size={14} />
            <span>Export Database ({companies.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Query controls Grid */}
      <div className="crm-controls-grid">
        <div className="search-control-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by company, website, email, or core service..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filters-row">
          {/* Sorting Selection */}
          <div className="select-wrapper">
            <ArrowUpDown size={14} className="select-icon" />
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="crm-select"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Company Name</option>
              <option value="website">Sort: Website URL</option>
            </select>
          </div>

          {/* Filtering Selection */}
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              value={filterOption} 
              onChange={(e) => {
                setFilterOption(e.target.value);
                setCurrentPage(1);
              }}
              className="crm-select"
            >
              <option value="all">Filter: All Records</option>
              <option value="today">Filter: Added Today</option>
              <option value="week">Filter: Added This Week</option>
              <option value="month">Filter: Added This Month</option>
              <option value="emails">Filter: Has Business Emails</option>
              <option value="phone">Filter: Has Phone Number</option>
              <option value="missing">Filter: Missing Details</option>
            </select>
          </div>
        </div>
      </div>

      {/* CRM Database Table Card */}
      <div className="crm-table-card">
        <div className="table-responsive-scroll">
          {paginatedCompanies.length === 0 ? (
            <div className="table-empty-container">
              <Building2 size={44} className="text-secondary mb-3 animate-pulse" />
              <h3>No Enriched Companies Found</h3>
              <p>Try modifying your search queries, applying different filters, or enrich a new domain URL.</p>
              <button 
                onClick={() => navigate('/enrich')}
                className="btn-primary mt-4"
              >
                <Plus size={16} />
                <span>Enrich New Company</span>
              </button>
            </div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Website URL</th>
                  <th>Core Service</th>
                  <th>Emails</th>
                  <th>Phone Number</th>
                  <th>Date Added</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((c) => {
                  const emailCount = Array.isArray(c.emails) ? c.emails.length : 0;
                  return (
                    <tr key={c._id} className="table-row-hover">
                      <td className="company-info-cell">
                        <div className="logo-initial">
                          {(c.companyName || c.websiteName || 'C')[0].toUpperCase()}
                        </div>
                        <span className="company-title">{c.companyName || c.websiteName}</span>
                      </td>
                      <td className="website-link-cell">
                        <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <span>{c.websiteUrl}</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="desc-cell" title={c.coreService}>
                        {c.coreService ? (c.coreService.slice(0, 50) + (c.coreService.length > 50 ? '...' : '')) : 'Not extracted'}
                      </td>
                      <td>
                        {emailCount > 0 ? (
                          <span className="badge-count green">{emailCount} email(s)</span>
                        ) : (
                          <span className="badge-count gray">None</span>
                        )}
                      </td>
                      <td className="phone-cell">{c.phoneNumber || 'Not found'}</td>
                      <td className="date-cell">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <span className="badge-status online">Active</span>
                      </td>
                      <td className="actions-cell text-right">
                        <button 
                          onClick={() => setSelectedDrawerCompany(c)} 
                          className="btn-table-icon"
                          title="View CRM Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleCopy(c._id, c.websiteUrl)} 
                          className="btn-table-icon"
                          title="Copy Domain URL"
                        >
                          {copyStatus[c._id] ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(c._id, c.companyName || c.websiteName)} 
                          className="btn-table-icon text-danger"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer Navigation */}
        {sortedCompanies.length > 0 && (
          <div className="table-pagination-footer">
            <span className="pagination-text">
              Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to <strong>{Math.min(currentPage * pageSize, sortedCompanies.length)}</strong> of <strong>{sortedCompanies.length}</strong> companies
            </span>
            <div className="pagination-buttons">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-pagination"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <span className="page-indicator">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-pagination"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRM DETAILS SIDE SLIDE-OVER DRAWER */}
      {selectedDrawerCompany && (
        <div className="drawer-overlay-backdrop" onClick={() => setSelectedDrawerCompany(null)}>
          <div className="details-slide-drawer animate-slide-left" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="badge-enriched">AI Enriched Lead</span>
              <button onClick={() => setSelectedDrawerCompany(null)} className="btn-close-drawer">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-scroll-content">
              {/* Profile Identity branding */}
              <div className="drawer-brand-identity">
                <div className="drawer-logo-placeholder">
                  {(selectedDrawerCompany.companyName || selectedDrawerCompany.websiteName || 'C')[0].toUpperCase()}
                </div>
                <div className="drawer-brand-text">
                  <h3>{selectedDrawerCompany.companyName || selectedDrawerCompany.websiteName}</h3>
                  <a href={selectedDrawerCompany.websiteUrl} target="_blank" rel="noopener noreferrer" className="drawer-domain-link">
                    <span>{selectedDrawerCompany.websiteUrl}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* CRM Segment Data Grid */}
              <div className="drawer-insights-list">
                <div className="drawer-insight-item color-teal">
                  <h5>
                    <Layers size={14} />
                    <span>Core Service / Product</span>
                  </h5>
                  <p>{selectedDrawerCompany.coreService || 'No core service description extracted.'}</p>
                </div>

                <div className="drawer-insight-item color-blue">
                  <h5>
                    <Users size={14} />
                    <span>Target Customer</span>
                  </h5>
                  <p>{selectedDrawerCompany.targetCustomer || 'No target customer demographics identified.'}</p>
                </div>

                <div className="drawer-insight-item color-orange">
                  <h5>
                    <AlertTriangle size={14} />
                    <span>Probable Pain Point</span>
                  </h5>
                  <p>{selectedDrawerCompany.probablePainPoint || 'No typical customer pain points identified.'}</p>
                </div>

                <div className="drawer-insight-item contact-section">
                  <h5>Contact Details</h5>
                  <ul className="contact-details-list">
                    <li>
                      <MapPin size={14} className="text-secondary" />
                      <span>{selectedDrawerCompany.address || 'Address not listed'}</span>
                    </li>
                    <li>
                      <Phone size={14} className="text-secondary" />
                      <span>{selectedDrawerCompany.phoneNumber || 'Phone not found'}</span>
                    </li>
                    <li className="align-start">
                      <Mail size={14} className="text-secondary mt-1" />
                      <div className="emails-pills-row">
                        {selectedDrawerCompany.emails && selectedDrawerCompany.emails.length > 0 ? (
                          selectedDrawerCompany.emails.map((e, index) => (
                            <span key={index} className="email-pill">{e}</span>
                          ))
                        ) : (
                          <span className="text-secondary">No emails extracted</span>
                        )}
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Outreach Text hook */}
                {selectedDrawerCompany.outreachOpener && (
                  <div className="drawer-insight-item outreach-box">
                    <h5>
                      <MessageSquare size={14} />
                      <span>Outreach Opener Hook</span>
                    </h5>
                    <p className="opener-quote">"{selectedDrawerCompany.outreachOpener}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions Footer bar */}
            <div className="drawer-footer-actions">
              <button 
                onClick={() => handleCopy('drawer-json', JSON.stringify(selectedDrawerCompany, null, 2))} 
                className="btn-action-neutral flex-1"
              >
                {copyStatus['drawer-json'] ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>Copy JSON</span>
              </button>
              <button 
                onClick={() => handleDownloadSingleJson(selectedDrawerCompany)} 
                className="btn-action-neutral flex-1"
              >
                <Download size={14} />
                <span>Download JSON</span>
              </button>
              <button 
                onClick={() => setSelectedDrawerCompany(null)} 
                className="btn-action-neutral"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
