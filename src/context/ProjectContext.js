import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext();

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                // Test the function first
                console.log('Testing API connection...');
                const testResult = await api.test();
                console.log('Test result:', testResult);

                // If test succeeds, fetch projects
                console.log('Fetching projects...');
                const allProjects = await api.getProjects();
                setProjects(allProjects);
                setError(null);
            } catch (err) {
                setError('Failed to fetch projects');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    const addProject = async (projectData) => {
        try {
            const newProject = await api.createProject(projectData);
            setProjects(prev => [...prev, newProject]);
            return newProject;
        } catch (err) {
            console.error('Error adding project:', err);
            throw err;
        }
    };

    const updateProject = async (id, projectData) => {
        try {
            const updatedProject = await api.updateProject(id, projectData);
            setProjects(prev => prev.map(project => 
                project._id === id ? updatedProject : project
            ));
            return updatedProject;
        } catch (err) {
            console.error('Error updating project:', err);
            throw err;
        }
    };

    const deleteProject = async (id) => {
        try {
            await api.deleteProject(id);
            setProjects(prev => prev.filter(project => project._id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
            throw err;
        }
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            loading,
            error,
            addProject,
            updateProject,
            deleteProject
        }}>
            {children}
        </ProjectContext.Provider>
    );
}; 