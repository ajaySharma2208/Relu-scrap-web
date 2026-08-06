# AI-Powered Company Enricher (Hackathon Project)

An intelligent company data enrichment pipeline. It selectively scrapes relevant pages of a company website (using sitemaps or homepage anchor fallback and page scoring), cleans HTML to strip navigation/ads/cookie banners, and feeds clean text into Gemini AI to generate core service descriptions, target profiles, paint points, and personalized outreach email templates.

All enriched companies are stored in MongoDB and accessible via a glassmorphic dashboard interface.

---

## Architecture Overview

* **Frontend**: React (Vite + TS) with custom **Vanilla CSS** glassmorphism, responsive tables, loader indicators, copy-to-clipboard actions, and toast notifications.
* **Backend**: Express (Node.js + TS) exposing:
  * `POST /enrich` - Intelligent scraping, regex metadata parser, and Gemini completion.
  * `GET /results` - Retrieval of enriched history from MongoDB.
* **Database**: MongoDB (Mongoose Schema).

---

## Getting Started

### Prerequisites
* **Node.js** (v20+ recommended)
* **MongoDB** (Local instance running at `mongodb://localhost:27017` or Atlas connection string)
* **Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### Configuration
1. Open the file `backend/.env`.
2. Set your `GEMINI_API_KEY`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/company-enricher
   GEMINI_API_KEY=YOUR_ACTUAL_API_KEY
   ```

### Installation
From the root directory, install all workspace dependencies:
```bash
npm install --legacy-peer-deps
```

### Running the Project

#### 1. Running both Backend & Frontend concurrently:
We have set up a script that starts both concurrently. From the root directory, run:
```bash
npm run dev
```
* **Frontend**: Accessible at `http://localhost:5173`
* **Backend**: Running at `http://localhost:5000`

#### 2. Running them individually:
* **Backend**:
  ```bash
  npm run dev:backend
  ```
* **Frontend**:
  ```bash
  npm run dev:frontend
  ```

---

## Verification Plan

### Backend Health Check
To verify the backend server is running and database connection is sound, visit:
```
http://localhost:5000/health
```

### Scraping and AI Enrichment Demo
1. Ensure your MongoDB service is running.
2. Provide your `GEMINI_API_KEY` in `backend/.env`.
3. Start the dev servers.
4. Input a website name (e.g., `Stripe`) and its URL (e.g., `stripe.com`) and click **Enrich Company**.
5. Watch the loader cycle through the crawling, metadata extraction, and AI processing stages.
6. View the generated Outreach Opener, target profiles, and extracted emails/phones. Click the copy icon to test clipboard utility.
