const RAW_API_BASE_URL = (process.env.REACT_APP_API_URL || '').trim();

// In local development, default to CRA proxy (package.json -> proxy: http://localhost:3002).
// For deployed frontend, set REACT_APP_API_URL explicitly.
const API_BASE_URL = RAW_API_BASE_URL || '';

const getApiPrefix = () => {
  if (!API_BASE_URL) return '/api';

  const normalizedBase = API_BASE_URL.replace(/\/$/, '');
  const isNetlifyHost =
    normalizedBase.includes('netlify.app') ||
    normalizedBase.includes('netlify.com');

  return isNetlifyHost
    ? `${normalizedBase}/.netlify/functions/api`
    : `${normalizedBase}/api`;
};

const API_PREFIX = getApiPrefix();

const handleResponse = async (response) => {
  console.log('API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    url: response.url
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', errorText);
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
      console.log('Parsed JSON response:', json);
      return json;
    } else {
      const text = await response.text();
      console.error('Unexpected content type:', contentType);
      console.error('Response text:', text);
      throw new Error(`Expected JSON but got ${contentType}`);
    }
  } catch (error) {
    console.error('Error parsing response:', error);
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

    // Test function
    test: async () => {
        const isNetlifyHost = API_BASE_URL.includes('netlify.app') || API_BASE_URL.includes('netlify.com');
        const url = API_BASE_URL
          ? (isNetlifyHost ? `${API_BASE_URL}/.netlify/functions/test` : `${API_BASE_URL}/test`)
          : '/.netlify/functions/test';
        console.log('Testing function at:', url);
        
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
            console.error('Error in test:', error);
            throw error;
        }
    },

    // Projects
    getProjects: async () => {
        const url = `${API_PREFIX}/projects`;
        console.log('Fetching projects from:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error in getProjects:', error);
            throw error;
        }
    },

    createProject: async (projectData) => {
        const url = `${API_PREFIX}/projects`;
        console.log('Creating project at:', url);
        console.log('Project data:', projectData);
        
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
            console.error('Error in createProject:', error);
            throw error;
        }
    },

    updateProject: async (id, projectData) => {
        const url = `${API_PREFIX}/projects/${id}`;
        console.log('Updating project at:', url);
        console.log('Project data:', projectData);
        console.log('Project ID:', id);
        
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
                console.error('Update failed:', errorText);
                throw new Error(`Failed to update project: ${response.status} ${response.statusText}`);
            }

            return handleResponse(response);
        } catch (error) {
            console.error('Error in updateProject:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        const url = `${API_PREFIX}/projects/${id}`;
        console.log('Deleting project at:', url);
        
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
            console.error('Error in deleteProject:', error);
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

    getActivityLogs: async (limit = 30) => {
        const response = await fetch(`${API_PREFIX}/activity-logs?limit=${encodeURIComponent(limit)}`, {
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
