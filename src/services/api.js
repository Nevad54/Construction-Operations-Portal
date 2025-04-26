const API_BASE_URL = process.env.REACT_APP_API_URL || '';

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
    throw new Error(`HTTP error! status: ${response.status}`);
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
    // Test function
    test: async () => {
        const url = `${API_BASE_URL}/.netlify/functions/test`;
        console.log('Testing function at:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error in test:', error);
            throw error;
        }
    },

    // Projects
    getProjects: async () => {
        const url = `${API_BASE_URL}/.netlify/functions/api/projects`;
        console.log('Fetching projects from:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors'
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error in getProjects:', error);
            throw error;
        }
    },

    createProject: async (projectData) => {
        const url = `${API_BASE_URL}/.netlify/functions/api/projects`;
        console.log('Creating project at:', url);
        console.log('Project data:', projectData);
        
        try {
            let response;
        if (projectData instanceof FormData) {
                response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                    mode: 'cors',
                body: projectData,
            });
        } else {
                response = await fetch(url, {
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
        } catch (error) {
            console.error('Error in createProject:', error);
            throw error;
        }
    },

    updateProject: async (id, projectData) => {
        const url = `${API_BASE_URL}/.netlify/functions/api/projects/${id}`;
        console.log('Updating project at:', url);
        console.log('Project data:', projectData);
        
        try {
            const response = await fetch(url, {
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
        } catch (error) {
            console.error('Error in updateProject:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        const url = `${API_BASE_URL}/.netlify/functions/api/projects/${id}`;
        console.log('Deleting project at:', url);
        
        try {
            const response = await fetch(url, {
            method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors'
        });
            return handleResponse(response);
        } catch (error) {
            console.error('Error in deleteProject:', error);
            throw error;
        }
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