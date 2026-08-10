// import axios from 'axios';

// let apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// if (apiBaseUrl.endsWith('/')) {
//   apiBaseUrl = apiBaseUrl.slice(0, -1);
// }

// const api = axios.create({
//   baseURL: apiBaseUrl,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 180000, // Large corporate sitemaps/AI pipeline might take up to 3 mins
// });

// export const apiService = {
//   /**
//    * Enriches a company by name and URL.
//    * Runs the complete selective scraping and AI pipeline.
//    * 
//    * @param {string} name - User specified website name.
//    * @param {string} url - Target website URL.
//    * @returns {Promise<object>} Enriched company document details.
//    */
//   async enrichCompany(name, url) {
//     try {
//       const response = await api.post('/enrich', { name, url });
//       return response.data;
//     } catch (error) {
//       const message = error.response?.data?.error || error.response?.data?.details || error.message || 'Error during enrichment process';
//       throw new Error(message);
//     }
//   },

//   /**
//    * Fetches all saved enriched companies from MongoDB.
//    * Sorted latest first.
//    * 
//    * @returns {Promise<object[]>} List of saved companies.
//    */
//   async getResults() {
//     try {
//       const response = await api.get('/results');
//       return response.data || [];
//     } catch (error) {
//       const message = error.response?.data?.error || error.message || 'Failed to retrieve records';
//       throw new Error(message);
//     }
//   },

//   /**
//    * Deletes a company record from the database.
//    * 
//    * @param {string} id - Company record ObjectId.
//    * @returns {Promise<object>} Status response message.
//    */
//   async deleteCompany(id) {
//     try {
//       const response = await api.delete(`/results/${id}`);
//       return response.data;
//     } catch (error) {
//       const message = error.response?.data?.error || error.message || 'Failed to delete record';
//       throw new Error(message);
//     }
//   }
// };

// export default apiService;



import axios from 'axios';

let apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  'https://relu-scrap-web-5.onrender.com';

if (apiBaseUrl.endsWith('/')) {
  apiBaseUrl = apiBaseUrl.slice(0, -1);
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // Large corporate sitemaps/AI pipeline might take up to 3 mins
});

export const apiService = {
  /**
   * Enriches a company by name and URL.
   * Runs the complete selective scraping and AI pipeline.
   *
   * @param {string} name - User specified website name.
   * @param {string} url - Target website URL.
   * @returns {Promise} Enriched company document details.
   */
  async enrichCompany(name, url) {
    try {
      const response = await api.post('/enrich', { name, url });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        'Error during enrichment process';

      throw new Error(message);
    }
  },

  /**
   * Fetches all saved enriched companies from MongoDB.
   * Sorted latest first.
   *
   * @returns {Promise<object[]>} List of saved companies.
   */
  async getResults() {
    try {
      const response = await api.get('/results');
      return response.data || [];
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to retrieve records';

      throw new Error(message);
    }
  },

  /**
   * Deletes a company record from the database.
   *
   * @param {string} id - Company record ObjectId.
   * @returns {Promise} Status response message.
   */
  async deleteCompany(id) {
    try {
      const response = await api.delete(`/results/${id}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        'Failed to delete record';

      throw new Error(message);
    }
  },
};

export default apiService;