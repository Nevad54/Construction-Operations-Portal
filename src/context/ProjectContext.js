import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext();

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const [allProjects, featured] = await Promise.all([
                api.getProjects(),
                api.getFeaturedProjects()
            ]);
            setProjects(allProjects);
            setFeaturedProjects(featured);
            setError(null);
        } catch (err) {
            setError('Failed to fetch projects');
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const addProject = async (projectData) => {
        try {
            const newProject = await api.createProject(projectData);
            setProjects(prev => [...prev, newProject]);
            if (newProject.featured) {
                setFeaturedProjects(prev => [...prev, newProject]);
            }
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
            setFeaturedProjects(prev => {
                if (updatedProject.featured) {
                    return prev.some(p => p._id === id) 
                        ? prev.map(p => p._id === id ? updatedProject : p)
                        : [...prev, updatedProject];
                } else {
                    return prev.filter(p => p._id !== id);
                }
            });
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
            setFeaturedProjects(prev => prev.filter(project => project._id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const value = {
        projects,
        featuredProjects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        refreshProjects: fetchProjects
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}; 