import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { DashboardLayout } from './dashboard';
import { Button, Card, CardHeader, CardTitle, CardContent, Modal, ModalFooter, Input, Textarea, Select, EmptyState, Badge, useToast, ToastContainer } from './ui';
import ProjectCard from './ProjectCard';
import FileManager from './files/FileManager';
import AccountSettings from './auth/AccountSettings';
import { api } from '../services/api';

const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';
const formatDateTimeLocalValue = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const offsetMs = parsed.getTimezoneOffset() * 60000;
    return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
};
const getInquiryFollowUpTime = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};
const isClosedInquiryStatus = (status) => ['resolved', 'spam'].includes(String(status || '').toLowerCase());
const isInquiryOverdue = (inquiry, now = Date.now()) => {
    if (!inquiry || isClosedInquiryStatus(inquiry.status)) return false;
    const followUpAt = getInquiryFollowUpTime(inquiry.nextFollowUpAt);
    return followUpAt > 0 && followUpAt < now;
};
const hasAssignedInquiryOwner = (inquiry) => Boolean(String(inquiry?.owner || inquiry?.assignedTo || '').trim());
const hasScheduledFollowUp = (inquiry) => getInquiryFollowUpTime(inquiry?.nextFollowUpAt) > 0;
const buildNextFollowUpIso = ({ days = 0, hours = 0, targetHour = null } = {}) => {
    const next = new Date();
    if (targetHour !== null) {
        next.setDate(next.getDate() + days);
        next.setHours(targetHour, 0, 0, 0);
    } else {
        next.setTime(next.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
    }
    return next.toISOString();
};

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
    const isClientsPage = location.pathname === '/admin/dashboard/clients';
    const isReportsPage = location.pathname === '/admin/dashboard/reports';
    const isSettingsPage = location.pathname === '/admin/dashboard/settings';
    const adminPageMeta = useMemo(() => {
        if (isProjectsPage) {
            return {
                eyebrow: 'Project Operations',
                title: 'Keep active work visible and delivery updates current.',
                description: 'Manage ongoing and completed jobs, keep ownership clear, and clean up portfolio records without digging through dense project cards first.',
                searchEnabled: true,
                searchPlaceholder: 'Search work orders, locations, or owners',
                searchAriaLabel: 'Search work orders',
            };
        }
        if (isClientsPage) {
            return {
                eyebrow: 'User and Inquiry Operations',
                title: 'Triage incoming demand and keep account access aligned.',
                description: 'Review inquiry ownership, follow-up load, and dashboard access from one operations queue instead of jumping between disconnected admin panels.',
                searchEnabled: false,
                searchPlaceholder: '',
                searchAriaLabel: '',
            };
        }
        if (isReportsPage) {
            return {
                eyebrow: 'Reporting',
                title: 'Read operational health before issues compound.',
                description: 'Track current inquiry pressure, delivery volume, user load, and recent admin activity from one analytics view.',
                searchEnabled: false,
                searchPlaceholder: '',
                searchAriaLabel: '',
            };
        }
        if (isFilesPage) {
            return {
                eyebrow: 'File Management',
                title: 'Control shared documentation without losing access discipline.',
                description: 'Use the admin file library to publish team and client documents while keeping visibility rules explicit.',
                searchEnabled: false,
                searchPlaceholder: '',
                searchAriaLabel: '',
            };
        }
        if (isSettingsPage) {
            return {
                eyebrow: 'Settings',
                title: 'Maintain admin account controls and workspace preferences.',
                description: 'Keep profile, authentication, and account-level preferences current before handing the portal to another operator.',
                searchEnabled: false,
                searchPlaceholder: '',
                searchAriaLabel: '',
            };
        }
        return {
            eyebrow: 'Admin Workspace',
            title: 'Admin workspace',
            description: 'Use the admin routes to manage projects, files, contacts, reporting, and account settings.',
            searchEnabled: false,
            searchPlaceholder: '',
            searchAriaLabel: '',
        };
    }, [isClientsPage, isFilesPage, isProjectsPage, isReportsPage, isSettingsPage]);

    const [adminUsers, setAdminUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userModal, setUserModal] = useState({ open: false, mode: 'create', user: null });
    const [userSaving, setUserSaving] = useState(false);
    const [userFormError, setUserFormError] = useState('');
    const [userForm, setUserForm] = useState({
        username: '',
        password: '',
        role: 'user',
        projectIds: '',
    });

    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState('');
    const [reportKpis, setReportKpis] = useState({
        new_today: 0,
        overdue_followups: 0,
        qualified_rate: 0,
        proposal_rate: 0,
    });
    const [reportUsers, setReportUsers] = useState([]);
    const [reportFiles, setReportFiles] = useState([]);
    const [reportActivity, setReportActivity] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [inquiriesLoading, setInquiriesLoading] = useState(false);
    const [inquiriesError, setInquiriesError] = useState('');
    const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
    const [inquirySearch, setInquirySearch] = useState('');
    const [inquiryPage, setInquiryPage] = useState(1);
    const [inquiryTotal, setInquiryTotal] = useState(0);
    const inquiryPageSize = 12;
    const [inquiryModal, setInquiryModal] = useState({ open: false, inquiry: null });
    const [inquiryForm, setInquiryForm] = useState({ status: 'new', priority: 'normal', owner: '', nextFollowUpAt: '', notes: '' });
    const [inquiryFormErrors, setInquiryFormErrors] = useState({});
    const [inquirySaving, setInquirySaving] = useState(false);

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

    const parseProjectIds = useCallback((raw) => {
        return String(raw || '')
            .split(/[,\n]/)
            .map((v) => v.trim())
            .filter(Boolean);
    }, []);

    const loadAdminUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            setUsersError('');
            const list = await api.adminListUsers();
            setAdminUsers(Array.isArray(list) ? list : []);
        } catch (err) {
            setUsersError(err.message || 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const loadReports = useCallback(async () => {
        try {
            setReportsLoading(true);
            setReportsError('');
            const [users, files, activity, inquiriesList, kpiResponse] = await Promise.all([
                api.adminListUsers(),
                api.getFiles(),
                api.getActivityLogs({ limit: 40 }),
                api.adminListInquiries({ status: 'all' }),
                api.adminGetKpis(),
            ]);
            setReportUsers(Array.isArray(users) ? users : []);
            setReportFiles(Array.isArray(files) ? files : []);
            setReportActivity(Array.isArray(activity?.logs) ? activity.logs : []);
            setInquiries(Array.isArray(inquiriesList) ? inquiriesList : []);
            setReportKpis({
                new_today: Number(kpiResponse?.kpis?.new_today || 0),
                overdue_followups: Number(kpiResponse?.kpis?.overdue_followups || 0),
                qualified_rate: Number(kpiResponse?.kpis?.qualified_rate || 0),
                proposal_rate: Number(kpiResponse?.kpis?.proposal_rate || 0),
            });
        } catch (err) {
            setReportsError(err.message || 'Failed to load reports');
        } finally {
            setReportsLoading(false);
        }
    }, []);

    const loadInquiries = useCallback(async () => {
        try {
            setInquiriesLoading(true);
            setInquiriesError('');
            const result = await api.adminListInquiries({
                status: inquiryStatusFilter,
                q: inquirySearch,
                limit: inquiryPageSize,
                skip: (inquiryPage - 1) * inquiryPageSize,
            });
            if (Array.isArray(result)) {
                setInquiries(result);
                setInquiryTotal(result.length);
            } else {
                const items = Array.isArray(result?.items) ? result.items : [];
                setInquiries(items);
                setInquiryTotal(Number(result?.total || 0));
            }
        } catch (err) {
            setInquiriesError(err.message || 'Failed to load inquiries');
        } finally {
            setInquiriesLoading(false);
        }
    }, [inquiryPage, inquirySearch, inquiryStatusFilter]);

    useEffect(() => {
        setInquiryPage(1);
    }, [inquiryStatusFilter, inquirySearch]);

    useEffect(() => {
        if (isClientsPage || isReportsPage) {
            loadAdminUsers();
        }
    }, [isClientsPage, isReportsPage, loadAdminUsers]);

    useEffect(() => {
        if (isClientsPage) {
            loadInquiries();
        }
    }, [isClientsPage, loadInquiries]);

    useEffect(() => {
        if (isReportsPage) {
            loadReports();
        }
    }, [isReportsPage, loadReports]);

    const openUserModal = useCallback((mode, user = null) => {
        setUserFormError('');
        setUserModal({ open: true, mode, user });
        if (mode === 'create') {
            setUserForm({
                username: '',
                password: '',
                role: 'user',
                projectIds: '',
            });
            return;
        }
        if (mode === 'edit' && user) {
            setUserForm({
                username: user.username || '',
                password: '',
                role: user.role || 'user',
                projectIds: Array.isArray(user.projectIds) ? user.projectIds.join(', ') : '',
            });
            return;
        }
        setUserForm({
            username: user?.username || '',
            password: '',
            role: user?.role || 'user',
            projectIds: '',
        });
    }, []);

    const closeUserModal = useCallback(() => {
        if (userSaving) return;
        setUserModal({ open: false, mode: 'create', user: null });
        setUserFormError('');
    }, [userSaving]);

    const handleUserSave = useCallback(async (e) => {
        e.preventDefault();
        const mode = userModal.mode;
        const targetUser = userModal.user;
        const username = String(userForm.username || '').trim();
        const role = String(userForm.role || 'user').trim();
        const password = String(userForm.password || '');
        const projectIds = parseProjectIds(userForm.projectIds);

        if (mode === 'create') {
            if (!username || !password) {
                setUserFormError('Username and password are required.');
                return;
            }
        } else if (mode === 'reset') {
            if (!password || password.length < 4) {
                setUserFormError('Please enter a new password (minimum 4 characters).');
                return;
            }
        } else if (!username) {
            setUserFormError('Username is required.');
            return;
        }

        try {
            setUserSaving(true);
            setUserFormError('');
            if (mode === 'create') {
                await api.adminCreateUser({ username, password, role });
                success('User created');
            } else if (mode === 'edit' && targetUser?.id) {
                await api.adminUpdateUser(targetUser.id, { username, role, projectIds });
                success('User updated');
            } else if (mode === 'reset' && targetUser?.id) {
                await api.adminResetUserPassword(targetUser.id, password);
                success('Password reset');
            }
            await loadAdminUsers();
            if (isReportsPage) await loadReports();
            closeUserModal();
        } catch (err) {
            setUserFormError(err.message || 'Failed to save user');
        } finally {
            setUserSaving(false);
        }
    }, [closeUserModal, isReportsPage, loadAdminUsers, loadReports, parseProjectIds, success, userForm, userModal]);

    const handleDeleteUser = useCallback(async (user) => {
        if (!user?.id) return;
        const confirmed = window.confirm(`Delete user "${user.username}"?`);
        if (!confirmed) return;
        try {
            await api.adminDeleteUser(user.id);
            success('User deleted');
            await loadAdminUsers();
            if (isReportsPage) await loadReports();
        } catch (err) {
            error(err.message || 'Failed to delete user');
        }
    }, [error, isReportsPage, loadAdminUsers, loadReports, success]);

    const openInquiryModal = useCallback((inquiry) => {
        if (!inquiry) return;
        setInquiryModal({ open: true, inquiry });
        setInquiryForm({
            status: String(inquiry.status || 'new'),
            priority: String(inquiry.priority || 'normal'),
            owner: String(inquiry.owner || inquiry.assignedTo || ''),
            nextFollowUpAt: formatDateTimeLocalValue(inquiry.nextFollowUpAt),
            notes: String(inquiry.notes || ''),
        });
        setInquiryFormErrors({});
    }, []);

    const closeInquiryModal = useCallback(() => {
        if (inquirySaving) return;
        setInquiryModal({ open: false, inquiry: null });
        setInquiryFormErrors({});
    }, [inquirySaving]);

    const handleSaveInquiry = useCallback(async (e) => {
        e.preventDefault();
        const id = inquiryModal?.inquiry?.id;
        if (!id) return;
        const nextErrors = {};
        if (!String(inquiryForm.status || '').trim()) {
            nextErrors.status = 'Status is required';
        }
        if (!String(inquiryForm.owner || '').trim()) {
            nextErrors.owner = 'Owner is required';
        }
        if (!['resolved', 'spam'].includes(String(inquiryForm.status || '')) && !String(inquiryForm.nextFollowUpAt || '').trim()) {
            nextErrors.nextFollowUpAt = 'Next follow-up date is required for active inquiries';
        }
        if (Object.keys(nextErrors).length > 0) {
            setInquiryFormErrors(nextErrors);
            return;
        }
        try {
            setInquirySaving(true);
            setInquiryFormErrors({});
            await api.adminUpdateInquiry(id, {
                status: inquiryForm.status,
                priority: inquiryForm.priority,
                owner: inquiryForm.owner,
                assignedTo: inquiryForm.owner,
                nextFollowUpAt: ['resolved', 'spam'].includes(String(inquiryForm.status || '')) ? '' : inquiryForm.nextFollowUpAt,
                notes: inquiryForm.notes,
            });
            success('Inquiry updated');
            await loadInquiries();
            if (isReportsPage) await loadReports();
            closeInquiryModal();
        } catch (err) {
            error(err.message || 'Failed to update inquiry');
        } finally {
            setInquirySaving(false);
        }
    }, [closeInquiryModal, error, inquiryForm.nextFollowUpAt, inquiryForm.notes, inquiryForm.owner, inquiryForm.priority, inquiryForm.status, inquiryModal?.inquiry?.id, isReportsPage, loadInquiries, loadReports, success]);

    const handleDeleteInquiry = useCallback(async (inquiry) => {
        if (!inquiry?.id) return;
        const confirmed = window.confirm(`Delete inquiry from "${inquiry.name}"? This cannot be undone.`);
        if (!confirmed) return;
        const typed = window.prompt('Type DELETE to confirm permanent removal.');
        if (typed !== 'DELETE') return;
        try {
            await api.adminDeleteInquiry(inquiry.id);
            success('Inquiry deleted');
            await loadInquiries();
            if (isReportsPage) await loadReports();
        } catch (err) {
            error(err.message || 'Failed to delete inquiry');
        }
    }, [error, isReportsPage, loadInquiries, loadReports, success]);

    const visibleUsers = useMemo(() => {
        if (userRoleFilter === 'all') return adminUsers;
        return adminUsers.filter((u) => String(u.role || '') === userRoleFilter);
    }, [adminUsers, userRoleFilter]);

    // helper for downloading blobs
    const downloadBlob = useCallback((blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    // export helpers (use server endpoints with params)
    const handleExportActivity = useCallback(async () => {
        try {
            const blob = await api.adminExportActivity({ limit: 0 }); // 0 => no limit
            downloadBlob(blob, 'activity_logs.csv');
            success('Activity CSV download started');
        } catch (err) {
            error(err.message || 'Failed to export activity');
        }
    }, [downloadBlob, error, success]);

    const handleExportUsersCsv = useCallback(async () => {
        try {
            const params = {};
            if (userRoleFilter && userRoleFilter !== 'all') params.role = userRoleFilter;
            const blob = await api.adminExportUsers(params);
            downloadBlob(blob, 'users.csv');
            success('Users CSV download started');
        } catch (err) {
            error(err.message || 'Failed to export users');
        }
    }, [downloadBlob, error, success, userRoleFilter]);

    const handleExportInquiriesCsv = useCallback(async () => {
        try {
            const params = {};
            if (inquiryStatusFilter && inquiryStatusFilter !== 'all') params.status = inquiryStatusFilter;
            const blob = await api.adminExportInquiries(params);
            downloadBlob(blob, 'inquiries.csv');
            success('Inquiries CSV download started');
        } catch (err) {
            error(err.message || 'Failed to export inquiries');
        }
    }, [downloadBlob, error, inquiryStatusFilter, success]);

    const reportsOverview = useMemo(() => {
        const byRole = reportUsers.reduce((acc, user) => {
            const role = String(user.role || 'unknown');
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
        const byVisibility = reportFiles.reduce((acc, file) => {
            const visibility = String(file.visibility || 'private');
            acc[visibility] = (acc[visibility] || 0) + 1;
            return acc;
        }, {});
        const inquiriesByStatus = inquiries.reduce((acc, item) => {
            const key = String(item.status || 'new');
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const inquiriesByPriority = inquiries.reduce((acc, item) => {
            const key = String(item.priority || 'normal');
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return {
            usersTotal: reportUsers.length,
            usersByRole: byRole,
            filesTotal: reportFiles.length,
            filesByVisibility: byVisibility,
            inquiriesTotal: inquiries.length,
            inquiriesByStatus,
            inquiriesByPriority,
            projectsTotal: projects.length,
            ongoingTotal: projects.filter((p) => p.status === 'ongoing').length,
            completedTotal: projects.filter((p) => p.status === 'completed').length,
        };
    }, [inquiries, projects, reportFiles, reportUsers]);

    const reportsStatusSummary = useMemo(() => {
        const totalInquiries = reportsOverview.inquiriesTotal;
        const activeInquiries = (reportsOverview.inquiriesByStatus.new || 0) + (reportsOverview.inquiriesByStatus.in_progress || 0);
        const urgentInquiries = (reportsOverview.inquiriesByPriority.urgent || 0) + (reportsOverview.inquiriesByPriority.high || 0);

        return [
            {
                label: 'Response posture',
                value: reportKpis.overdue_followups > 0 ? 'Attention needed' : 'On track',
                detail: reportKpis.overdue_followups > 0
                    ? `${reportKpis.overdue_followups} follow-up${reportKpis.overdue_followups === 1 ? '' : 's'} past due`
                    : 'No overdue follow-ups in the current reporting set',
            },
            {
                label: 'Inquiry pressure',
                value: totalInquiries ? `${activeInquiries}/${totalInquiries}` : '0/0',
                detail: totalInquiries
                    ? `${urgentInquiries} priority item${urgentInquiries === 1 ? '' : 's'} need close review`
                    : 'No inquiry records loaded yet',
            },
            {
                label: 'Delivery load',
                value: reportsOverview.projectsTotal ? `${reportsOverview.ongoingTotal} active` : 'No projects',
                detail: reportsOverview.projectsTotal
                    ? `${reportsOverview.completedTotal} completed jobs still available for proof`
                    : 'Project data has not been populated yet',
            },
        ];
    }, [reportKpis.overdue_followups, reportsOverview]);

    const reportsHasSignal = useMemo(() => {
        return (
            reportsOverview.projectsTotal > 0 ||
            reportsOverview.usersTotal > 0 ||
            reportsOverview.filesTotal > 0 ||
            reportsOverview.inquiriesTotal > 0 ||
            reportActivity.length > 0
        );
    }, [reportActivity.length, reportsOverview]);

    const overdueInquiries = useMemo(() => {
        const now = Date.now();
        return inquiries
            .filter((item) => isInquiryOverdue(item, now))
            .sort((a, b) => getInquiryFollowUpTime(a.nextFollowUpAt) - getInquiryFollowUpTime(b.nextFollowUpAt));
    }, [inquiries]);

    const inquiryQueueSummary = useMemo(() => {
        const activeInquiries = inquiries.filter((item) => !isClosedInquiryStatus(item.status));
        const unassignedInquiries = activeInquiries.filter((item) => !hasAssignedInquiryOwner(item));
        const unscheduledInquiries = activeInquiries.filter((item) => !hasScheduledFollowUp(item));

        return [
            {
                label: 'Active inquiries',
                value: String(activeInquiries.length),
                detail: 'Items that still need operator follow-through',
            },
            {
                label: 'Needs owner',
                value: String(unassignedInquiries.length),
                detail: 'Queue items without a single accountable lead',
            },
            {
                label: 'Follow-up missing',
                value: String(unscheduledInquiries.length),
                detail: 'Active items without a scheduled next action',
            },
            {
                label: 'Overdue',
                value: String(overdueInquiries.length),
                detail: 'Past-due follow-ups that should be triaged first',
            },
        ];
    }, [inquiries, overdueInquiries.length]);

    const adminHeroStats = useMemo(() => {
        if (isProjectsPage) {
            return [
                {
                    label: 'Tracked projects',
                    value: String(projects.length),
                    detail: `${ongoingProjects.length} ongoing / ${completedProjects.length} completed`,
                },
                {
                    label: 'Selected cards',
                    value: String(selectedProjects.ongoing.length + selectedProjects.completed.length),
                    detail: normalizedSearch ? `Filtered by "${searchQuery.trim()}"` : 'Ready for bulk actions',
                },
                {
                    label: 'Data mode',
                    value: isFallback ? 'Fallback' : 'Live',
                    detail: isFallback ? 'Changes stay local until the DB reconnects' : 'Connected to the primary project feed',
                },
            ];
        }

        if (isClientsPage) {
            return [
                {
                    label: 'Visible accounts',
                    value: String(visibleUsers.length),
                    detail: userRoleFilter === 'all' ? 'Across all roles' : `Filtered to ${userRoleFilter}`,
                },
                {
                    label: 'Inquiry queue',
                    value: String(inquiryTotal || inquiries.length),
                    detail: overdueInquiries.length ? `${overdueInquiries.length} overdue follow-ups` : 'No overdue follow-ups right now',
                },
                {
                    label: 'Open ownership',
                    value: String(inquiries.filter((item) => !isClosedInquiryStatus(item.status)).length),
                    detail: 'Active inquiries still needing operator attention',
                },
            ];
        }

        if (isReportsPage) {
            return [
                {
                    label: 'New today',
                    value: String(reportKpis.new_today),
                    detail: 'Fresh inquiry volume since midnight',
                },
                {
                    label: 'Overdue follow-ups',
                    value: String(reportKpis.overdue_followups),
                    detail: 'Active items past their next action date',
                },
                {
                    label: 'Recent activity',
                    value: String(reportActivity.length),
                    detail: 'Most recent admin events loaded into the report',
                },
            ];
        }

        if (isFilesPage) {
            return [
                {
                    label: 'Visibility',
                    value: 'Admin',
                    detail: 'Shared document controls stay under admin oversight',
                },
                {
                    label: 'Audience',
                    value: 'Team + Client',
                    detail: 'Use role-aware file visibility before publishing',
                },
            ];
        }

        if (isSettingsPage) {
            return [
                {
                    label: 'Account mode',
                    value: 'Admin',
                    detail: 'Changes here affect how this operator signs in and works',
                },
                {
                    label: 'Priority',
                    value: 'Security',
                    detail: 'Keep credentials and access defaults current',
                },
            ];
        }

        return [];
    }, [
        completedProjects.length,
        inquiryTotal,
        inquiries,
        isClientsPage,
        isFallback,
        isFilesPage,
        isProjectsPage,
        isReportsPage,
        isSettingsPage,
        normalizedSearch,
        ongoingProjects.length,
        overdueInquiries.length,
        projects.length,
        reportActivity.length,
        reportKpis.new_today,
        reportKpis.overdue_followups,
        searchQuery,
        selectedProjects.completed.length,
        selectedProjects.ongoing.length,
        userRoleFilter,
        visibleUsers.length,
    ]);

    const handleReminderAction = useCallback(async (inquiry, action) => {
        if (!inquiry?.id) return;

        const owner = String(inquiry.owner || inquiry.assignedTo || '').trim();
        if (!owner) {
            error('This inquiry needs an owner before reminder actions can run.');
            return;
        }

        try {
            const payload = {
                priority: inquiry.priority || 'normal',
                owner,
                assignedTo: owner,
                notes: inquiry.notes || '',
            };

            if (action === 'snooze_1d') {
                const nextFollowUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                await api.adminUpdateInquiry(inquiry.id, {
                    ...payload,
                    status: inquiry.status || 'in_progress',
                    nextFollowUpAt,
                });
                success(`Follow-up moved to ${new Date(nextFollowUpAt).toLocaleString()}`);
            } else if (action === 'mark_resolved') {
                await api.adminUpdateInquiry(inquiry.id, {
                    ...payload,
                    status: 'resolved',
                    nextFollowUpAt: '',
                });
                success('Inquiry marked resolved');
            } else {
                return;
            }

            if (isReportsPage) {
                await loadReports();
            } else {
                await loadInquiries();
            }
        } catch (err) {
            error(err.message || 'Failed to update reminder');
        }
    }, [error, isReportsPage, loadInquiries, loadReports, success]);

    const applyInquiryFollowUpPreset = useCallback((mode) => {
        const nextFollowUpAt = mode === 'tomorrow_am'
            ? buildNextFollowUpIso({ days: 1, targetHour: 9 })
            : buildNextFollowUpIso({ hours: 2 });

        setInquiryForm((prev) => ({
            ...prev,
            nextFollowUpAt: formatDateTimeLocalValue(nextFollowUpAt),
        }));
        setInquiryFormErrors((prev) => ({
            ...prev,
            nextFollowUpAt: undefined,
        }));
    }, []);

    const handleQuickInquiryAction = useCallback(async (inquiry, action) => {
        if (!inquiry?.id) return;
        if (action === 'assign_owner') {
            openInquiryModal(inquiry);
            return;
        }

        const owner = String(inquiry.owner || inquiry.assignedTo || '').trim();
        if (!owner) {
            error('Assign an owner before using quick triage actions.');
            openInquiryModal(inquiry);
            return;
        }

        try {
            const basePayload = {
                priority: inquiry.priority || 'normal',
                owner,
                assignedTo: owner,
                notes: inquiry.notes || '',
            };

            if (action === 'start_review') {
                const nextFollowUpAt = hasScheduledFollowUp(inquiry)
                    ? inquiry.nextFollowUpAt
                    : buildNextFollowUpIso({ days: 1, targetHour: 9 });
                await api.adminUpdateInquiry(inquiry.id, {
                    ...basePayload,
                    status: 'in_progress',
                    nextFollowUpAt,
                });
                success('Inquiry moved into active review');
            } else if (action === 'schedule_follow_up') {
                await api.adminUpdateInquiry(inquiry.id, {
                    ...basePayload,
                    status: isClosedInquiryStatus(inquiry.status) ? 'in_progress' : (inquiry.status || 'in_progress'),
                    nextFollowUpAt: buildNextFollowUpIso({ days: 1, targetHour: 9 }),
                });
                success('Follow-up scheduled for tomorrow morning');
            } else {
                return;
            }

            if (isReportsPage) {
                await loadReports();
            } else {
                await loadInquiries();
            }
        } catch (err) {
            error(err.message || 'Failed to update inquiry');
        }
    }, [error, isReportsPage, loadInquiries, loadReports, openInquiryModal, success]);


    return (
        <DashboardLayout
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSearch={adminPageMeta.searchEnabled}
            searchPlaceholder={adminPageMeta.searchPlaceholder}
            searchAriaLabel={adminPageMeta.searchAriaLabel}
        >
            <div className="space-y-6 animate-fade-in">
                <section
                    data-aos="fade-up"
                    className="rounded-[1.75rem] border border-stroke bg-gradient-to-br from-surface-card via-surface-card to-surface-muted/70 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-5 shadow-sm sm:p-6"
                >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <div className="inline-flex w-fit items-center rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand dark:bg-brand/20 dark:text-brand-300">
                                {adminPageMeta.eyebrow}
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight text-text-primary dark:text-gray-100 sm:text-[2.1rem]">
                                    {adminPageMeta.title}
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-text-secondary dark:text-gray-400 sm:text-[0.98rem]">
                                    {adminPageMeta.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 xl:justify-end">
                            {isProjectsPage ? (
                                <Button
                                    onClick={() => setShowModal(true)}
                                    icon={(
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                >
                                    Add New Project
                                </Button>
                            ) : null}
                            {isClientsPage ? (
                                <Button
                                    onClick={() => openUserModal('create')}
                                    icon={(
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                >
                                    Add User
                                </Button>
                            ) : null}
                            {isReportsPage ? (
                                <Button variant="outline" onClick={loadReports} loading={reportsLoading}>
                                    Refresh Report
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    {adminHeroStats.length ? (
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {adminHeroStats.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-stroke bg-surface-page/70 p-4 dark:border-gray-700 dark:bg-gray-950/40"
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-gray-500">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-text-primary dark:text-gray-100">
                                        {item.value}
                                    </p>
                                    <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </section>

                {isFilesPage && (
                    <FileManager expectedRole="admin" title="Admin File Management" />
                )}

                {isSettingsPage && (
                    <AccountSettings mode="admin" />
                )}

                {isClientsPage && (
                    <>
                        <Card data-aos="fade-up" data-aos-delay="80">
                            <CardHeader className="flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle>Accounts</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={userRoleFilter}
                                        onChange={(e) => setUserRoleFilter(e.target.value)}
                                        options={[
                                            { value: 'all', label: 'All roles' },
                                            { value: 'admin', label: 'Admins' },
                                            { value: 'user', label: 'Employees' },
                                            { value: 'client', label: 'Clients' },
                                        ]}
                                    />
                                    <Button variant="outline" size="sm" onClick={loadAdminUsers} loading={usersLoading}>
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportUsersCsv}
                                        disabled={!visibleUsers.length}
                                    >
                                        Export Users
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {usersLoading ? (
                                    <p className="text-text-secondary dark:text-gray-400">Loading users...</p>
                                ) : usersError ? (
                                    <div className="space-y-3">
                                        <p className="text-feedback-error">{usersError}</p>
                                        <Button variant="outline" size="sm" onClick={loadAdminUsers}>
                                            Retry
                                        </Button>
                                    </div>
                                ) : visibleUsers.length === 0 ? (
                                    <EmptyState
                                        title="No users found"
                                        description="Create your first user account to grant dashboard access."
                                        action={<Button onClick={() => openUserModal('create')}>Add User</Button>}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {visibleUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="rounded-lg border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium text-text-primary dark:text-gray-100 truncate">{user.username}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            size="sm"
                                                            variant={user.role === 'admin' ? 'warning' : user.role === 'client' ? 'info' : 'secondary'}
                                                        >
                                                            {String(user.role || 'user')}
                                                        </Badge>
                                                        <span className="text-xs text-text-muted dark:text-gray-500">
                                                            {Array.isArray(user.projectIds) ? user.projectIds.length : 0} project assignments
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => openUserModal('edit', user)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => openUserModal('reset', user)}>
                                                        Reset Password
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-aos="fade-up" data-aos-delay="120">
                            <CardHeader className="flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Contact Inquiries</CardTitle>
                                    <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
                                        Triage ownership, next action timing, and contact urgency from one queue.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <Input
                                        className="sm:w-56"
                                        placeholder="Search name/email/message"
                                        value={inquirySearch}
                                        onChange={(e) => setInquirySearch(e.target.value)}
                                    />
                                    <Select
                                        value={inquiryStatusFilter}
                                        onChange={(e) => setInquiryStatusFilter(e.target.value)}
                                        options={[
                                            { value: 'all', label: 'All statuses' },
                                            { value: 'new', label: 'New' },
                                            { value: 'in_progress', label: 'In Progress' },
                                            { value: 'resolved', label: 'Resolved' },
                                            { value: 'spam', label: 'Spam' },
                                        ]}
                                    />
                                    <Button variant="outline" size="sm" onClick={loadInquiries} loading={inquiriesLoading}>
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportInquiriesCsv}
                                        disabled={!inquiries.length}
                                    >
                                        Export Inquiries
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {inquiriesLoading ? (
                                    <p className="text-text-secondary dark:text-gray-400">Loading inquiries...</p>
                                ) : inquiriesError ? (
                                    <div className="space-y-3">
                                        <p className="text-feedback-error">{inquiriesError}</p>
                                        <Button variant="outline" size="sm" onClick={loadInquiries}>
                                            Retry
                                        </Button>
                                    </div>
                                ) : inquiries.length === 0 ? (
                                    <EmptyState
                                        title="No inquiries found"
                                        description="New contact submissions will appear here."
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            {inquiryQueueSummary.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="rounded-xl border border-stroke bg-surface-page/70 px-4 py-3 dark:border-gray-700 dark:bg-gray-950/40"
                                                >
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-gray-500">
                                                        {item.label}
                                                    </p>
                                                    <p className="mt-2 text-xl font-semibold text-text-primary dark:text-gray-100">
                                                        {item.value}
                                                    </p>
                                                    <p className="mt-1 text-xs text-text-secondary dark:text-gray-400">
                                                        {item.detail}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {inquiries.map((inquiry) => (
                                            <div
                                                key={inquiry.id}
                                                className={`rounded-lg border p-3 ${
                                                    isInquiryOverdue(inquiry)
                                                        ? 'border-yellow-500/40 bg-yellow-500/5 dark:border-yellow-600/40 dark:bg-yellow-500/10'
                                                        : 'border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-text-primary dark:text-gray-100 truncate">{inquiry.name}</p>
                                                        <p className="text-sm text-text-secondary dark:text-gray-400 truncate">{inquiry.email}{inquiry.phone ? ` • ${inquiry.phone}` : ''}</p>
                                                        <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
                                                            {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : '-'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge
                                                            size="sm"
                                                            variant={
                                                                inquiry.status === 'resolved'
                                                                    ? 'success'
                                                                    : inquiry.status === 'in_progress'
                                                                        ? 'warning'
                                                                        : inquiry.status === 'spam'
                                                                            ? 'error'
                                                                            : 'info'
                                                            }
                                                        >
                                                            {String(inquiry.status || 'new').replace('_', ' ')}
                                                        </Badge>
                                                        {!hasAssignedInquiryOwner(inquiry) ? (
                                                            <Badge size="sm" variant="error">Needs owner</Badge>
                                                        ) : null}
                                                        {!isClosedInquiryStatus(inquiry.status) && !hasScheduledFollowUp(inquiry) ? (
                                                            <Badge size="sm" variant="warning">Follow-up missing</Badge>
                                                        ) : null}
                                                        {isInquiryOverdue(inquiry) ? (
                                                            <Badge size="sm" variant="warning">Overdue</Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <Badge
                                                        size="sm"
                                                        variant={
                                                            inquiry.priority === 'urgent'
                                                                ? 'error'
                                                                : inquiry.priority === 'high'
                                                                    ? 'warning'
                                                                    : inquiry.priority === 'low'
                                                                        ? 'secondary'
                                                                        : 'info'
                                                        }
                                                    >
                                                        Priority: {String(inquiry.priority || 'normal')}
                                                    </Badge>
                                                    <span className="text-xs text-text-muted dark:text-gray-500">
                                                        Owner: {inquiry.owner || inquiry.assignedTo || 'Unassigned'}
                                                    </span>
                                                    <span className="text-xs text-text-muted dark:text-gray-500">
                                                        Next follow-up: {inquiry.nextFollowUpAt ? new Date(inquiry.nextFollowUpAt).toLocaleString() : 'Not scheduled'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary dark:text-gray-300 mt-2 whitespace-pre-wrap break-words">
                                                    {inquiry.message || 'No message'}
                                                </p>
                                                {inquiry.notes ? (
                                                    <p className="text-xs text-text-muted dark:text-gray-500 mt-2">
                                                        Notes: {inquiry.notes}
                                                    </p>
                                                ) : null}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {!hasAssignedInquiryOwner(inquiry) ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleQuickInquiryAction(inquiry, 'assign_owner')}>
                                                            Assign Owner
                                                        </Button>
                                                    ) : null}
                                                    {String(inquiry.status || 'new') === 'new' && hasAssignedInquiryOwner(inquiry) ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleQuickInquiryAction(inquiry, 'start_review')}>
                                                            Start Review
                                                        </Button>
                                                    ) : null}
                                                    {!isClosedInquiryStatus(inquiry.status) && !hasScheduledFollowUp(inquiry) && hasAssignedInquiryOwner(inquiry) ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleQuickInquiryAction(inquiry, 'schedule_follow_up')}>
                                                            Schedule Follow-up
                                                        </Button>
                                                    ) : null}
                                                    {isInquiryOverdue(inquiry) ? (
                                                        <>
                                                            <Button variant="outline" size="sm" onClick={() => handleReminderAction(inquiry, 'snooze_1d')}>
                                                                Snooze 1 Day
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleReminderAction(inquiry, 'mark_resolved')}>
                                                                Mark Resolved
                                                            </Button>
                                                        </>
                                                    ) : null}
                                                    <Button variant="ghost" size="sm" onClick={() => openInquiryModal(inquiry)}>
                                                        Open Triage
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteInquiry(inquiry)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <p className="text-xs text-text-muted dark:text-gray-500">
                                                Showing {(inquiryPage - 1) * inquiryPageSize + (inquiries.length ? 1 : 0)}-
                                                {(inquiryPage - 1) * inquiryPageSize + inquiries.length} of {inquiryTotal}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setInquiryPage((p) => Math.max(1, p - 1))}
                                                    disabled={inquiryPage <= 1 || inquiriesLoading}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setInquiryPage((p) => p + 1)}
                                                    disabled={((inquiryPage - 1) * inquiryPageSize + inquiries.length) >= inquiryTotal || inquiriesLoading}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {isReportsPage && (
                    <>
                        <div className="flex justify-end" data-aos="fade-up">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportActivity}
                                disabled={!reportActivity.length}
                            >
                                Export Activity CSV
                            </Button>
                        </div>

                        {reportsError && (
                            <Card>
                                <CardContent className="space-y-3">
                                    <p className="text-feedback-error">{reportsError}</p>
                                    <Button variant="outline" size="sm" onClick={loadReports}>
                                        Retry
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {!reportsError && (
                            <>
                                <Card data-aos="fade-up" data-aos-delay="60">
                                    <CardHeader className="flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <CardTitle>Operations Summary</CardTitle>
                                            <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
                                                Read this first to decide whether the next operator focus should be response handling, delivery cleanup, or follow-up recovery.
                                            </p>
                                        </div>
                                        <Badge variant={reportKpis.overdue_followups > 0 ? 'warning' : 'success'}>
                                            {reportKpis.overdue_followups > 0 ? 'Follow-up drift present' : 'Queue timing healthy'}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        {reportsHasSignal ? (
                                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                                                {reportsStatusSummary.map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className="rounded-xl border border-stroke bg-surface-page/70 px-4 py-3 dark:border-gray-700 dark:bg-gray-950/40"
                                                    >
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted dark:text-gray-500">
                                                            {item.label}
                                                        </p>
                                                        <p className="mt-2 text-xl font-semibold text-text-primary dark:text-gray-100">
                                                            {item.value}
                                                        </p>
                                                        <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
                                                            {item.detail}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState
                                                title="Report feed is available but still empty"
                                                description="Once projects, inquiries, files, or activity logs are present, this summary will call out whether the next operator focus should be delivery, response, or cleanup."
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-aos="fade-up" data-aos-delay="80">
                                    <Card>
                                        <CardHeader><CardTitle size="sm">New Today</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportKpis.new_today}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                Fresh inbound inquiries created since midnight
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Overdue Follow-ups</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportKpis.overdue_followups}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                Active inquiry records already past their next action time
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Qualified Rate</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportKpis.qualified_rate}%</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                Share of inquiries that moved out of the raw new queue
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Proposal Rate</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportKpis.proposal_rate}%</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                Resolved inquiries used as the current proposal/conversion proxy
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Projects</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportsOverview.projectsTotal}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                {reportsOverview.ongoingTotal} ongoing • {reportsOverview.completedTotal} completed
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Users</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportsOverview.usersTotal}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                {reportsOverview.usersByRole.admin || 0} admin • {reportsOverview.usersByRole.user || 0} employee • {reportsOverview.usersByRole.client || 0} client
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Files</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportsOverview.filesTotal}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                {reportsOverview.filesByVisibility.private || 0} private • {reportsOverview.filesByVisibility.team || 0} team • {reportsOverview.filesByVisibility.client || 0} client
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Activity Logs</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportActivity.length}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">Most recent admin events pulled into this report window</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle size="sm">Inquiries</CardTitle></CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-2xl font-bold text-text-primary dark:text-gray-100">{reportsOverview.inquiriesTotal}</p>
                                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                                {reportsOverview.inquiriesByStatus.new || 0} new • {reportsOverview.inquiriesByStatus.in_progress || 0} in progress • {reportsOverview.inquiriesByStatus.resolved || 0} resolved
                                            </p>
                                            <p className="text-xs text-text-muted dark:text-gray-500">
                                                {reportsOverview.inquiriesByPriority.urgent || 0} urgent • {reportsOverview.inquiriesByPriority.high || 0} high priority
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card data-aos="fade-up" data-aos-delay="110">
                                    <CardHeader className="flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <CardTitle>Overdue Follow-up Queue</CardTitle>
                                            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                                                Immediate actions for active inquiries that have passed their follow-up date.
                                            </p>
                                        </div>
                                        <Badge variant={overdueInquiries.length ? 'warning' : 'success'}>
                                            {overdueInquiries.length} overdue
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        {overdueInquiries.length === 0 ? (
                                            <EmptyState
                                                title="No overdue follow-ups"
                                                description="All active inquiries currently have valid next actions scheduled."
                                            />
                                        ) : (
                                            <div className="space-y-3">
                                                {overdueInquiries.slice(0, 6).map((inquiry) => (
                                                    <div
                                                        key={`overdue-${inquiry.id}`}
                                                        className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 dark:border-yellow-600/40 dark:bg-yellow-500/10 p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="font-medium text-text-primary dark:text-gray-100 truncate">{inquiry.name}</p>
                                                                <Badge size="sm" variant="warning">
                                                                    Due {inquiry.nextFollowUpAt ? new Date(inquiry.nextFollowUpAt).toLocaleString() : 'now'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-text-secondary dark:text-gray-400 truncate">
                                                                {inquiry.email}{inquiry.phone ? ` â€¢ ${inquiry.phone}` : ''}
                                                            </p>
                                                            <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
                                                                Owner: {inquiry.owner || inquiry.assignedTo || 'Unassigned'}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleReminderAction(inquiry, 'snooze_1d')}>
                                                                Snooze 1 Day
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleReminderAction(inquiry, 'mark_resolved')}>
                                                                Mark Resolved
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => openInquiryModal(inquiry)}>
                                                                Open
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card data-aos="fade-up" data-aos-delay="120">
                                    <CardHeader>
                                        <CardTitle>Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {reportActivity.length === 0 ? (
                                            <EmptyState
                                                title="No recent admin activity"
                                                description="Activity logs will appear here after auth events, file changes, or admin updates start flowing through the portal."
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {reportActivity.slice(0, 12).map((item) => (
                                                    <div
                                                        key={item._id || `${item.action}-${item.createdAt}`}
                                                        className="rounded-lg border border-stroke dark:border-gray-700 p-3 bg-surface-card dark:bg-gray-900"
                                                    >
                                                        <p className="text-sm font-medium text-text-primary dark:text-gray-100">{item.action || 'activity'}</p>
                                                        <p className="text-sm text-text-secondary dark:text-gray-400">{item.details || 'No details'}</p>
                                                        <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
                                                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
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

            {isClientsPage && userModal.open && (
                <Modal
                    isOpen={userModal.open}
                    onClose={closeUserModal}
                    title={
                        userModal.mode === 'create'
                            ? 'Create User'
                            : userModal.mode === 'edit'
                                ? `Edit ${userModal.user?.username || 'User'}`
                                : `Reset Password: ${userModal.user?.username || 'User'}`
                    }
                    size="md"
                >
                    <form onSubmit={handleUserSave} className="space-y-4">
                        {userModal.mode !== 'reset' && (
                            <>
                                <Input
                                    label="Username"
                                    value={userForm.username}
                                    onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))}
                                    required
                                />
                                <Select
                                    label="Role"
                                    value={userForm.role}
                                    onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                                    options={[
                                        { value: 'admin', label: 'Admin' },
                                        { value: 'user', label: 'Employee' },
                                        { value: 'client', label: 'Client' },
                                    ]}
                                />
                                {userModal.mode === 'edit' && (
                                    <Input
                                        label="Assigned Project IDs"
                                        helperText="Comma-separated project IDs"
                                        value={userForm.projectIds}
                                        onChange={(e) => setUserForm((prev) => ({ ...prev, projectIds: e.target.value }))}
                                    />
                                )}
                            </>
                        )}

                        {(userModal.mode === 'create' || userModal.mode === 'reset') && (
                            <Input
                                label={userModal.mode === 'create' ? 'Password' : 'New Password'}
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                                required
                            />
                        )}

                        {userFormError && (
                            <p className="text-sm text-feedback-error">{userFormError}</p>
                        )}

                        <ModalFooter>
                            <Button variant="secondary" onClick={closeUserModal} disabled={userSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={userSaving}>
                                {userModal.mode === 'create' ? 'Create User' : userModal.mode === 'edit' ? 'Save Changes' : 'Reset Password'}
                            </Button>
                        </ModalFooter>
                    </form>
                </Modal>
            )}

            {isClientsPage && inquiryModal.open && (
                <Modal
                    isOpen={inquiryModal.open}
                    onClose={closeInquiryModal}
                    title={`Update Inquiry: ${inquiryModal.inquiry?.name || 'Contact'}`}
                    size="md"
                >
                    <form onSubmit={handleSaveInquiry} className="space-y-4">
                        <div className="rounded-xl border border-stroke bg-surface-page/70 p-4 dark:border-gray-700 dark:bg-gray-950/40">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    size="sm"
                                    variant={
                                        inquiryModal.inquiry?.status === 'resolved'
                                            ? 'success'
                                            : inquiryModal.inquiry?.status === 'in_progress'
                                                ? 'warning'
                                                : inquiryModal.inquiry?.status === 'spam'
                                                    ? 'error'
                                                    : 'info'
                                    }
                                >
                                    {String(inquiryModal.inquiry?.status || 'new').replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-text-muted dark:text-gray-500">
                                    {inquiryModal.inquiry?.email || 'No email'}
                                    {inquiryModal.inquiry?.phone ? ` • ${inquiryModal.inquiry.phone}` : ''}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-text-secondary dark:text-gray-300">
                                {inquiryModal.inquiry?.message || 'No message provided'}
                            </p>
                        </div>

                        <Select
                            label="Status"
                            value={inquiryForm.status}
                            error={inquiryFormErrors.status}
                            onChange={(e) => setInquiryForm((prev) => ({ ...prev, status: e.target.value }))}
                            options={[
                                { value: 'new', label: 'New' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'resolved', label: 'Resolved' },
                                { value: 'spam', label: 'Spam' },
                            ]}
                        />
                        <Select
                            label="Priority"
                            value={inquiryForm.priority}
                            onChange={(e) => setInquiryForm((prev) => ({ ...prev, priority: e.target.value }))}
                            options={[
                                { value: 'low', label: 'Low' },
                                { value: 'normal', label: 'Normal' },
                                { value: 'high', label: 'High' },
                                { value: 'urgent', label: 'Urgent' },
                            ]}
                        />
                        <Select
                            label="Owner"
                            value={inquiryForm.owner}
                            error={inquiryFormErrors.owner}
                            helperText="Assign a single owner for the next action on this inquiry."
                            onChange={(e) => setInquiryForm((prev) => ({ ...prev, owner: e.target.value }))}
                            options={[
                                { value: '', label: 'Select owner' },
                                ...adminUsers.map((u) => ({ value: u.username, label: `${u.username} (${u.role})` })),
                            ]}
                        />
                        <Input
                            label="Next Follow-up"
                            type="datetime-local"
                            value={inquiryForm.nextFollowUpAt}
                            error={inquiryFormErrors.nextFollowUpAt}
                            helperText={['resolved', 'spam'].includes(String(inquiryForm.status || '')) ? 'Closed inquiries do not require a follow-up date.' : 'Required while the inquiry is active.'}
                            onChange={(e) => setInquiryForm((prev) => ({ ...prev, nextFollowUpAt: e.target.value }))}
                        />
                        {!['resolved', 'spam'].includes(String(inquiryForm.status || '')) ? (
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => applyInquiryFollowUpPreset('next_2h')}>
                                    In 2 Hours
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => applyInquiryFollowUpPreset('tomorrow_am')}>
                                    Tomorrow 9:00
                                </Button>
                            </div>
                        ) : null}
                        <Textarea
                            label="Internal Notes"
                            rows={4}
                            placeholder="Add handling notes for this inquiry"
                            value={inquiryForm.notes}
                            onChange={(e) => setInquiryForm((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                        <ModalFooter>
                            <Button variant="secondary" onClick={closeInquiryModal} disabled={inquirySaving}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={inquirySaving}>
                                Save Inquiry
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
