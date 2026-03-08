const RAW_API_BASE_URL = (process.env.REACT_APP_API_URL || '').trim();

// In local development, default to the frontend dev proxy.
// For deployed frontend, set REACT_APP_API_URL explicitly.
const API_BASE_URL = RAW_API_BASE_URL || '';

const LOCAL_BACKEND_BASE_URLS = [
  'http://localhost:3102',
  'http://127.0.0.1:3102',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
];

let discoveredProjectBaseUrl = API_BASE_URL;

const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

const isNetlifyHost = (value) => {
  const normalized = trimTrailingSlash(value);
  return normalized.includes('netlify.app') || normalized.includes('netlify.com');
};

const buildApiPrefix = (baseUrl) => {
  const normalizedBase = trimTrailingSlash(baseUrl);
  if (!normalizedBase) return '/api';

  return isNetlifyHost(normalizedBase)
    ? `${normalizedBase}/.netlify/functions/api`
    : `${normalizedBase}/api`;
};

const buildDirectAssetBaseUrl = (baseUrl) => {
  const normalizedBase = trimTrailingSlash(baseUrl);
  return normalizedBase || '';
};

const getProjectApiPrefixes = () => {
  const prefixes = [buildApiPrefix(API_BASE_URL)];
  const isLocalHost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (!API_BASE_URL && isLocalHost) {
    LOCAL_BACKEND_BASE_URLS.forEach((baseUrl) => {
      prefixes.push(buildApiPrefix(baseUrl));
    });
  }

  return Array.from(new Set(prefixes));
};

const getBaseUrlFromApiPrefix = (prefix) => {
  if (!prefix || prefix === '/api') return '';
  return trimTrailingSlash(prefix).replace(/\/\.netlify\/functions\/api$|\/api$/, '');
};

const getApiPrefix = () => {
  return buildApiPrefix(API_BASE_URL);
};

const API_PREFIX = getApiPrefix();

const isDev = process.env.NODE_ENV !== 'production';
const isApiDebugEnabled = isDev && process.env.REACT_APP_DEBUG_API === 'true';
const debugLog = (...args) => {
  if (!isApiDebugEnabled) return;
  // eslint-disable-next-line no-console
  console.log(...args);
};
const debugError = (...args) => {
  if (!isApiDebugEnabled) return;
  // eslint-disable-next-line no-console
  console.error(...args);
};

const handleResponse = async (response) => {
  debugLog('API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    url: response.url
  });

  if (!response.ok) {
    const errorText = await response.text();
    debugError('Error response:', errorText);
    try {
      const parsed = JSON.parse(errorText);
      throw new Error(parsed.error || `HTTP error! status: ${response.status}`);
    } catch (e) {
      if (e instanceof Error && e.message && e.message !== 'Unexpected end of JSON input') {
        throw e;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      debugLog('Parsed JSON response:', json);
      return json;
    } else {
      const text = await response.text();
      debugError('Unexpected content type:', contentType);
      debugError('Response text:', text);
      throw new Error(`Expected JSON but got ${contentType}`);
    }
  } catch (error) {
    debugError('Error parsing response:', error);
    throw error;
  }
};

