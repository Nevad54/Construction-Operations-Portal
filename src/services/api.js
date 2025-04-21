const API_BASE_URL = '/api';

export const api = {
    // Projects
    getProjects: async () => {
        const response = await fetch(`${API_BASE_URL}/projects`);
        return response.json();
    },

    getFeaturedProjects: async () => {
        const response = await fetch(`${API_BASE_URL}/projects/featured`);
        return response.json();
    },

    createProject: async (projectData) => {
        const formData = new FormData();
        Object.keys(projectData).forEach(key => {
            formData.append(key, projectData[key]);
        });

        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            body: formData,
        });
        return response.json();
    },

    updateProject: async (id, projectData) => {
        const formData = new FormData();
        Object.keys(projectData).forEach(key => {
            formData.append(key, projectData[key]);
        });

        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'PUT',
            body: formData,
        });
        return response.json();
    },

    deleteProject: async (id) => {
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'DELETE',
        });
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