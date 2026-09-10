/**
 * Centralized API client for CredVerify Backend (FastAPI).
 * Base URL configured via VITE_API_BASE_URL (defaults to http://127.0.0.1:8000).
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

/**
 * Generic fetch wrapper with timeout and standardized JSON response/error parsing.
 */
async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // 10s default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = (data && data.detail) 
        ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
        : `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error(`Connection timed out after 10s when reaching ${url}`);
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  // 1. Health check
  async getHealth() {
    return request('/api/health');
  },

  // 2. User Profiles
  async createUser(userData) {
    return request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async getUser(userId) {
    return request(`/api/users/${encodeURIComponent(userId)}`);
  },

  async getUserByEmail(email) {
    return request(`/api/users?email=${encodeURIComponent(email)}`);
  },

  // 3. Documents
  async createDocument(docData) {
    return request('/api/documents', {
      method: 'POST',
      body: JSON.stringify(docData)
    });
  },

  async uploadDocument(file, userId, category = 'Resume') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    formData.append('category', category);

    const url = `${API_BASE_URL}/api/documents/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errData = null;
      try { errData = await response.json(); } catch (e) {}
      const errMsg = (errData && errData.detail)
        ? (typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail))
        : `Upload failed with status ${response.status}`;
      const error = new Error(errMsg);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  },

  async getDocument(documentId) {
    return request(`/api/documents/${encodeURIComponent(documentId)}`);
  },

  async analyzeDocument(documentId) {
    return request(`/api/documents/${encodeURIComponent(documentId)}/analyze`, {
      method: 'POST',
      timeout: 45000
    });
  },

  async deleteDocument(documentId, userId = null) {
    let effectiveUserId = userId;
    if (!effectiveUserId && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('credverify_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) effectiveUserId = parsed.id;
        }
      } catch (e) {}
    }

    const query = effectiveUserId ? `?user_id=${encodeURIComponent(effectiveUserId)}` : '';
    const headers = effectiveUserId ? { 'X-User-ID': effectiveUserId } : {};

    return request(`/api/documents/${encodeURIComponent(documentId)}${query}`, {
      method: 'DELETE',
      headers
    });
  },

  async getUserDocuments(userId) {
    return request(`/api/users/${encodeURIComponent(userId)}/documents`);
  },

  getDocumentFileUrl(documentId, userId = null) {
    if (!documentId) return null;
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return `${API_BASE_URL}/api/documents/${encodeURIComponent(documentId)}/file${query}`;
  },

  // 4. Claims
  async createClaim(claimData) {
    return request('/api/claims', {
      method: 'POST',
      body: JSON.stringify(claimData)
    });
  },

  async getUserClaims(userId) {
    return request(`/api/users/${encodeURIComponent(userId)}/claims`);
  },

  // 5. Credentials
  async createCredential(credData) {
    return request('/api/credentials', {
      method: 'POST',
      body: JSON.stringify(credData)
    });
  },

  async getUserCredentials(userId) {
    return request(`/api/users/${encodeURIComponent(userId)}/credentials`);
  }
};

export const deleteDocument = (documentId, userId = null) => api.deleteDocument(documentId, userId);

export default api;

