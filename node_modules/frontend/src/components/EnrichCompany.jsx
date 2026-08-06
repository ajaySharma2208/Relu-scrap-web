import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Layers, 
  Users, 
  AlertTriangle,
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Building,
  CheckCircle,
  Clock
} from 'lucide-react';

export function EnrichCompany({ 
  onEnrich, 
  isLoading, 
  currentStep,
  error,
  setError,
  enrichedResult,
  setEnrichedResult,
  enrichingName,
  setEnrichingName,
  enrichingUrl,
  setEnrichingUrl
}) {
  const [copyStatus, setCopyStatus] = useState({});

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
  const handleDownloadJson = () => {
    if (!enrichedResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(enrichedResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const filename = `${(enrichedResult.companyName || enrichedResult.websiteName || 'company').toLowerCase().replace(/\s+/g, '_')}_profile.json`;
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Pipeline stages definition
  const pipelineStages = [
    { id: 1, label: 'Connecting...', percentage: 10 },
    { id: 2, label: 'Checking robots.txt', percentage: 20 },
    { id: 3, label: 'Finding sitemap.xml', percentage: 30 },
    { id: 4, label: 'Selecting relevant pages', percentage: 40 },
    { id: 5, label: 'Scraping pages', percentage: 50 },
    { id: 6, label: 'Cleaning HTML', percentage: 60 },
    { id: 7, label: 'Extracting contacts', percentage: 70 },
    { id: 8, label: 'Generating AI insights', percentage: 80 },
    { id: 9, label: 'Saving into MongoDB', percentage: 90 },
    { id: 10, label: 'Completed', percentage: 100 }
  ];

  const currentStageInfo = pipelineStages.find(s => s.id === currentStep) || pipelineStages[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enrichingName.trim() || !enrichingUrl.trim()) return;

    if (setError) setError(null);
    if (setEnrichedResult) setEnrichedResult(null);

    try {
      await onEnrich(enrichingName.trim(), enrichingUrl.trim());
    } catch (err) {
      console.error(err);
      if (setError) {
        setError(err.message || 'An unexpected error occurred during company data enrichment.');
      }
    }
  };

  return (
    <div className="enrich-two-column-layout">
      {/* LEFT COLUMN: Input Form & Progress Steps */}
      <div className="input-column-card">
        <div className="form-header">
          <span className="badge-glow">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span>Gemini AI Engine Powered</span>
          </span>
          <h2>AI Company Enrichment</h2>
          <p>Scrape, clean, and enrich any business website URL with deep CRM insights in seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="enrich-form">
          <div className="input-group">
            <label className="input-label">Website Name</label>
            <input 
              type="text" 
              placeholder="e.g. Relu Consultancy" 
              className="form-control"
              value={enrichingName}
              onChange={(e) => setEnrichingName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Website URL</label>
            <input 
              type="text" 
              placeholder="e.g. https://reluconsultancy.com" 
              className="form-control"
              value={enrichingUrl}
              onChange={(e) => setEnrichingUrl(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-enrich-submit-gradient" 
            disabled={isLoading || !enrichingName.trim() || !enrichingUrl.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner-border animate-spin"></span>
                <span>Enriching Lead...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Enrich Company</span>
              </>
            )}
          </button>
        </form>

        {/* Error Alert Display */}
        {error && (
          <div className="alert-error-card">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="alert-content">
              <h4>Enrichment Interrupted</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Live Enrichment Pipeline Status Loader */}
        {isLoading && (
          <div className="live-loader-card">
            <div className="progress-bar-header">
              <span className="stage-name">{currentStageInfo.label}</span>
              <span className="percentage-val">{currentStageInfo.percentage}%</span>
            </div>
            
            {/* Fluid Progress Bar */}
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${currentStageInfo.percentage}%` }}
              ></div>
            </div>

            {/* Stepper Grid Layout */}
            <div className="stepper-list">
              {pipelineStages.map((stage) => {
                const isActive = currentStep === stage.id;
                const isCompleted = currentStep > stage.id;
                return (
                  <div 
                    key={stage.id} 
                    className={`stepper-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  >
                    <div className="stepper-icon-circle">
                      {isCompleted ? <CheckCircle size={12} /> : <span>{stage.id}</span>}
                    </div>
                    <span className="stepper-label">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Real-Time Results / Empty State */}
      <div className="results-column-container">
        {!isLoading && !enrichedResult ? (
          <div className="results-empty-state-panel">
            <div className="illustration-wrapper">
              <Building size={48} className="text-secondary animate-pulse" />
              <Sparkles size={20} className="stars stars-1" />
              <Sparkles size={16} className="stars stars-2" />
            </div>
            <h3>Waiting for Lead Input</h3>
            <p>Your AI enriched company profile, contact details, target audience, and outreach email opener will appear here.</p>
          </div>
        ) : isLoading ? (
          <div className="skeleton-result-card">
            <div className="skeleton-header">
              <div className="skeleton-circle"></div>
              <div className="skeleton-lines-box">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line subtitle"></div>
              </div>
            </div>
            <div className="skeleton-grid">
              <div className="skeleton-block"></div>
              <div className="skeleton-block"></div>
              <div className="skeleton-block"></div>
              <div className="skeleton-block"></div>
            </div>
          </div>
        ) : (
          <div className="result-card-wrapper animate-slide-up">
            <div className="card-header-flex">
              <span className="enriched-pill">
                <CheckCircle size={12} />
                <span>AI Processed</span>
              </span>
              <span className="date-timestamp">
                <Clock size={12} />
                <span>{new Date().toLocaleDateString()}</span>
              </span>
            </div>

            {/* Branding Identity */}
            <div className="branding-section">
              <div className="logo-placeholder">
                {(enrichedResult.companyName || enrichedResult.websiteName || 'C')[0].toUpperCase()}
              </div>
              <div className="branding-text">
                <h3>{enrichedResult.companyName || enrichedResult.websiteName}</h3>
                <span className="domain-txt">{enrichedResult.websiteUrl}</span>
              </div>
            </div>

            {/* Structured Insights Grid */}
            <div className="insights-grid">
              <div className="insight-section border-teal">
                <h4>
                  <Layers size={14} />
                  <span>Core Service / Product</span>
                </h4>
                <p>{enrichedResult.coreService || 'No core service description extracted.'}</p>
              </div>

              <div className="insight-section border-blue">
                <h4>
                  <Users size={14} />
                  <span>Target Customer</span>
                </h4>
                <p>{enrichedResult.targetCustomer || 'No target customer demographics identified.'}</p>
              </div>

              <div className="insight-section border-orange">
                <h4>
                  <AlertTriangle size={14} />
                  <span>Probable Pain Point</span>
                </h4>
                <p>{enrichedResult.probablePainPoint || 'No typical customer pain points identified.'}</p>
              </div>

              <div className="insight-section contact-details-box">
                <h4>Contact Details</h4>
                <ul className="contact-list">
                  <li>
                    <MapPin size={14} />
                    <span>{enrichedResult.address || 'Address not listed'}</span>
                  </li>
                  <li>
                    <Phone size={14} />
                    <span>{enrichedResult.phoneNumber || 'Phone not found'}</span>
                  </li>
                  <li className="align-start">
                    <Mail size={14} className="mt-1" />
                    <div className="emails-group">
                      {enrichedResult.emails && enrichedResult.emails.length > 0 ? (
                        enrichedResult.emails.map((e, index) => (
                          <span key={index} className="email-pill">{e}</span>
                        ))
                      ) : (
                        <span className="text-secondary">No emails extracted</span>
                      )}
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Outreach Suggested Hook Card */}
            {enrichedResult.outreachOpener && (
              <div className="outreach-hook-box">
                <div className="outreach-header">
                  <Globe size={14} className="text-primary" />
                  <h5>Outreach Opener</h5>
                </div>
                <p className="opener-quote">"{enrichedResult.outreachOpener}"</p>
              </div>
            )}

            {/* Actions Footer row */}
            <div className="actions-button-grid">
              <button 
                onClick={() => handleCopy('email', enrichedResult.emails?.join(', ') || '')} 
                className="btn-action-outline"
                disabled={!enrichedResult.emails || enrichedResult.emails.length === 0}
              >
                {copyStatus['email'] ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>Copy Emails</span>
              </button>

              <button 
                onClick={() => handleCopy('phone', enrichedResult.phoneNumber || '')} 
                className="btn-action-outline"
                disabled={!enrichedResult.phoneNumber}
              >
                {copyStatus['phone'] ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>Copy Phone</span>
              </button>

              <button 
                onClick={() => handleCopy('outreach', enrichedResult.outreachOpener || '')} 
                className="btn-action-outline"
                disabled={!enrichedResult.outreachOpener}
              >
                {copyStatus['outreach'] ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>Copy Opener</span>
              </button>

              <button 
                onClick={() => handleCopy('json', JSON.stringify(enrichedResult, null, 2))} 
                className="btn-action-outline"
              >
                {copyStatus['json'] ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>Copy JSON</span>
              </button>

              <button 
                onClick={handleDownloadJson} 
                className="btn-action-outline"
              >
                <Download size={14} />
                <span>Download JSON</span>
              </button>

              <a 
                href={enrichedResult.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-action-outline anchor-btn"
              >
                <ExternalLink size={14} />
                <span>Open Site</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
