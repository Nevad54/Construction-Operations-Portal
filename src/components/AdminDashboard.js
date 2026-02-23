import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { DashboardLayout } from './dashboard';
import { Button, Card, CardHeader, CardTitle, CardContent, Modal, ModalFooter, Input, Textarea, Select, EmptyState, useToast, ToastContainer } from './ui';
import ProjectCard from './ProjectCard';
import FileManager from './files/FileManager';
import AccountSettings from './auth/AccountSettings';

const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';

const Admin = () => {
    const { projects, addProject, updateProject, deleteProject, refreshProjects, loading, error: projectsError } = useProjects();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState({ ongoing: [], completed: [] });
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const modalRef = useRef(null);
    const { toasts, success, error, removeToast } = useToast();

    // refs for shift-click range
    const lastSelectedIndex = useRef({ ongoing: null, completed: null });
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
    const [isFallback, setIsFallback] = useState(false);
    const isProjectsPage = location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/projects';
    const isFilesPage = location.pathname === '/admin/dashboard/files';
    const isSettingsPage = location.pathname === '/admin/dashboard/settings';
    const adminPageMeta = useMemo(() => {
        if (location.pathname === '/admin/dashboard/clients') {
            return { title: 'Contacts', description: 'Client and inquiry management will appear here.' };
        }
        if (location.pathname === '/admin/dashboard/reports') {
            return { title: 'Analytics', description: 'Dashboards and performance reports will appear here.' };
        }
        if (location.pathname === '/admin/dashboard/files') {
            return { title: 'File Management', description: 'Centralized files for admin, users, and clients.' };
        }
        if (location.pathname === '/admin/dashboard/settings') {
            return { title: 'Settings', description: 'Admin preferences and account settings will appear here.' };
        }
        return { title: 'Admin', description: 'This admin section is under construction.' };
    }, [location.pathname]);

    // Initialize AOS
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-in-out'
        });
    }, []);

    // Refresh AOS on route/content changes (SPA navigation won't remount everything).
    useEffect(() => {
        // In some environments AOS may not be available during SSR/build.
        try {
            AOS.refreshHard();
        } catch (_) {
            try { AOS.refresh(); } catch (__) {}
        }
    }, [location.pathname, projects.length, loading]);

    // Fetch API status (to detect fallback mode)
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${IMAGE_BASE_URL}/api/status`);
                if (!res.ok) return;
                const json = await res.json();
                setIsFallback(!!json.usingFallback);
            } catch (e) {
                // If status check fails, assume fallback (safe for UI)
                setIsFallback(true);
            }
        };
        checkStatus();
    }, []);

    // Handle image preview - memoized
    const handleImageChange = useCallback((e, isEdit = false) => {
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
    }, []);

    // Handle form input changes - memoized
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    // Handle project edit - memoized
    const handleEdit = useCallback((project) => {
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
    }, []);

    // Handle edit submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        // Validate required fields and lengths
        if (!editingProject.title || !editingProject.description) {
            error('Please fill in all required fields');
            return;
        }
        if (editingProject.title.trim().length < 3 || editingProject.title.trim().length > 150) {
            error('Title must be between 3 and 150 characters');
            return;
        }
        if (editingProject.description.trim().length < 10) {
            error('Description must be at least 10 characters');
            return;
        }
        try {

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
        } catch (err) {
            console.error('Error updating project:', err);
            error('Error updating project: ' + (err.message || String(err)));
        } finally {
            setSaving(false);
        }
    };

    // Handle form submission for new projects
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate required fields and lengths
        if (!formData.title || !formData.description) {
            error('Please fill in all required fields');
            return;
        }
        if (formData.title.trim().length < 3 || formData.title.trim().length > 150) {
            error('Title must be between 3 and 150 characters');
            return;
        }
        if (formData.description.trim().length < 10) {
            error('Description must be at least 10 characters');
            return;
        }
        try {
            setSaving(true);

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
        } catch (err) {
            console.error('Error adding project:', err);
            error('Error adding project: ' + (err.message || String(err)));
        } finally {
            setSaving(false);
        }
    };

    // Handle project deletion
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await deleteProject(id);
                success('Project deleted successfully');
                // Refresh the projects list after deletion
                await refreshProjects();
            } catch (err) {
                error('Error deleting project: ' + (err.message || String(err)));
            }
        }
    };

    // Select all / clear all - memoized
    const handleSelectAll = useCallback((section) => {
        const ids = projects.filter(p => p.status === section).map(p => p._id);
        setSelectedProjects(prev => ({ ...prev, [section]: ids }));
    }, [projects]);
    
    const handleClearAll = useCallback((section) => {
        setSelectedProjects(prev => ({ ...prev, [section]: [] }));
    }, []);

    // Google Drive-style card selection with shift for range - memoized
    const handleCardSelect = useCallback((section, id, index, event) => {
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
    }, [projects]);

    // Handle click outside modal - memoized
    const handleClickOutside = useCallback((event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            setShowModal(false);
        }
    }, []);

    // Handle bulk delete
    const handleBulkDelete = async (section) => {
        if (selectedProjects[section].length === 0) {
            alert('Please select at least one project to delete.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedProjects[section].length} project(s)?`)) {
            try {
                await Promise.all(selectedProjects[section].map(id => deleteProject(id)));
                setSelectedProjects(prev => ({ ...prev, [section]: [] }));
                success(`${selectedProjects[section].length} project(s) deleted successfully`);
                // Refresh the projects list after deletion
                await refreshProjects();
            } catch (err) {
                error('Error during bulk delete: ' + (err.message || String(err)));
            }
        }
    };

    // Close modal when clicking outside
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    const normalizedSearch = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

    const filteredProjects = useMemo(() => {
        if (!normalizedSearch) return projects;

        return projects.filter((p) => {
            const haystack = [
                p.title,
                p.description,
                p.location,
                p.owner,
                p.status
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [projects, normalizedSearch]);

    // Filter projects by status - memoized for performance
    const ongoingProjects = useMemo(() => 
        filteredProjects.filter(p => p.status === 'ongoing'), 
        [filteredProjects]
    );
    
    const completedProjects = useMemo(() => 
        filteredProjects.filter(p => p.status === 'completed'), 
        [filteredProjects]
    );


    return (
        <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            <div className="space-y-6 animate-fade-in">
                {isFilesPage && (
                    <FileManager expectedRole="admin" title="Admin File Management" />
                )}

                {isSettingsPage && (
                    <AccountSettings mode="admin" />
                )}

                {!isProjectsPage && !isFilesPage && !isSettingsPage && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{adminPageMeta.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-text-secondary dark:text-gray-400">{adminPageMeta.description}</p>
                        </CardContent>
                    </Card>
                )}

                {isProjectsPage && loading && (
                    <Card>
                        <CardContent>
                            <p className="text-text-secondary dark:text-gray-400">Loading projects...</p>
                        </CardContent>
                    </Card>
                )}

                {isProjectsPage && projectsError && (
                    <Card>
                        <CardContent className="space-y-3">
                            <p className="text-feedback-error">{projectsError}</p>
                            <Button variant="outline" size="sm" onClick={() => refreshProjects()}>
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {isProjectsPage && (
                <>
                {isFallback && (
                    <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-400 dark:border-yellow-700 p-3 mb-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">Notice: The app is currently using a local in-memory fallback (changes are stored locally). Connect to the real database to persist changes to Atlas.</p>
                    </div>
                )}
                {/* Page title + Add project */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-aos="fade-up">
                    <h1 className="text-2xl font-bold text-text-primary dark:text-gray-100">Project Management</h1>
                    <Button
                        onClick={() => setShowModal(true)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Add New Project
                    </Button>
                </div>

                {/* Ongoing Projects */}
                <Card data-aos="fade-up" data-aos-delay="100">
                    <CardHeader className="flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Ongoing Projects</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkDelete('ongoing')}
                                disabled={!selectedProjects.ongoing.length}
                            >
                                Delete Selected
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSelectAll('ongoing')}>
                                Select All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleClearAll('ongoing')}>
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {ongoingProjects.length === 0 ? (
                            <EmptyState
                                title="No ongoing projects"
                                description="Start by adding your first ongoing project."
                                icon={
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                }
                                action={
                                    <Button onClick={() => setShowModal(true)}>
                                        Add Project
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ongoingProjects.map((project, index) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        index={index}
                                        section="ongoing"
                                        selected={selectedProjects.ongoing.includes(project._id)}
                                        onSelect={handleCardSelect}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        cardRef={cardRefs.current.ongoing[project._id]}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Projects */}
                <Card data-aos="fade-up" data-aos-delay="150">
                    <CardHeader className="flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Completed Projects</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkDelete('completed')}
                                disabled={!selectedProjects.completed.length}
                            >
                                Delete Selected
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSelectAll('completed')}>
                                Select All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleClearAll('completed')}>
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {completedProjects.length === 0 ? (
                            <EmptyState
                                title="No completed projects"
                                description="Completed projects will appear here once marked as done."
                                icon={
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completedProjects.map((project, index) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        index={index}
                                        section="completed"
                                        selected={selectedProjects.completed.includes(project._id)}
                                        onSelect={handleCardSelect}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        cardRef={cardRefs.current.completed[project._id]}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                </>
                )}
            </div>

            {/* Modal */}
            {isProjectsPage && (
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingProject(null);
                    setImagePreview(null);
                    setEditImagePreview(null);
                }}
                title={editingProject ? 'Edit Project' : 'Add New Project'}
                size="lg"
            >
                <form onSubmit={editingProject ? handleEditSubmit : handleSubmit} className="space-y-4">
                    <Input
                        label="Project Title"
                        name="title"
                        placeholder="Enter project title"
                        value={editingProject ? editingProject.title : formData.title}
                        onChange={editingProject ? e => setEditingProject({ ...editingProject, title: e.target.value }) : handleInputChange}
                        required
                    />
                    
                    <Textarea
                        label="Project Description"
                        name="description"
                        placeholder="Describe the project details"
                        value={editingProject ? editingProject.description : formData.description}
                        onChange={editingProject ? e => setEditingProject({ ...editingProject, description: e.target.value }) : handleInputChange}
                        required
                    />
                    
                    <Input
                        label="Location"
                        name="location"
                        placeholder="Project location"
                        value={editingProject ? editingProject.location : formData.location}
                        onChange={editingProject ? e => setEditingProject({ ...editingProject, location: e.target.value }) : handleInputChange}
                    />
                    
                    <Input
                        label="Date"
                        name="date"
                        type="date"
                        value={editingProject ? editingProject.date : formData.date}
                        onChange={editingProject ? e => setEditingProject({ ...editingProject, date: e.target.value }) : handleInputChange}
                    />
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">
                            Project Image
                        </label>
                        <input
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={e => editingProject ? handleImageChange(e, true) : handleImageChange(e)}
                            className="w-full px-3 py-2.5 rounded-xl border border-stroke bg-surface-card text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-subtle file:text-brand hover:file:bg-brand-subtle/80"
                        />
                        {(editingProject ? editImagePreview : imagePreview) && (
                            <img 
                                src={editingProject ? `${IMAGE_BASE_URL}${editImagePreview}` : imagePreview} 
                                alt="Preview" 
                                className="mt-2 w-full h-48 object-cover rounded-xl"
                            />
                        )}
                    </div>
                    
                    <Select
                        label="Status"
                        name="status"
                        value={editingProject ? editingProject.status : formData.status}
                        onChange={editingProject ? e => setEditingProject({ ...editingProject, status: e.target.value }) : handleInputChange}
                        options={[
                            { value: 'ongoing', label: 'Ongoing' },
                            { value: 'completed', label: 'Completed' }
                        ]}
                    />
                    
                    <ModalFooter>
                        <Button 
                            variant="secondary" 
                            onClick={() => { 
                                setShowModal(false); 
                                setEditingProject(null); 
                                setImagePreview(null); 
                                setEditImagePreview(null); 
                            }}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            loading={saving}
                        >
                            {editingProject ? 'Save Changes' : 'Add Project'}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
            )}

            {/* Toast Container */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </DashboardLayout>
    );
};

export default Admin;
