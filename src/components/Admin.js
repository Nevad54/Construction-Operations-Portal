import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import { api } from '../services/api';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Admin.css';

const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';

const Admin = () => {
    const { projects, addProject, updateProject, deleteProject, refreshProjects } = useProjects();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedProjects, setSelectedProjects] = useState({ ongoing: [], completed: [] });
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const modalRef = useRef(null);

    // refs for shift-click range
    const lastSelectedIndex = useRef({ ongoing: null, completed: null });
    // Lasso selection state
    const [isLassoActive, setLassoActive] = useState(false);
    const [lassoStart, setLassoStart] = useState({ x: 0, y: 0 });
    const [selectionBox, setSelectionBox] = useState(null);
    const cardRefs = useRef({ ongoing: {}, completed: {} });

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        date: '',
        image: null,
        status: 'ongoing'
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState(null);

    // Initialize AOS
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-in-out'
        });
    }, []);

    // Handle image preview
    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (isEdit) {
                    setEditImagePreview(reader.result);
                    setEditingProject(prev => ({ ...prev, image: file }));
                } else {
                    setImagePreview(reader.result);
                    setFormData(prev => ({ ...prev, image: file }));
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

    // Handle project edit
    const handleEdit = (project) => {
        // Format the date to YYYY-MM-DD for the date input
        const formattedDate = project.date ? new Date(project.date).toISOString().split('T')[0] : '';
        const { featured, ...projectWithoutFeatured } = project; // Remove featured field
        setEditingProject({
            ...projectWithoutFeatured,
            date: formattedDate,
            location: project.location || '',
            owner: project.owner || ''
        });
        setEditImagePreview(project.image);
        setShowModal(true);
    };

    // Handle edit submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            // Validate required fields
            if (!editingProject.title || !editingProject.description) {
                throw new Error('Please fill in all required fields');
            }

            // Create a clean object with only the fields we want to update
            const updateData = {
                title: editingProject.title,
                description: editingProject.description,
                location: editingProject.location || '',
                owner: editingProject.owner || '',
                status: editingProject.status || 'ongoing',
                date: editingProject.date ? new Date(editingProject.date).toISOString() : null
            };

            // If there's a new image file, create FormData
            let dataToSend;
            if (editingProject.image instanceof File) {
                dataToSend = new FormData();
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] !== null && updateData[key] !== undefined) {
                        dataToSend.append(key, updateData[key]);
                    }
                });
                dataToSend.append('image', editingProject.image);
            } else {
                dataToSend = updateData;
            }

            // Log the data being sent
            console.log('Updating project with data:', updateData);
            
            // First, update the project
            const response = await updateProject(editingProject._id, dataToSend);
            console.log('Project updated successfully:', response);

            // Then, refresh the projects list
            await refreshProjects();

            // Get the updated project from the response
            const updatedProject = response;
            console.log('Updated project from response:', updatedProject);

            if (!updatedProject) {
                throw new Error('Failed to get updated project data');
            }
            
            setShowModal(false);
            setEditingProject(null);
            setEditImagePreview(null);
        } catch (error) {
            console.error('Error updating project:', error);
            setError('Error updating project: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle form submission for new projects
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            
            // Validate required fields
            if (!formData.title || !formData.description) {
                throw new Error('Please fill in all required fields');
            }

            // Create a regular object for JSON submission
            const projectDataObj = {
                title: formData.title,
                description: formData.description,
                location: formData.location || '',
                date: formData.date ? new Date(formData.date).toISOString() : null,
                status: formData.status || 'ongoing'
            };

            // If there's an image, use FormData, otherwise use JSON
            let dataToSend;
            if (formData.image) {
                dataToSend = new FormData();
                Object.keys(projectDataObj).forEach(key => {
                    if (projectDataObj[key] !== null && projectDataObj[key] !== undefined) {
                        dataToSend.append(key, projectDataObj[key]);
                    }
                });
                dataToSend.append('image', formData.image);
            } else {
                dataToSend = projectDataObj;
            }

            // Log the data being sent
            console.log('Creating project with data:', formData.image ? 'FormData with image' : projectDataObj);
            
            const response = await addProject(dataToSend);
            console.log('Project created successfully:', response);

            // Refresh the projects list after creation
            await refreshProjects();
            
            setFormData({
                title: '',
                description: '',
                location: '',
                date: '',
                image: null,
                status: 'ongoing'
            });
            setImagePreview(null);
            setShowModal(false);
        } catch (error) {
            console.error('Error adding project:', error);
            setError('Error adding project: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle project deletion
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                setLoading(true);
                setError(null);
                setSuccess(null);
                await deleteProject(id);
                setSuccess('Project deleted successfully');
                // Refresh the projects list after deletion
                await refreshProjects();
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

    // Select all / clear all
    const handleSelectAll = (section) => {
        const ids = projects.filter(p => p.status === section).map(p => p._id);
        setSelectedProjects(prev => ({ ...prev, [section]: ids }));
    };
    const handleClearAll = (section) => {
        setSelectedProjects(prev => ({ ...prev, [section]: [] }));
    };

    // Google Drive-style card selection with shift for range
    const handleCardSelect = (section, id, index, event) => {
        const multi = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;
        const list = projects.filter(p => p.status === section);
        setSelectedProjects(prev => {
            if (shift && lastSelectedIndex.current[section] !== null) {
                const start = Math.min(lastSelectedIndex.current[section], index);
                const end = Math.max(lastSelectedIndex.current[section], index);
                const rangeIds = list.slice(start, end + 1).map(p => p._id);
                return { ...prev, [section]: rangeIds };
            }
            const already = prev[section].includes(id);
            if (multi) {
                return { ...prev, [section]: already ? prev[section].filter(x => x !== id) : [...prev[section], id] };
            }
            return { ...prev, [section]: already ? [] : [id] };
        });
        lastSelectedIndex.current[section] = index;
    };

    // Lasso select implementations
    const handleLassoStart = (section, e) => {
        if (e.target !== e.currentTarget) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setLassoActive(true);
        setLassoStart({ x, y });
        setSelectionBox({ x, y, width: 0, height: 0 });
    };
    const handleLassoMove = (section, e) => {
        if (!isLassoActive || !selectionBox) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const x0 = lassoStart.x;
        const y0 = lassoStart.y;
        setSelectionBox({
            x: Math.min(x0, x),
            y: Math.min(y0, y),
            width: Math.abs(x - x0),
            height: Math.abs(y - y0)
        });
    };
    const handleLassoEnd = (section, e) => {
        if (!isLassoActive || !selectionBox) return;
        setLassoActive(false);
        const list = projects.filter(p => p.status === section);
        const rect = e.currentTarget.getBoundingClientRect();
        const selectedIds = list.filter(p => {
            const card = cardRefs.current[section][p._id];
            if (!card) return false;
            const cr = card.getBoundingClientRect();
            const box = {
                left: cr.left - rect.left,
                top: cr.top - rect.top,
                right: cr.left - rect.left + cr.width,
                bottom: cr.top - rect.top + cr.height
            };
            return !(box.left > selectionBox.x + selectionBox.width ||
                     box.right < selectionBox.x ||
                     box.top > selectionBox.y + selectionBox.height ||
                     box.bottom < selectionBox.y);
        }).map(p => p._id);
        setSelectedProjects(prev => ({ ...prev, [section]: selectedIds }));
        setSelectionBox(null);
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
                setError(null);
                setSuccess(null);
                await Promise.all(selectedProjects[section].map(id => deleteProject(id)));
                setSelectedProjects(prev => ({ ...prev, [section]: [] }));
                setSuccess(`${selectedProjects[section].length} project(s) deleted successfully`);
                // Refresh the projects list after deletion
                await refreshProjects();
            } catch (error) {
                setError('Error during bulk delete: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle click outside modal
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModal(false);
            }
        };

    // Close modal when clicking outside
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter projects by status
    const ongoingProjects = projects.filter(p => p.status === 'ongoing');
    const completedProjects = projects.filter(p => p.status === 'completed');

    // Add useEffect to clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="admin-container">
            <h1 data-aos="fade-up">Project Management</h1>
            
            {/* Add New Project Button */}
            <div className="admin-controls" data-aos="fade-up" data-aos-delay="100">
                <button 
                    className="add-project-btn"
                    onClick={() => setShowModal(true)}
                >
                    Add New Project
                </button>
            </div>

            {/* Project Sections */}
            <div className="project-sections">
                {/* Ongoing Projects */}
                <section className="project-section" data-aos="fade-up" data-aos-delay="200">
                    <h2>Ongoing Projects</h2>
                    <div className="section-controls">
                        <button onClick={() => handleBulkDelete('ongoing')} disabled={!selectedProjects.ongoing.length}>
                            Delete Selected
                        </button>
                        <button onClick={() => handleSelectAll('ongoing')}>Select All</button>
                        <button onClick={() => handleClearAll('ongoing')}>Clear Selection</button>
                    </div>
                    <div className="project-grid">
                        {ongoingProjects.map((project, index) => (
                            <div 
                                key={project._id}
                                className={`project-card ${selectedProjects.ongoing.includes(project._id) ? 'selected' : ''}`}
                                data-aos="fade-up"
                                data-aos-delay={300 + (index * 100)}
                            >
                                {project.image && (
                                    <img 
                                        src={`${IMAGE_BASE_URL}${project.image}`} 
                                        alt={project.title} 
                                        className="project-image"
                                    />
                                )}
                                <div className="project-content">
                                    <h3>{project.title}</h3>
                                    <p>{project.description}</p>
                                    <p><strong>Location:</strong> {project.location || 'N/A'}</p>
                                    <p><strong>Date Completed:</strong> {project.date ? new Date(project.date).toLocaleDateString() : 'N/A'}</p>
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
                </section>

                {/* Completed Projects */}
                <section className="project-section" data-aos="fade-up" data-aos-delay="200">
                    <h2>Completed Projects</h2>
                    <div className="section-controls">
                        <button onClick={() => handleBulkDelete('completed')} disabled={!selectedProjects.completed.length}>
                            Delete Selected
                        </button>
                        <button onClick={() => handleSelectAll('completed')}>Select All</button>
                        <button onClick={() => handleClearAll('completed')}>Clear Selection</button>
                    </div>
                    <div className="project-grid">
                        {completedProjects.map((project, index) => (
                            <div 
                                key={project._id}
                                className={`project-card ${selectedProjects.completed.includes(project._id) ? 'selected' : ''}`}
                                data-aos="fade-up"
                                data-aos-delay={300 + (index * 100)}
                            >
                                {project.image && (
                                    <img 
                                        src={`${IMAGE_BASE_URL}${project.image}`} 
                                        alt={project.title} 
                                        className="project-image"
                                    />
                                )}
                                <div className="project-content">
                                    <h3>{project.title}</h3>
                                    <p>{project.description}</p>
                                    <p><strong>Location:</strong> {project.location || 'N/A'}</p>
                                    <p><strong>Date Completed:</strong> {project.date ? new Date(project.date).toLocaleDateString() : 'N/A'}</p>
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
                </section>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleClickOutside}>
                    <div className="modal" ref={modalRef} data-aos="zoom-in">
                        <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                        <form onSubmit={editingProject ? handleEditSubmit : handleSubmit}>
                            <input
                                type="text"
                                name="title"
                                placeholder="Project Title"
                                value={editingProject ? editingProject.title : formData.title}
                                onChange={editingProject ? e => setEditingProject({ ...editingProject, title: e.target.value }) : handleInputChange}
                                required
                            />
                            <textarea
                                name="description"
                                placeholder="Project Description"
                                value={editingProject ? editingProject.description : formData.description}
                                onChange={editingProject ? e => setEditingProject({ ...editingProject, description: e.target.value }) : handleInputChange}
                                required
                            ></textarea>
                            <input
                                type="text"
                                name="location"
                                placeholder="Location"
                                value={editingProject ? editingProject.location : formData.location}
                                onChange={editingProject ? e => setEditingProject({ ...editingProject, location: e.target.value }) : handleInputChange}
                            />
                            <input
                                type="date"
                                name="date"
                                value={editingProject ? editingProject.date : formData.date}
                                onChange={editingProject ? e => setEditingProject({ ...editingProject, date: e.target.value }) : handleInputChange}
                            />
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={e => editingProject ? handleImageChange(e, true) : handleImageChange(e)}
                            />
                            {(editingProject ? editImagePreview : imagePreview) && (
                                <img src={editingProject ? `${IMAGE_BASE_URL}${editImagePreview}` : imagePreview} alt="Preview" className="image-preview" />
                            )}
                            <select
                                name="status"
                                value={editingProject ? editingProject.status : formData.status}
                                onChange={editingProject ? e => setEditingProject({ ...editingProject, status: e.target.value }) : handleInputChange}
                            >
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={() => { 
                                        setShowModal(false); 
                                        setEditingProject(null); 
                                        setImagePreview(null); 
                                        setEditImagePreview(null); 
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : (editingProject ? 'Save Changes' : 'Add Project')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Loading, Error, and Success States */}
            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
        </div>
    );
};

export default Admin;