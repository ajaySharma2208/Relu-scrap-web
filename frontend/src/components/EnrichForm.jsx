import React, { useState } from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';

export const EnrichForm = ({ onEnrich, isLoading }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onEnrich(name.trim(), url.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="input-label">Website Name</div>
        <input
          type="text"
          placeholder="e.g. Relu Consultancy"
          className="input-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <div className="input-label">Website URL</div>
        <input
          type="text"
          placeholder="e.g. https://reluconsultancy.com"
          className="input-control"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <button type="submit" className="btn-enrich-submit" disabled={isLoading || !name.trim() || !url.trim()}>
        <Sparkles className="w-4 h-4" />
        <span>{isLoading ? 'Processing...' : 'Enrich Company'}</span>
      </button>

      <div className="form-info-row">
        <ShieldAlert className="w-4 h-4" />
        <span>We only scrape publicly available data and generate insights ethically.</span>
      </div>
    </form>
  );
};
