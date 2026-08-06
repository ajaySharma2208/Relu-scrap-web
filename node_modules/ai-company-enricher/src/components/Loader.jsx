import React from 'react';
import { Globe, FileText, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export const Loader = ({ step }) => {
  const steps = [
    {
      id: 1,
      label: 'Discovering Sitemap & Internal Links',
      icon: Globe,
    },
    {
      id: 2,
      label: 'Crawling & Sanitizing Pages',
      icon: FileText,
    },
    {
      id: 3,
      label: 'Local Metadata Parsing',
      icon: Cpu,
    },
    {
      id: 4,
      label: 'Gemini AI Enrichment Analysis',
      icon: Sparkles,
    },
  ];

  return (
    <div className="loading-container glass-panel">
      <div className="spinner-glow"></div>
      
      <div className="scraper-status-steps">
        {steps.map((s) => {
          const Icon = s.icon;
          let statusClass = 'step-indicator';
          let showCheck = false;
          
          if (step > s.id) {
            statusClass += ' completed';
            showCheck = true;
          } else if (step === s.id) {
            statusClass += ' active';
          }
          
          return (
            <div key={s.id} className={statusClass}>
              {showCheck ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Icon className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-muted text-center" style={{ fontSize: '0.9rem' }}>
        Please wait, this will take 10-15 seconds.
      </p>
    </div>
  );
};
