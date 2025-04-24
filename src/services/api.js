const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const api = {
    // Projects
    getProjects: async () => {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    createProject: async (projectData) => {
        let response;
        
        // Check if projectData is FormData or a regular object
        if (projectData instanceof FormData) {
            // If it's FormData, send it directly
            response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                credentials: 'include',
                body: projectData,
            });
        } else {
            // If it's a regular object, send as JSON
            response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    updateProject: async (id, projectData) => {
        let response;
        
        // Check if projectData is FormData or a regular object
        if (projectData instanceof FormData) {
            // If it's FormData, send it directly
            response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
                method: 'PUT',
                credentials: 'include',
                body: projectData,
            });
        } else {
            // If it's a regular object, send as JSON
            response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    deleteProject: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
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