export const api = {
    // Auth
    login: async (username, password) => {
        const response = await fetch(`${API_PREFIX}/auth/login`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });
        return handleResponse(response);
    },

    register: async ({ username, password, role = 'user', adminCode = '' }) => {
        const response = await fetch(`${API_PREFIX}/auth/register`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, role, adminCode }),
        });
        return handleResponse(response);
    },

    logout: async () => {
        const response = await fetch(`${API_PREFIX}/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    me: async () => {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await fetch(`${API_PREFIX}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return handleResponse(response);
    },

    // Admin user management
    adminListUsers: async () => {
        const response = await fetch(`${API_PREFIX}/admin/users`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    adminCreateUser: async ({ username, password, role }) => {
        const response = await fetch(`${API_PREFIX}/admin/users`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, role }),
        });
        return handleResponse(response);
    },

    adminResetUserPassword: async (id, newPassword) => {
        const response = await fetch(`${API_PREFIX}/admin/users/${encodeURIComponent(id)}/reset-password`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ newPassword }),
        });
        return handleResponse(response);
    },

    adminDeleteUser: async (id) => {
        const response = await fetch(`${API_PREFIX}/admin/users/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    // CSV export endpoints (return Blob)
    adminExportUsers: async (params = {}) => {
        const url = new URL(`${API_PREFIX}/admin/export/users`, window.location.origin);
        Object.entries(params).forEach(([k, v]) => {
            if (v != null && v !== '') url.searchParams.set(k, v);
        });
        const response = await fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            const err = await handleResponse(response);
            throw new Error(err.error || 'Failed to export users');
        }
        return response.blob();
    },
    adminExportInquiries: async (params = {}) => {
        const url = new URL(`${API_PREFIX}/admin/export/inquiries`, window.location.origin);
        Object.entries(params).forEach(([k, v]) => {
            if (v != null && v !== '') url.searchParams.set(k, v);
        });
        const response = await fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            const err = await handleResponse(response);
            throw new Error(err.error || 'Failed to export inquiries');
        }
        return response.blob();
    },
    adminExportActivity: async (params = {}) => {
        const url = new URL(`${API_PREFIX}/admin/export/activity`, window.location.origin);
        Object.entries(params).forEach(([k, v]) => {
            if (v != null && v !== '') url.searchParams.set(k, v);
        });
        const response = await fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            const err = await handleResponse(response);
            throw new Error(err.error || 'Failed to export activity logs');
        }
        return response.blob();
    },

    adminUpdateUser: async (id, updates = {}) => {
        const response = await fetch(`${API_PREFIX}/admin/users/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates || {}),
        });
        return handleResponse(response);
    },

    adminGetKpis: async () => {
        const response = await fetch(`${API_PREFIX}/admin/kpis`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    adminListInquiries: async (params = {}) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set('status', String(params.status));
        if (params.q) qs.set('q', String(params.q));
        if (params.limit != null) qs.set('limit', String(params.limit));
        if (params.skip != null) qs.set('skip', String(params.skip));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        const response = await fetch(`${API_PREFIX}/admin/inquiries${suffix}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    adminUpdateInquiry: async (id, updates = {}) => {
        const response = await fetch(`${API_PREFIX}/admin/inquiries/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates || {}),
        });
        return handleResponse(response);
    },

    adminDeleteInquiry: async (id) => {
        const response = await fetch(`${API_PREFIX}/admin/inquiries/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    // Test function
    test: async () => {
        const isNetlifyHost = API_BASE_URL.includes('netlify.app') || API_BASE_URL.includes('netlify.com');
        const url = API_BASE_URL
          ? (isNetlifyHost ? `${API_BASE_URL}/.netlify/functions/test` : `${API_BASE_URL}/test`)
          : '/.netlify/functions/test';
        debugLog('Testing function at:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            return handleResponse(response);
        } catch (error) {
            debugError('Error in test:', error);
            throw error;
        }
    },

    // Projects
    getProjects: async () => {
        const prefixes = getProjectApiPrefixes();
        let lastError = null;

        for (const prefix of prefixes) {
            const url = `${prefix}/projects`;
            debugLog('Fetching projects from:', url);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'include',
                });
                const projects = await handleResponse(response);
                discoveredProjectBaseUrl = getBaseUrlFromApiPrefix(prefix);
                return projects;
            } catch (error) {
                lastError = error;
                debugError(`Error in getProjects via ${url}:`, error);
            }
        }

        throw lastError || new Error('Failed to load projects');
    },

    getProjectAssetBaseUrl: () => buildDirectAssetBaseUrl(discoveredProjectBaseUrl),

    createProject: async (projectData) => {
        const url = `${API_PREFIX}/projects`;
        debugLog('Creating project at:', url);
        debugLog('Project data:', projectData);
        
        try {
            let response;
            if (projectData instanceof FormData) {
                response = await fetch(url, {
                    method: 'POST',
                    body: projectData,
                    credentials: 'include',
                });
            } else {
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(projectData),
                    credentials: 'include',
                });
            }
            return handleResponse(response);
        } catch (error) {
            debugError('Error in createProject:', error);
            throw error;
        }
    },

    updateProject: async (id, projectData) => {
        const url = `${API_PREFIX}/projects/${id}`;
        debugLog('Updating project at:', url);
        debugLog('Project data:', projectData);
        debugLog('Project ID:', id);
        
        try {
            const isFormData = projectData instanceof FormData;
            const response = await fetch(url, isFormData
                ? {
                    method: 'PUT',
                    body: projectData,
                    credentials: 'include',
                }
                : {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(projectData),
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                debugError('Update failed:', errorText);
                throw new Error(`Failed to update project: ${response.status} ${response.statusText}`);
            }

            return handleResponse(response);
        } catch (error) {
            debugError('Error in updateProject:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        const url = `${API_PREFIX}/projects/${id}`;
        debugLog('Deleting project at:', url);
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            });
            return handleResponse(response);
        } catch (error) {
            debugError('Error in deleteProject:', error);
            throw error;
        }
    },

    // Files
    getFiles: async () => {
        const url = `${API_PREFIX}/files`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    getFilePreview: async (id) => {
        const url = `${API_PREFIX}/files/${encodeURIComponent(id)}/preview`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    uploadFile: async (fileData) => {
        const url = `${API_PREFIX}/files`;
        const response = await fetch(url, {
            method: 'POST',
            body: fileData,
            credentials: 'include',
        });
        return handleResponse(response);
    },

    updateFile: async (id, updateData) => {
        const url = `${API_PREFIX}/files/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    deleteFile: async (id) => {
        const url = `${API_PREFIX}/files/${id}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    getFolders: async () => {
        const response = await fetch(`${API_PREFIX}/folders`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    createFolder: async (path) => {
        const response = await fetch(`${API_PREFIX}/folders`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ path }),
        });
        return handleResponse(response);
    },

    moveFilesBulk: async (ids, destinationFolder = '') => {
        const response = await fetch(`${API_PREFIX}/files/bulk-move`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ ids, destinationFolder }),
        });
        return handleResponse(response);
    },

    copyFilesBulk: async (ids, destinationFolder = '') => {
        const response = await fetch(`${API_PREFIX}/files/bulk-copy`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ ids, destinationFolder }),
        });
        return handleResponse(response);
    },

    moveFolder: async (sourcePath, destinationPath = '') => {
        const response = await fetch(`${API_PREFIX}/folders/move`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ sourcePath, destinationPath }),
        });
        return handleResponse(response);
    },

    copyFolder: async (sourcePath, destinationPath = '') => {
        const response = await fetch(`${API_PREFIX}/folders/copy`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ sourcePath, destinationPath }),
        });
        return handleResponse(response);
    },

    getActivityLogs: async (options = {}) => {
        const limit = options && options.limit != null ? Number(options.limit) : 30;
        const skip = options && options.skip != null ? Number(options.skip) : 0;
        const actionPrefix = options && options.actionPrefix ? String(options.actionPrefix) : '';
        const action = options && options.action ? String(options.action) : '';
        const permissionChanges = Boolean(options && options.permissionChanges);
        const targetId = options && options.targetId ? String(options.targetId) : '';
        const targetType = options && options.targetType ? String(options.targetType) : '';

        const qs = new URLSearchParams();
        qs.set('limit', String(limit));
        if (skip) qs.set('skip', String(skip));
        if (actionPrefix) qs.set('actionPrefix', actionPrefix);
        if (action) qs.set('action', action);
        if (permissionChanges) qs.set('permissionChanges', 'true');
        if (targetId) qs.set('targetId', targetId);
        if (targetType) qs.set('targetType', targetType);

        const response = await fetch(`${API_PREFIX}/activity-logs?${qs.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
        });
        return handleResponse(response);
    },

    // Contact Form
    submitContactForm: async (formData) => {
        const response = await fetch(`${API_PREFIX}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            credentials: 'include',
        });
        return response.json();
    },

    // CAPTCHA
    getCaptcha: async () => {
        const response = await fetch(`${API_PREFIX}/captcha`, {
            credentials: 'include',
        });
        return response.json();
    }
}; 
