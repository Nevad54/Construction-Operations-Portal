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
        const formData = new FormData();
        Object.keys(projectData).forEach(key => {
            formData.append(key, projectData[key]);
        });

        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    updateProject: async (id, projectData) => {
        const formData = new FormData();
        Object.keys(projectData).forEach(key => {
            formData.append(key, projectData[key]);
        });

        const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: 'PUT',
            body: formData,
        });
        if (!response.ok) {
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