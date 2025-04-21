import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import '../styles/Admin.css';

const Admin = () => {
    const { projects, addProject, updateProject, deleteProject } = useProjects();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedProjects, setSelectedProjects] = useState({ ongoing: [], completed: [] });
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const modalRef = useRef(null);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        date: '',
        image: null,
        status: 'ongoing',
        featured: false
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState(null);

    // Handle image preview
    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (isEdit) {
                    setEditImagePreview(reader.result);
                } else {
                    setImagePreview(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            await addProject(formDataToSend);
            setFormData({
                title: '',
                description: '',
                location: '',
                date: '',
                image: null,
                status: 'ongoing',
                featured: false
            });
            setImagePreview(null);
        } catch (error) {
            setError('Error adding project: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle project edit
    const handleEdit = (project) => {
        setEditingProject(project);
        setEditImagePreview(project.image);
        setShowModal(true);
    };

    // Handle edit submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const formDataToSend = new FormData();
            Object.keys(editingProject).forEach(key => {
                formDataToSend.append(key, editingProject[key]);
            });

            await updateProject(editingProject._id, formDataToSend);
            setShowModal(false);
            setEditingProject(null);
            setEditImagePreview(null);
        } catch (error) {
            setError('Error updating project: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle project deletion
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                setLoading(true);
                await deleteProject(id);
            } catch (error) {
                setError('Error deleting project: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle bulk selection
    const handleBulkSelect = (section, checked) => {
        const sectionProjects = projects.filter(p => p.status === section);
        setSelectedProjects(prev => ({
            ...prev,
            [section]: checked ? sectionProjects.map(p => p._id) : []
        }));
    };

    // Handle individual selection
    const handleSelect = (section, id, checked) => {
        setSelectedProjects(prev => ({
            ...prev,
            [section]: checked
                ? [...prev[section], id]
                : prev[section].filter(projectId => projectId !== id)
        }));
    };

    // Handle bulk delete
    const handleBulkDelete = async (section) => {
        if (selectedProjects[section].length === 0) {
            alert('Please select at least one project to delete.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedProjects[section].length} project(s)?`)) {
            try {
                setLoading(true);
                await Promise.all(selectedProjects[section].map(id => deleteProject(id)));
                setSelectedProjects(prev => ({ ...prev, [section]: [] }));
            } catch (error) {
                setError('Error during bulk delete: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter projects by status
    const ongoingProjects = projects.filter(p => p.status === 'ongoing');
    const completedProjects = projects.filter(p => p.status === 'completed');

    return (
        <div className="admin-container">
            <h1>Admin - Manage Projects</h1>

            {loading && <div className="loading-spinner">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="project-form">
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Project Title"
                    required
                />
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Project Description"
                    required
                />
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Project Location"
                    required
                />
                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                />
                <input
                    type="file"
                    name="image"
                    onChange={(e) => handleImageChange(e)}
                    accept="image/*"
                />
                {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                )}
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                </select>
                <label>
                    <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                    />
                    Featured Project
                </label>
                <button type="submit">Add Project</button>
            </form>

            <div className="projects-section">
                <h2>Ongoing Projects</h2>
                {ongoingProjects.length > 0 && (
                    <div className="bulk-actions">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedProjects.ongoing.length === ongoingProjects.length}
                                onChange={(e) => handleBulkSelect('ongoing', e.target.checked)}
                            />
                            Select All
                        </label>
                        <span>{selectedProjects.ongoing.length} items selected</span>
                        <button
                            onClick={() => handleBulkDelete('ongoing')}
                            disabled={selectedProjects.ongoing.length === 0}
                        >
                            Delete Selected
                        </button>
                    </div>
                )}
                <div className="projects-list">
                    {ongoingProjects.map(project => (
                        <div key={project._id} className="project">
                            <input
                                type="checkbox"
                                checked={selectedProjects.ongoing.includes(project._id)}
                                onChange={(e) => handleSelect('ongoing', project._id, e.target.checked)}
                            />
                            {project.image && <img src={project.image} alt={project.title} />}
                            <div className="project-content">
                                <h3>
                                    {project.title}
                                    {project.featured && <span className="featured-star">★</span>}
                                </h3>
                                <p>{project.description}</p>
                                <p><strong>Location:</strong> {project.location || 'N/A'}</p>
                                <p><strong>Date Completed:</strong> {project.date ? new Date(project.date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Featured:</strong> {project.featured ? 'Yes' : 'No'}</p>
                            </div>
                            <div className="project-actions">
                                <button onClick={() => handleEdit(project)}>
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                                <button onClick={() => handleDelete(project._id)}>
                                    <i className="fas fa-trash-alt"></i> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="projects-section">
                <h2>Completed Projects</h2>
                {completedProjects.length > 0 && (
                    <div className="bulk-actions">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedProjects.completed.length === completedProjects.length}
                                onChange={(e) => handleBulkSelect('completed', e.target.checked)}
                            />
                            Select All
                        </label>
                        <span>{selectedProjects.completed.length} items selected</span>
                        <button
                            onClick={() => handleBulkDelete('completed')}
                            disabled={selectedProjects.completed.length === 0}
                        >
                            Delete Selected
                        </button>
                    </div>
                )}
                <div className="projects-list">
                    {completedProjects.map(project => (
                        <div key={project._id} className="project">
                            <input
                                type="checkbox"
                                checked={selectedProjects.completed.includes(project._id)}
                                onChange={(e) => handleSelect('completed', project._id, e.target.checked)}
                            />
                            {project.image && <img src={project.image} alt={project.title} />}
                            <div className="project-content">
                                <h3>
                                    {project.title}
                                    {project.featured && <span className="featured-star">★</span>}
                                </h3>
                                <p>{project.description}</p>
                                <p><strong>Location:</strong> {project.location || 'N/A'}</p>
                                <p><strong>Date Completed:</strong> {project.date ? new Date(project.date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Featured:</strong> {project.featured ? 'Yes' : 'No'}</p>
                            </div>
                            <div className="project-actions">
                                <button onClick={() => handleEdit(project)}>
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                                <button onClick={() => handleDelete(project._id)}>
                                    <i className="fas fa-trash-alt"></i> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && editingProject && (
                <div className="modal">
                    <div className="modal-content" ref={modalRef}>
                        <span className="close" onClick={() => setShowModal(false)}>×</span>
                        <h2>Edit Project</h2>
                        <form onSubmit={handleEditSubmit}>
                            <input
                                type="text"
                                name="title"
                                value={editingProject.title}
                                onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                                placeholder="Project Title"
                                required
                            />
                            <textarea
                                name="description"
                                value={editingProject.description}
                                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                                placeholder="Project Description"
                                required
                            />
                            <input
                                type="text"
                                name="location"
                                value={editingProject.location}
                                onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                                placeholder="Project Location"
                                required
                            />
                            <input
                                type="date"
                                name="date"
                                value={editingProject.date ? new Date(editingProject.date).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditingProject({ ...editingProject, date: e.target.value })}
                            />
                            <input
                                type="file"
                                name="image"
                                onChange={(e) => handleImageChange(e, true)}
                                accept="image/*"
                            />
                            {editImagePreview && (
                                <img src={editImagePreview} alt="Preview" className="image-preview" />
                            )}
                            <select
                                name="status"
                                value={editingProject.status}
                                onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                                required
                            >
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                            <label>
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={editingProject.featured}
                                    onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                                />
                                Featured Project
                            </label>
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

            <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                ↑ Top
            </button>
        </div>
    );
};

export default Admin; 