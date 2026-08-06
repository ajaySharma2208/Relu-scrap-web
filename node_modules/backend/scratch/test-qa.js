import { scrapeWebsite, normalizeUrl } from '../src/scraper/index.js';
import { getTopRelevantPages } from '../src/scraper/pageSelector.service.js';
import { cleanHtmlPages } from '../src/scraper/contentCleaner.service.js';
import { extractStructuredInfo } from '../src/scraper/structuredExtractor.service.js';
import { generateBusinessInsights } from '../src/ai/ai.service.js';
import axios from 'axios';

console.log('=== COMMENCING PRODUCTION HACKATHON QA & JUDGE SIMULATION ===\n');

async function testEdgeCase(label, fn) {
  console.log(`Testing [${label}]...`);
  try {
    const result = await fn();
    console.log(`=> Success: ${JSON.stringify(result).slice(0, 150)}...\n`);
  } catch (err) {
    console.log(`=> Caught Expected/Unexpected Error: ${err.message}\n`);
  }
}

async function runQaSuite() {
  // 1. URL Normalization & Validation
  await testEdgeCase('Normalize Valid HTTP Url', () => normalizeUrl('http://mozilla.org/en-US/'));
  await testEdgeCase('Normalize Bare Domain', () => normalizeUrl('google.com'));
  await testEdgeCase('Normalize Invalid URL characters', () => normalizeUrl('htt p://invalid-domain.com/space'));

  // 2. Crawler Robustness checks (Invalid/Timeout/403/404 handling)
  await testEdgeCase('Scrape Non-existent Domain (404/DNS error)', () => scrapeWebsite('https://thisdomainwillneverexist12345.com'));
  await testEdgeCase('Scrape Localhost Address (Security restriction check)', () => scrapeWebsite('http://localhost:5000'));
  await testEdgeCase('Scrape Website returning 404', () => scrapeWebsite('https://google.com/non-existent-page-path-1234'));

  // 3. Keyword Selector scoring validation
  await testEdgeCase('Page Selector keywords logic', () => {
    const candidates = [
      'https://google.com/blog/article-1',
      'https://google.com/about',
      'https://google.com/contact-us',
      'https://google.com/terms-and-conditions',
      'https://google.com/privacy-policy'
    ];
    return getTopRelevantPages(candidates, 'https://google.com');
  });

  // 4. Content Cleaner deduplication
  await testEdgeCase('Cleaner Deduplication & Token Heuristics', () => {
    const pages = [
      '<html><body><nav>Header</nav><main>Welcome to RELU Consultancy. We provide AI services.</main><footer>Copyright 2026</footer></body></html>',
      '<html><body><nav>Header</nav><main>Welcome to RELU Consultancy. We provide AI services.</main><footer>Copyright 2026</footer></body></html>'
    ];
    return cleanHtmlPages(pages);
  });

  // 5. Structured Data & Address validation
  await testEdgeCase('Structured Extractor - Homepage Schema.org Organization', () => {
    const homepage = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "RELU Testing Corp",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Main St",
                "addressLocality": "San Francisco",
                "addressRegion": "CA",
                "postalCode": "94105",
                "addressCountry": "USA"
              }
            }
          </script>
        </head>
        <body>
          <h1>Welcome to RELU Testing Corp</h1>
        </body>
      </html>
    `;
    return extractStructuredInfo([homepage], { emails: ['contact@relu.in'], phones: ['+1 555-555-5555'] });
  });

  // 6. Address Fallback verification
  await testEdgeCase('Address Fallback - No Schema.org, but HTML5 Address', () => {
    const homepage = `
      <html>
        <body>
          <address>
            456 Innovation Way, Tech District, Bangalore, India
          </address>
        </body>
      </html>
    `;
    return extractStructuredInfo([homepage], {});
  });

  // 7. Company Name detection priority check
  await testEdgeCase('Company Name Priority (OG name vs Title)', () => {
    const homepage = `
      <html>
        <head>
          <meta property="og:site_name" content="RELU OG Site Name" />
          <title>RELU Title - Leading Software Firm</title>
        </head>
        <body>
          <h1>RELU H1 Header</h1>
        </body>
      </html>
    `;
    return extractStructuredInfo([homepage], {});
  });

  console.log('=== QA EDGE CASE TESTS COMPLETE ===\n');
}

runQaSuite();
