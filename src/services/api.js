const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const handleResponse = async (response) => {
  console.log('API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error(`Expected JSON response but got ${contentType}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error response:', errorData);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const api = {
    // Projects
    getProjects: async () => {
        console.log('Fetching projects from:', `${API_BASE_URL}/.netlify/functions/api/projects`);
        const response = await fetch(`${API_BASE_URL}/.netlify/functions/api/projects`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        return handleResponse(response);
    },

    createProject: async (projectData) => {
        console.log('Creating project with data:', projectData);
        let response;
        
        // Check if projectData is FormData or a regular object
        if (projectData instanceof FormData) {
            // If it's FormData, send it directly
            response = await fetch(`${API_BASE_URL}/.netlify/functions/api/projects`, {
                method: 'POST',
                credentials: 'include',
                mode: 'cors',
                body: projectData,
            });
        } else {
            // If it's a regular object, send as JSON
            response = await fetch(`${API_BASE_URL}/.netlify/functions/api/projects`, {
                method: 'POST',
                credentials: 'include',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });
        }

        return handleResponse(response);
    },

    updateProject: async (id, projectData) => {
        console.log(`Updating project ${id} with data:`, projectData);
        const response = await fetch(`${API_BASE_URL}/.netlify/functions/api/projects/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
            mode: 'cors'
        });
        return handleResponse(response);
    },

    deleteProject: async (id) => {
        console.log(`Deleting project ${id}`);
        const response = await fetch(`${API_BASE_URL}/.netlify/functions/api/projects/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        return handleResponse(response);
    },

    // Contact Form
    submitContactForm: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/api/contact`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        return response.json();
    },

    // CAPTCHA
    getCaptcha: async () => {
        const response = await fetch(`${API_BASE_URL}/api/captcha`, {
            credentials: 'include'
        });
        return response.json();
    }
}; 