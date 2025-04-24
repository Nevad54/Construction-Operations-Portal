const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const api = {
    // Projects
    getProjects: async () => {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
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
                body: projectData,
            });
        } else {
            // If it's a regular object, send as JSON
            response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
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
                body: projectData,
            });
        } else {
            // If it's a regular object, send as JSON
            response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
                method: 'PUT',
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
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Contact Form
    submitContactForm: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        return response.json();
    },

    // CAPTCHA
    getCaptcha: async () => {
        const response = await fetch(`${API_BASE_URL}/captcha`);
        return response.json();
    }
}; 