import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { EnrichCompany } from './components/EnrichCompany';
import { ResultsList } from './components/ResultsList';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { apiService } from './services/api';

function App() {
  // Shared global state for companies and active transactions
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // States to persist active enrichment context across navigations
  const [activeEnrichmentName, setActiveEnrichmentName] = useState('');
  const [activeEnrichmentUrl, setActiveEnrichmentUrl] = useState('');
  const [activeEnrichedResult, setActiveEnrichedResult] = useState(null);

  const stepIntervalRef = useRef(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCompanies = async () => {
    try {
      setErrorMsg(null);
      const data = await apiService.getResults();
      setCompanies(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setErrorMsg('Could not connect to the backend server. Make sure it is running on port 5000.');
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleEnrich = async (name, url) => {
    setIsLoading(true);
    setCurrentStep(1);
    setErrorMsg(null);
    setActiveEnrichedResult(null);

    let step = 1;
    stepIntervalRef.current = setInterval(() => {
      if (step < 10) {
        step += 1;
        setCurrentStep(step);
      }
    }, 1200);

    try {
      const enrichedCompany = await apiService.enrichCompany(name, url);
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      setCurrentStep(10);

      setCompanies((prev) => {
        const filtered = prev.filter((c) => c.websiteUrl !== enrichedCompany.websiteUrl);
        return [enrichedCompany, ...filtered];
      });
      
      setSelectedCompany(enrichedCompany);
      setActiveEnrichedResult(enrichedCompany);
      triggerToast(`Enriched ${enrichedCompany.companyName || name} successfully!`);
      return enrichedCompany;
    } catch (err) {
      console.error('Enrichment error:', err);
      setErrorMsg(err.message);
      throw err;
    } finally {
      setIsLoading(false);
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company record?')) return;
    try {
      await apiService.deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      if (selectedCompany && selectedCompany._id === id) {
        setSelectedCompany(null);
      }
      // If deleted active enrichment, clear state too
      if (activeEnrichedResult && activeEnrichedResult._id === id) {
        setActiveEnrichedResult(null);
      }
      triggerToast('Company record deleted successfully.');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete company record.');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard companies={companies} />} />
          <Route 
            path="enrich" 
            element={
              <EnrichCompany 
                onEnrich={handleEnrich} 
                isLoading={isLoading} 
                currentStep={currentStep} 
                error={errorMsg}
                setError={setErrorMsg}
                enrichedResult={activeEnrichedResult}
                setEnrichedResult={setActiveEnrichedResult}
                enrichingName={activeEnrichmentName}
                setEnrichingName={setActiveEnrichmentName}
                enrichingUrl={activeEnrichmentUrl}
                setEnrichingUrl={setActiveEnrichmentUrl}
              />
            } 
          />
          <Route path="results" element={<ResultsList companies={companies} onDeleteCompany={handleDeleteCompany} onRefresh={fetchCompanies} />} />
          <Route path="analytics" element={<Analytics companies={companies} />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="relu-error-toast" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Toast Messages */}
      {toastMessage && (
        <div className="relu-toast-box" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          <span>{toastMessage}</span>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
