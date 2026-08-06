import React, { useState } from 'react';
import { MapPin, Phone, Mail, Layers, Users, Zap, MessageSquare, Copy, Check, ExternalLink, X } from 'lucide-react';

export const ResultCard = ({ company, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyOpener = () => {
    if (!company.outreachOpener) return;
    navigator.clipboard.writeText(company.outreachOpener);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="results-card-container">
      <div className="results-back-header">
        <span className="badge-enriched">AI Enriched</span>
        {onClose && (
          <button onClick={onClose}>
            <X className="w-4 h-4" />
            <span>Close Details</span>
          </button>
        )}
      </div>

      <div className="result-card glass-panel" style={{ border: 'none', padding: '0', boxShadow: 'none' }}>
        <div className="result-header" style={{ paddingTop: '0' }}>
          <div className="company-identity">
            <h2 style={{ color: '#0f172a' }}>{company.companyName || company.websiteName}</h2>
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="url-link"
              style={{ color: '#2563eb' }}
            >
              {company.websiteUrl} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="result-grid" style={{ marginTop: '1.5rem' }}>
          {/* Core Services */}
          <div className="info-section" style={{ background: '#f8fafc' }}>
            <h3 style={{ color: '#0f766e' }}>
              <Layers className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
              Core Service / Product
            </h3>
            <p>{company.coreService || 'Not specified'}</p>
          </div>

          {/* Target Customers */}
          <div className="info-section" style={{ background: '#f8fafc' }}>
            <h3 style={{ color: '#2563eb' }}>
              <Users className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
              Target Customer
            </h3>
            <p>{company.targetCustomer || 'Not specified'}</p>
          </div>

          {/* Pain Points */}
          <div className="info-section" style={{ background: '#f8fafc' }}>
            <h3 style={{ color: '#d97706' }}>
              <Zap className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
              Probable Pain Point
            </h3>
            <p>{company.probablePainPoint || 'Not specified'}</p>
          </div>

          {/* Contact Metadata */}
          <div className="info-section" style={{ background: '#f8fafc' }}>
            <h3 style={{ color: '#6b21a8' }}>Contact Details</h3>
            <div className="metadata-list" style={{ marginTop: '0.5rem' }}>
              <div className="metadata-item">
                <MapPin className="w-4 h-4" />
                <span>{company.address || 'Address not found'}</span>
              </div>
              <div className="metadata-item">
                <Phone className="w-4 h-4" />
                <span>{company.phoneNumber || 'Phone not found'}</span>
              </div>
              <div className="metadata-item" style={{ alignItems: 'flex-start' }}>
                <Mail className="w-4 h-4" style={{ marginTop: '2px' }} />
                <div>
                  {company.emails && company.emails.length > 0 ? (
                    company.emails.map((email, idx) => (
                      <div key={idx}>{email}</div>
                    ))
                  ) : (
                    <span>No emails found</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Outreach Opener */}
          {company.outreachOpener && (
            <div className="info-section full-width" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
              <h3 style={{ color: '#5b21b6' }}>
                <MessageSquare className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
                Suggested Outreach Opener
              </h3>
              <div className="copy-wrapper" style={{ background: '#ffffff', borderColor: '#e2e8f0', marginTop: '0.5rem' }}>
                <span className="copy-text" style={{ color: '#1e1b4b' }}>"{company.outreachOpener}"</span>
                <button
                  onClick={handleCopyOpener}
                  className="btn-copy"
                  title="Copy outreach opener"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
