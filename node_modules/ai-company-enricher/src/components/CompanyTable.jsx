import React from 'react';
import { Eye, Trash2, FolderOpen, ExternalLink } from 'lucide-react';

export const CompanyTable = ({
  companies,
  onSelectCompany,
  onDeleteCompany,
  selectedId,
}) => {
  if (companies.length === 0) {
    return (
      <div className="relu-empty-box">
        <div className="relu-empty-icon">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h4>No records found</h4>
        <p>Enrich a company to see results here.</p>
      </div>
    );
  }

  return (
    <div className="relu-table-container">
      <table className="relu-table">
        <thead>
          <tr>
            <th>Website Name</th>
            <th>Company Name</th>
            <th>Core Service</th>
            <th>Emails</th>
            <th>Phone</th>
            <th>Enriched On</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const formattedDate = new Date(company.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            const isSelected = selectedId === company._id;

            return (
              <tr
                key={company._id}
                onClick={() => onSelectCompany(company)}
                style={{
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.05)' : undefined,
                  borderLeft: isSelected ? '3px solid var(--accent-teal)' : 'none',
                }}
              >
                <td>
                  <div className="table-company-meta">
                    <span className="company-meta-name">{company.websiteName}</span>
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="company-meta-url"
                      onClick={(e) => e.stopPropagation()} // Stop selection toggle
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      {company.websiteUrl.replace(/^https?:\/\//i, '').split('/')[0]}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </td>
                <td>{company.companyName || <span className="text-muted">—</span>}</td>
                <td title={company.coreService}>
                  {company.coreService || <span className="text-muted">—</span>}
                </td>
                <td>
                  {company.emails && company.emails.length > 0 ? (
                    <span>{company.emails[0]} {company.emails.length > 1 && `(+${company.emails.length - 1})`}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>{company.phoneNumber || <span className="text-muted">—</span>}</td>
                <td>{formattedDate}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="action-btn-group" style={{ justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="action-btn"
                      onClick={() => onSelectCompany(company)}
                      title="View enriched details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onDeleteCompany && (
                      <button
                        className="action-btn"
                        onClick={() => onDeleteCompany(company._id)}
                        title="Delete record"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
