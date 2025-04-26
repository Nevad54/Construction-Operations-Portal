import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext();

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = async () => {
        try {
            console.log('Fetching projects...');
            setLoading(true);
            const allProjects = await api.getProjects();
            console.log('Projects fetched successfully:', allProjects);
            setProjects(allProjects);
            setError(null);
            return allProjects;
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError('Failed to fetch projects');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
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
        deleteProject,
        refreshProjects: fetchProjects
        }}>
            {children}
        </ProjectContext.Provider>
    );
}; 