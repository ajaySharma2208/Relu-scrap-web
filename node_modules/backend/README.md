# Relu Consultancy AI Enricher - Backend Foundation

A production-grade, secure, and optimized Express.js backend foundation.

---

## Features
* **Security Headers**: Integrated `helmet` middleware.
* **CORS**: Configured cross-origin capabilities.
* **Rate Limiter**: Guarded endpoints against excessive abuse using `express-rate-limit`.
* **Morgan Logger**: Request logs formatted for developers.
* **Gzip Compression**: Compressed HTTP responses using `compression`.
* **MongoDB Mongoose**: Event-driven connection hooks.
* **Unified Error Handler**: Centralized route boundary catcher.
* **Async Wrapper**: Simple promise handlers to keep route controllers readable.

---

## Environment Configuration
Setup your `.env` file in the root of the `backend/` folder based on `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/company-enricher
GEMINI_API_KEY=your_gemini_api_key
```

---

## APIs Exposed

### 1. Base Health Check
* **Endpoint**: `GET /`
* **Response**:
```json
{
  "success": true,
  "message": "Relu Consultancy AI Enricher Backend Running"
}
```

### 2. Versioned Detailed Health status
* **Endpoint**: `GET /api/v1/health`
* **Response**:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```
