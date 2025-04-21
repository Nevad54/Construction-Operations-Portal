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

            <button className="floating-add-btn" onClick={() => setShowModal(true)}>
                + New Project
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={e => { if (e.target.className === 'modal-overlay') setShowModal(false); }}>
                  <div className="modal-card">
                    <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                    <form className="project-modal-form" onSubmit={editingProject ? handleEditSubmit : handleSubmit}>
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
                        <img src={editingProject ? editImagePreview : imagePreview} alt="Preview" className="image-preview" />
                      )}
                      <select
                        name="status"
                        value={editingProject ? editingProject.status : formData.status}
                        onChange={editingProject ? e => setEditingProject({ ...editingProject, status: e.target.value }) : handleInputChange}
                      >
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                      </select>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={editingProject ? editingProject.featured : formData.featured}
                          onChange={editingProject ? e => setEditingProject({ ...editingProject, featured: e.target.checked }) : handleInputChange}
                        />
                        Featured Project
                      </label>
                      <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={() => { setShowModal(false); setEditingProject(null); setImagePreview(null); setEditImagePreview(null); }}>Cancel</button>
                        <button type="submit" className="submit-btn">{editingProject ? 'Save Changes' : 'Add Project'}</button>
                      </div>
                    </form>
                  </div>
                </div>
            )}

            <div className="projects-section">
                <h2>Ongoing Projects</h2>
                {selectedProjects.ongoing.length > 0 && (
                <div className="bulk-toolbar">
                    <span>{selectedProjects.ongoing.length} selected</span>
                    <div className="bulk-toolbar-actions">
                        <button onClick={() => handleSelectAll('ongoing')}>Select All</button>
                        <button onClick={() => handleClearAll('ongoing')}>Clear All</button>
                        <button onClick={() => handleBulkDelete('ongoing')}>Delete</button>
                    </div>
                </div>
                )}
                <div className="projects-list" onMouseDown={e => handleLassoStart('ongoing', e)} onMouseMove={e => handleLassoMove('ongoing', e)} onMouseUp={e => handleLassoEnd('ongoing', e)} style={{ position: 'relative' }}>
                    {ongoingProjects.map((project, idx) => (
                        <div key={project._id} ref={el => cardRefs.current.ongoing[project._id] = el} className={`project${selectedProjects.ongoing.includes(project._id) ? ' selected' : ''}`} tabIndex={0} onClick={e => handleCardSelect('ongoing', project._id, idx, e)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCardSelect('ongoing', project._id, idx, e); }}>
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
                    {selectionBox && <div className="lasso-box" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }} />}
                </div>
            </div>

            <div className="projects-section">
                <h2>Completed Projects</h2>
                {selectedProjects.completed.length > 0 && (
                <div className="bulk-toolbar">
                    <span>{selectedProjects.completed.length} selected</span>
                    <div className="bulk-toolbar-actions">
                        <button onClick={() => handleSelectAll('completed')}>Select All</button>
                        <button onClick={() => handleClearAll('completed')}>Clear All</button>
                        <button onClick={() => handleBulkDelete('completed')}>Delete</button>
                    </div>
                </div>
                )}
                <div className="projects-list" onMouseDown={e => handleLassoStart('completed', e)} onMouseMove={e => handleLassoMove('completed', e)} onMouseUp={e => handleLassoEnd('completed', e)} style={{ position: 'relative' }}>
                    {completedProjects.map((project, idx) => (
                        <div key={project._id} ref={el => cardRefs.current.completed[project._id] = el} className={`project${selectedProjects.completed.includes(project._id) ? ' selected' : ''}`} tabIndex={0} onClick={e => handleCardSelect('completed', project._id, idx, e)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCardSelect('completed', project._id, idx, e); }}>
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
                    {selectionBox && <div className="lasso-box" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }} />}
                </div>
            </div>



            <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                ↑
            </button>
        </div>
    );
};

export default Admin;