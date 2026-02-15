import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  ModalFooter,
  Select,
  Textarea,
} from '../ui';

const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';

const canManageByRole = (role) => role === 'admin' || role === 'user';
const roleHome = {
  admin: { username: 'admin', password: '1111' },
  user: { username: 'employee', password: '1111' },
  client: { username: 'client', password: '1111' },
};

const formatSize = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const formatShortDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const sortFiles = (list, sortBy) => {
  const items = [...list];
  if (sortBy === 'oldest') return items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  if (sortBy === 'name_asc') return items.sort((a, b) => String(a.originalName || '').localeCompare(String(b.originalName || '')));
  if (sortBy === 'name_desc') return items.sort((a, b) => String(b.originalName || '').localeCompare(String(a.originalName || '')));
  if (sortBy === 'size_asc') return items.sort((a, b) => Number(a.size || 0) - Number(b.size || 0));
  if (sortBy === 'size_desc') return items.sort((a, b) => Number(b.size || 0) - Number(a.size || 0));
  return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const getFileExt = (name = '') => {
  const last = String(name).toLowerCase().split('.').pop();
  return last || '';
};

const isImageFile = (file) => {
  const ext = getFileExt(file?.originalName || file?.path || '');
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
};

const isPdfFile = (file) => getFileExt(file?.originalName || file?.path || '') === 'pdf';
const isVideoFile = (file) => {
  const ext = getFileExt(file?.originalName || file?.path || '');
  return ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext);
};

const isOfficeFile = (file) => {
  const ext = getFileExt(file?.originalName || file?.path || '');
  return ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx'].includes(ext);
};

const getFileKindLabel = (file) => {
  if (isPdfFile(file)) return 'PDF';
  if (isImageFile(file)) return 'Image';
  if (isVideoFile(file)) return 'Video';
  if (isOfficeFile(file)) return 'Document';
  if (isTextPreview(file)) return 'Text';
  return 'File';
};

const isPreviewable = (file) => {
  return isImageFile(file) || isPdfFile(file) || isVideoFile(file) || isTextPreview(file) || isOfficeFile(file);
};

const isTextPreview = (file) => {
  const ext = getFileExt(file?.originalName || file?.path || '');
  return ['txt', 'md', 'json', 'csv'].includes(ext);
};

const isAbsoluteHttpUrl = (value = '') => {
  const v = String(value || '').trim();
  return v.startsWith('http://') || v.startsWith('https://');
};

const normalizePath = (path = '') => {
  const cleaned = String(path || '').replace(/\\/g, '/').trim();
  if (!cleaned) return '';
  // Keep absolute URLs intact (Cloudinary, S3, etc).
  if (isAbsoluteHttpUrl(cleaned)) return cleaned;
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
};

const getFilesApiPrefix = () => {
  const base = (IMAGE_BASE_URL || '').trim().replace(/\/$/, '');
  if (!base) return '/api';
  const isNetlifyHost = base.includes('netlify.app') || base.includes('netlify.com');
  return isNetlifyHost ? `${base}/.netlify/functions/api` : `${base}/api`;
};

const resolveFileUrl = (file, { download = false } = {}) => {
  // Always use backend download endpoint for correct filenames.
  if (download && file?._id) {
    const prefix = getFilesApiPrefix();
    return `${prefix}/files/${encodeURIComponent(file._id)}/download`;
  }

  // Use backend view endpoint when possible:
  // - Works for both local-disk files and Cloudinary-backed files.
  // - Avoids CORS issues and keeps auth enforcement consistent in production (Netlify -> /api -> proxy).
  if (file?._id) {
    const prefix = getFilesApiPrefix();
    return `${prefix}/files/${encodeURIComponent(file._id)}/view`;
  }

  const raw = String(file?.path || '').trim();
  if (!raw) return '';

  // If backend already gave us a full URL, use it as-is.
  if (isAbsoluteHttpUrl(raw)) return raw;

  const path = normalizePath(raw);
  if (!path) return '';

  // Prefer explicit API base when provided.
  if (IMAGE_BASE_URL) return `${IMAGE_BASE_URL}${path}`;

  // Local dev convenience when running frontend separately.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://localhost:3002${path}`;
  }

  return path;
};

const getImmediateFolderChildren = (folderPaths = [], parentPath = '') => {
  const normalizedParent = String(parentPath || '').trim().replace(/^\/+|\/+$/g, '');
  const prefix = normalizedParent ? `${normalizedParent}/` : '';
  const map = new Map();
  folderPaths.forEach((raw) => {
    const path = String(raw || '').trim().replace(/^\/+|\/+$/g, '');
    if (!path) return;
    if (normalizedParent && !path.startsWith(prefix)) return;
    const rest = normalizedParent ? path.slice(prefix.length) : path;
    const parts = rest.split('/').filter(Boolean);
    if (!parts.length) return;
    const first = parts[0];
    const fullPath = normalizedParent ? `${normalizedParent}/${first}` : first;
    if (!map.has(fullPath)) map.set(fullPath, first);
  });
  return Array.from(map.entries()).map(([path, name]) => ({ path, name }));
};

const joinFolderPath = (base, name) => {
  const b = normalizePath(base || '').replace(/^\/+|\/+$/g, '');
  const n = normalizePath(name || '').replace(/^\/+|\/+$/g, '');
  if (!b) return n;
  if (!n) return b;
  return `${b}/${n}`;
};

const getRoleStorageKey = (role, suffix) => `mti_drive_${role || 'guest'}_${suffix}`;

const isRecentFile = (file) => {
  const stamp = new Date(file.updatedAt || file.createdAt || 0).getTime();
  if (!stamp) return false;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - stamp <= sevenDays;
};

export default function FileManager({ expectedRole = 'user', title = 'File Manager' }) {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authForm, setAuthForm] = useState({
    username: roleHome[expectedRole]?.username || '',
    password: roleHome[expectedRole]?.password || '',
  });

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'file' | 'folder' | 'auth' | 'user'
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityFeedLoading, setActivityFeedLoading] = useState(false);
  const [activityFeedError, setActivityFeedError] = useState('');
  const [activityFeedHasMore, setActivityFeedHasMore] = useState(true);
  const activityPageSize = 40;
  const activityFeedReqIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState(expectedRole === 'client' ? 'client' : 'all');
  const [projectFilter, setProjectFilter] = useState('all'); // 'all' | '' (no project) | projectId
  const [folderFilter, setFolderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeSection, setActiveSection] = useState('my-drive');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSelectedId, setLastSelectedId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    mobile: false,
    mode: 'single',
    file: null,
    folderPath: '',
  });
  const contextMenuRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewQueue, setPreviewQueue] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewShowDetails, setPreviewShowDetails] = useState(true);
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [officePreviewById, setOfficePreviewById] = useState({});
  const [officePreviewLoadingById, setOfficePreviewLoadingById] = useState({});
  const [officePreviewErrorById, setOfficePreviewErrorById] = useState({});
  const [inspectorFile, setInspectorFile] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('details'); // 'details' | 'activity'
  const [inspectorText, setInspectorText] = useState({ id: '', text: '', loading: false, error: '' });
  const [inspectorActivity, setInspectorActivity] = useState([]);
  const [inspectorActivityLoading, setInspectorActivityLoading] = useState(false);
  const [inspectorActivityError, setInspectorActivityError] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState('');
  const [starredIds, setStarredIds] = useState([]);
  const [recentOpenIds, setRecentOpenIds] = useState([]);
  const [clipboard, setClipboard] = useState({ type: '', mode: '', ids: [], folderPath: '' });
  const [bulkAction, setBulkAction] = useState({ open: false, mode: '', destinationFolder: '' });
  const [assignProject, setAssignProject] = useState({ open: false, file: null, projectId: '' });
  const [assignProjectSaving, setAssignProjectSaving] = useState(false);
  const [assignProjectError, setAssignProjectError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadModalError, setUploadModalError] = useState('');
  const [uploadForm, setUploadForm] = useState({
    file: null,
    visibility: expectedRole === 'client' ? 'client' : 'private',
    folder: '',
    projectId: '',
    tags: '',
    notes: '',
  });

  const [editingFile, setEditingFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    originalName: '',
    visibility: 'private',
    folder: '',
    projectId: '',
    tags: '',
    notes: '',
  });

  const [projects, setProjects] = useState([]);
  const projectTitleById = useMemo(() => {
    const map = {};
    (Array.isArray(projects) ? projects : []).forEach((p) => {
      const id = String(p?._id || p?.id || '').trim();
      if (!id) return;
      map[id] = String(p?.title || 'Untitled Project');
    });
    return map;
  }, [projects]);

  const projectLabelForId = useCallback((projectId) => {
    const id = String(projectId || '').trim();
    if (!id) return 'No project';
    return projectTitleById[id] || 'Unknown project';
  }, [projectTitleById]);

  const canManage = canManageByRole(authUser?.role);
  const hasSelection = selectedIds.length > 0;

  const iconBtnBase =
    'w-9 h-9 rounded-lg border border-stroke dark:border-gray-600 text-text-secondary dark:text-gray-300 ' +
    'hover:bg-surface-muted dark:hover:bg-gray-800 hover:text-text-primary dark:hover:text-gray-100 ' +
    'flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const iconBtnActive =
    'border-brand/50 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300';

  const longPressRef = useRef({ timer: null, startX: 0, startY: 0 });

  const clearLongPress = useCallback(() => {
    if (longPressRef.current.timer) {
      clearTimeout(longPressRef.current.timer);
      longPressRef.current.timer = null;
    }
  }, []);

  const startLongPress = useCallback((touch, onTrigger) => {
    clearLongPress();
    longPressRef.current.startX = touch.clientX;
    longPressRef.current.startY = touch.clientY;
    longPressRef.current.timer = setTimeout(() => {
      longPressRef.current.timer = null;
      onTrigger(touch.clientX, touch.clientY);
    }, 520);
  }, [clearLongPress]);

  const moveLongPress = useCallback((touch) => {
    const dx = Math.abs(touch.clientX - longPressRef.current.startX);
    const dy = Math.abs(touch.clientY - longPressRef.current.startY);
    if (dx > 10 || dy > 10) {
      clearLongPress();
    }
  }, [clearLongPress]);

  const openFileMenuAt = useCallback((x, y, file) => {
    const mobile = window.innerWidth < 640;
    const menuWidth = 220;
    const menuHeight = 320;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;
    setContextMenu({
      open: true,
      x: mobile ? 8 : Math.max(8, Math.min(x, maxX)),
      y: mobile ? 0 : Math.max(8, Math.min(y, maxY)),
      mobile,
      mode: selectedIds.includes(file._id) && selectedIds.length > 1 ? 'multi' : 'single',
      file,
      folderPath: '',
    });
  }, [selectedIds]);

  const openFolderMenuAt = useCallback((x, y, folderPath) => {
    const mobile = window.innerWidth < 640;
    const menuWidth = 220;
    const menuHeight = 320;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;
    setContextMenu({
      open: true,
      x: mobile ? 8 : Math.max(8, Math.min(x, maxX)),
      y: mobile ? 0 : Math.max(8, Math.min(y, maxY)),
      mobile,
      mode: 'single',
      file: null,
      folderPath: folderPath || '__root__',
    });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewFile(null);
    setPreviewQueue([]);
    setPreviewIndex(-1);
    setPreviewZoom(1);
    setPreviewText('');
    setPreviewLoading(false);
    // Keep office preview cache so next open is instant.
  }, []);

  const clampZoom = useCallback((value) => {
    const next = Number(value || 1);
    if (Number.isNaN(next)) return 1;
    return Math.min(3, Math.max(0.5, next));
  }, []);

  const openFile = useCallback((file) => {
    const url = resolveFileUrl(file);
    if (!url) return;
    setRecentOpenIds((prev) => [file._id, ...prev.filter((id) => id !== file._id)].slice(0, 50));
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const openInspectorFor = useCallback((file) => {
    if (!file) return;
    setInspectorFile(file);
    setInspectorTab('details');
    setInspectorText({ id: '', text: '', loading: false, error: '' });
    setInspectorActivity([]);
    setInspectorActivityError('');
  }, []);

  const openPreviewFor = useCallback((file, queue) => {
    if (!file) return;
    if (!isPreviewable(file)) {
      openFile(file);
      return;
    }
    const list = Array.isArray(queue) && queue.length ? queue : [file];
    const idx = Math.max(0, list.findIndex((item) => item && item._id === file._id));
    setPreviewQueue(list);
    setPreviewIndex(idx);
    setPreviewZoom(1);
    setPreviewShowDetails(true);
    setPreviewText('');
    setPreviewFile(file);
  }, [openFile]);

  const previewGoToIndex = useCallback((nextIndex) => {
    if (!previewQueue.length) return;
    const idx = Math.min(previewQueue.length - 1, Math.max(0, Number(nextIndex || 0)));
    const nextFile = previewQueue[idx];
    if (!nextFile) return;
    setPreviewIndex(idx);
    setPreviewZoom(1);
    setPreviewText('');
    setPreviewFile(nextFile);
  }, [previewQueue]);

  const previewPrev = useCallback(() => previewGoToIndex(previewIndex - 1), [previewGoToIndex, previewIndex]);
  const previewNext = useCallback(() => previewGoToIndex(previewIndex + 1), [previewGoToIndex, previewIndex]);

  useEffect(() => {
    if (!previewFile) return;
    const onKey = (e) => {
      // Ignore when typing.
      const tag = (e.target && e.target.tagName) ? String(e.target.tagName).toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previewPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        previewNext();
      } else if (e.key === 'd' || e.key === 'D') {
        setPreviewShowDetails((v) => !v);
      } else if (e.key === '+' || e.key === '=') {
        setPreviewZoom((z) => clampZoom(z + 0.1));
      } else if (e.key === '-' || e.key === '_') {
        setPreviewZoom((z) => clampZoom(z - 0.1));
      } else if (e.key === '0') {
        setPreviewZoom(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clampZoom, previewFile, previewNext, previewPrev]);

  useEffect(() => {
    if (!inspectorFile) return;
    const latest = files.find((f) => f && f._id === inspectorFile._id);
    if (!latest) {
      setInspectorFile(null);
      return;
    }
    if (latest !== inspectorFile) setInspectorFile(latest);
  }, [files, inspectorFile]);

  useEffect(() => {
    if (!inspectorFile) return;
    if (!isTextPreview(inspectorFile)) return;
    let canceled = false;
    const run = async () => {
      try {
        setInspectorText({ id: inspectorFile._id, text: '', loading: true, error: '' });
        const url = resolveFileUrl(inspectorFile);
        const response = await fetch(url);
        const text = await response.text();
        if (canceled) return;
        setInspectorText({ id: inspectorFile._id, text, loading: false, error: '' });
      } catch (err) {
        if (canceled) return;
        setInspectorText({ id: inspectorFile._id, text: '', loading: false, error: 'Unable to preview text.' });
      }
    };
    run();
    return () => { canceled = true; };
  }, [inspectorFile]);

  useEffect(() => {
    if (!inspectorFile) return;
    if (inspectorTab !== 'activity') return;
    if (!authUser || authUser.role !== 'admin') return;
    let canceled = false;
    const run = async () => {
      try {
        setInspectorActivityError('');
        setInspectorActivityLoading(true);
        const items = await api.getActivityLogs({ limit: 60, targetId: inspectorFile._id, actionPrefix: 'file.' });
        if (canceled) return;
        setInspectorActivity(Array.isArray(items) ? items : []);
      } catch (err) {
        if (canceled) return;
        setInspectorActivity([]);
        setInspectorActivityError(err.message || 'Failed to load activity.');
      } finally {
        if (!canceled) setInspectorActivityLoading(false);
      }
    };
    run();
    return () => { canceled = true; };
  }, [authUser, inspectorFile, inspectorTab]);

  const loadAuthUser = useCallback(async () => {
    try {
      setAuthLoading(true);
      const data = await api.me();
      setAuthUser(data.user);
    } catch (err) {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadFiles = useCallback(async () => {
    if (!authUser) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.getFiles();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  const loadFolders = useCallback(async () => {
    if (!authUser) return;
    try {
      const data = await api.getFolders();
      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      // silent fallback
    }
  }, [authUser]);

  const loadProjects = useCallback(async () => {
    if (!authUser) return;
    try {
      const data = await api.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjects([]);
    }
  }, [authUser]);

  const loadActivity = useCallback(async () => {
    if (!authUser || authUser.role !== 'admin') return;
    try {
      const data = await api.getActivityLogs({ limit: 40 });
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivityLogs([]);
    }
  }, [authUser]);

  const activityActionPrefix = useMemo(() => {
    if (activityFilter === 'file') return 'file.';
    if (activityFilter === 'folder') return 'folder.';
    if (activityFilter === 'auth') return 'auth.';
    if (activityFilter === 'user') return 'user.';
    return '';
  }, [activityFilter]);

  const loadActivityFeedPage = useCallback(async ({ reset = false } = {}) => {
    if (!authUser || authUser.role !== 'admin') return;
    if (!reset && activityFeedLoading) return;
    try {
      const reqId = ++activityFeedReqIdRef.current;
      setActivityFeedError('');
      setActivityFeedLoading(true);
      if (reset) {
        setActivityFeed([]);
        setActivityFeedHasMore(true);
      }
      const skip = reset ? 0 : activityFeed.length;
      const page = await api.getActivityLogs({ limit: activityPageSize, skip, actionPrefix: activityActionPrefix });
      const items = Array.isArray(page) ? page : [];
      if (reqId !== activityFeedReqIdRef.current) return;
      setActivityFeed((prev) => (reset ? items : [...prev, ...items]));
      setActivityFeedHasMore(items.length >= activityPageSize);
    } catch (err) {
      setActivityFeedError(err.message || 'Failed to load activity');
    } finally {
      setActivityFeedLoading(false);
    }
  }, [activityActionPrefix, activityFeed.length, activityFeedLoading, activityPageSize, authUser]);

  useEffect(() => {
    if (!showActivityModal) return;
    loadActivityFeedPage({ reset: true });
  }, [activityActionPrefix, loadActivityFeedPage, showActivityModal]);

  useEffect(() => {
    loadAuthUser();
  }, [loadAuthUser]);

  useEffect(() => {
    if (authUser) {
      loadFiles();
      loadFolders();
      loadActivity();
      loadProjects();
    }
  }, [authUser, loadFiles, loadFolders, loadActivity, loadProjects]);

  const projectOptions = useMemo(() => {
    const base = (Array.isArray(projects) ? projects : [])
      .map((p) => ({ value: String(p?._id || p?.id || '').trim(), label: String(p?.title || 'Untitled Project') }))
      .filter((p) => p.value);

    const allowed = authUser?.role === 'admin'
      ? base
      : base.filter((p) => (authUser?.projectIds || []).includes(p.value));

    return [{ value: '', label: 'No project' }, ...allowed];
  }, [authUser, projects]);

  // Default project filter:
  // - admin: All projects
  // - user/client: first assigned project (if any), otherwise All projects
  useEffect(() => {
    if (!authUser) return;
    setProjectFilter((prev) => {
      if (prev === 'all' || prev === '') {
        // keep as-is unless we can set a better default for user/client
      } else if (projectOptions.some((opt) => opt.value === prev)) {
        return prev;
      }

      if (authUser.role === 'admin') return 'all';
      const firstAssigned = Array.isArray(authUser.projectIds) ? String(authUser.projectIds[0] || '').trim() : '';
      if (firstAssigned && projectOptions.some((opt) => opt.value === firstAssigned)) return firstAssigned;
      return 'all';
    });
  }, [authUser, projectOptions]);

  // Simple UX: when an employee opens the upload modal, preselect their first assigned project.
  useEffect(() => {
    if (!showUploadModal) return;
    if (!authUser || authUser.role !== 'user') return;
    const firstAssigned = Array.isArray(authUser.projectIds) ? String(authUser.projectIds[0] || '').trim() : '';
    if (!firstAssigned) return;
    const allowed = projectOptions.some((opt) => opt.value === firstAssigned);
    if (!allowed) return;
    setUploadForm((prev) => {
      if (String(prev.projectId || '').trim()) return prev;
      return { ...prev, projectId: firstAssigned };
    });
  }, [authUser, projectOptions, showUploadModal]);

  useEffect(() => {
    if (!authUser) return;
    try {
      const starsRaw = localStorage.getItem(getRoleStorageKey(authUser.role, 'starred'));
      const recentRaw = localStorage.getItem(getRoleStorageKey(authUser.role, 'recent_open'));
      setStarredIds(starsRaw ? JSON.parse(starsRaw) : []);
      setRecentOpenIds(recentRaw ? JSON.parse(recentRaw) : []);
    } catch (err) {
      setStarredIds([]);
      setRecentOpenIds([]);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(getRoleStorageKey(authUser.role, 'starred'), JSON.stringify(starredIds));
  }, [authUser, starredIds]);

  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(getRoleStorageKey(authUser.role, 'recent_open'), JSON.stringify(recentOpenIds));
  }, [authUser, recentOpenIds]);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = files.filter((f) => {
      if (activeSection === 'shared' && !(f.visibility === 'team' || f.visibility === 'client')) return false;
      if (activeSection === 'recent' && !isRecentFile(f) && !recentOpenIds.includes(f._id)) return false;
      if (activeSection === 'starred' && !starredIds.includes(f._id)) return false;

      if (visibility !== 'all' && f.visibility !== visibility) return false;
      if (projectFilter !== 'all') {
        const pid = String(f.projectId || '').trim();
        if (projectFilter === '') {
          if (pid) return false;
        } else if (pid !== projectFilter) {
          return false;
        }
      }
      if (folderFilter !== 'all' && (f.folder || '') !== folderFilter) return false;
      if (!q) return true;
      const blob = [
        f.originalName,
        f.ownerId,
        f.visibility,
        f.projectId,
        projectTitleById[String(f.projectId || '').trim()] || '',
        f.folder,
        f.notes,
        (f.tags || []).join(' ')
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
    return sortFiles(filtered, sortBy);
  }, [files, query, visibility, projectFilter, folderFilter, sortBy, activeSection, recentOpenIds, starredIds, projectTitleById]);

  const scopedFiles = useMemo(() => {
    return files.filter((f) => {
      if (activeSection === 'shared' && !(f.visibility === 'team' || f.visibility === 'client')) return false;
      if (activeSection === 'recent' && !isRecentFile(f) && !recentOpenIds.includes(f._id)) return false;
      if (activeSection === 'starred' && !starredIds.includes(f._id)) return false;
      if (visibility !== 'all' && f.visibility !== visibility) return false;
      if (projectFilter !== 'all') {
        const pid = String(f.projectId || '').trim();
        if (projectFilter === '') {
          if (pid) return false;
        } else if (pid !== projectFilter) {
          return false;
        }
      }
      return true;
    });
  }, [files, activeSection, recentOpenIds, starredIds, visibility, projectFilter]);

  const allFolders = useMemo(() => {
    const source = new Set([...(folders || []), ...scopedFiles.map((f) => f.folder).filter(Boolean)]);
    return Array.from(source).sort((a, b) => String(a).localeCompare(String(b)));
  }, [folders, scopedFiles]);

  const folderCards = useMemo(() => {
    const folderPaths = [
      ...new Set([
        ...allFolders,
        ...scopedFiles.map((f) => String(f.folder || '').trim()).filter(Boolean),
      ]),
    ];
    const children = getImmediateFolderChildren(folderPaths, folderFilter === 'all' ? '' : folderFilter);
    return children
      .map((item) => ({
        ...item,
        fileCount: scopedFiles.filter((f) => {
          const folder = String(f.folder || '').trim();
          return folder === item.path || folder.startsWith(`${item.path}/`);
        }).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allFolders, scopedFiles, folderFilter]);

  const currentFolderPath = folderFilter === 'all' ? '' : folderFilter;
  const folderSegments = useMemo(
    () => (currentFolderPath ? currentFolderPath.split('/').filter(Boolean) : []),
    [currentFolderPath]
  );
  const canGoFolderBack = folderSegments.length > 0;
  const parentFolderPath = useMemo(() => {
    if (folderSegments.length <= 1) return '';
    return folderSegments.slice(0, -1).join('/');
  }, [folderSegments]);

  // If current folder selection disappears due to project/visibility filters, reset to root.
  useEffect(() => {
    if (folderFilter === 'all') return;
    const stillHasFolder = allFolders.includes(folderFilter) || scopedFiles.some((f) => String(f.folder || '').trim() === folderFilter);
    if (!stillHasFolder) setFolderFilter('all');
  }, [allFolders, folderFilter, scopedFiles]);


  const selectedFiles = useMemo(
    () => filteredFiles.filter((file) => selectedIds.includes(file._id)),
    [filteredFiles, selectedIds]
  );

  const sectionCounts = useMemo(() => ({
    myDrive: files.length,
    shared: files.filter((f) => f.visibility === 'team' || f.visibility === 'client').length,
    recent: files.filter((f) => isRecentFile(f) || recentOpenIds.includes(f._id)).length,
    starred: files.filter((f) => starredIds.includes(f._id)).length,
  }), [files, recentOpenIds, starredIds]);

  const stats = useMemo(() => {
    const totalBytes = filteredFiles.reduce((sum, item) => sum + Number(item.size || 0), 0);
    const byVisibility = filteredFiles.reduce(
      (acc, item) => {
        const key = item.visibility || 'private';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { private: 0, team: 0, client: 0 }
    );
    return { totalBytes, byVisibility };
  }, [filteredFiles]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredFiles.some((f) => f._id === id)));
  }, [filteredFiles]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    if (uploadForm.visibility === 'client' && !String(uploadForm.projectId || '').trim()) {
      const msg = 'Client shared files must be assigned to a project.';
      setError(msg);
      setUploadModalError(msg);
      return false;
    }

    try {
      setUploadModalError('');
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      if (authUser?.role === 'admin') {
        formData.append('ownerId', authUser.id);
      }
      formData.append('visibility', uploadForm.visibility);
      formData.append('folder', uploadForm.folder);
      if (String(uploadForm.projectId || '').trim()) {
        formData.append('projectId', String(uploadForm.projectId || '').trim());
      }
      formData.append('tags', uploadForm.tags);
      formData.append('notes', uploadForm.notes);
      await api.uploadFile(formData);
      setUploadForm({
        file: null,
        visibility: expectedRole === 'client' ? 'client' : 'private',
        folder: '',
        projectId: '',
        tags: '',
        notes: '',
      });
      await loadFiles();
      await loadFolders();
      await loadActivity();
      return true;
    } catch (err) {
      const msg = err.message || 'Failed to upload file';
      setError(msg);
      setUploadModalError(msg);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (file) => {
    setEditingFile(file);
    setEditForm({
      originalName: file.originalName || '',
      visibility: file.visibility || 'private',
      folder: file.folder || '',
      projectId: file.projectId || '',
      tags: Array.isArray(file.tags) ? file.tags.join(', ') : '',
      notes: file.notes || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingFile) return;
    if (editForm.visibility === 'client' && !String(editForm.projectId || '').trim()) {
      setError('Client shared files must be assigned to a project.');
      return;
    }
    try {
      setSavingEdit(true);
      await api.updateFile(editingFile._id, {
        originalName: editForm.originalName,
        visibility: editForm.visibility,
        folder: editForm.folder,
        projectId: editForm.projectId,
        tags: editForm.tags,
        notes: editForm.notes,
      });
      setEditingFile(null);
      await loadFiles();
      await loadFolders();
      await loadActivity();
    } catch (err) {
      setError(err.message || 'Failed to update file');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"?`)) return;
    try {
      await api.deleteFile(file._id);
      await loadFiles();
      await loadFolders();
      await loadActivity();
    } catch (err) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const viewFile = async (file) => {
    setRecentOpenIds((prev) => [file._id, ...prev.filter((id) => id !== file._id)].slice(0, 50));
    openPreviewFor(file, filteredFiles);
    if (!isTextPreview(file)) return;
    try {
      setPreviewLoading(true);
      const url = resolveFileUrl(file);
      const response = await fetch(url);
      const text = await response.text();
      setPreviewText(text);
    } catch (err) {
      setPreviewText('Unable to preview text content.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const ensureOfficePreview = useCallback(async (file) => {
    if (!file?._id) return '';
    if (!isOfficeFile(file)) return '';
    const existing = officePreviewById[file._id];
    if (existing) return existing;

    try {
      setOfficePreviewErrorById((prev) => ({ ...prev, [file._id]: '' }));
      setOfficePreviewLoadingById((prev) => ({ ...prev, [file._id]: true }));
      const data = await api.getFilePreview(file._id);
      const url = data?.url || '';
      if (url) {
        setOfficePreviewById((prev) => ({ ...prev, [file._id]: url }));
      }
      return url;
    } catch (err) {
      const msg = err?.message || 'Failed to generate preview';
      setOfficePreviewErrorById((prev) => ({ ...prev, [file._id]: msg }));
      return '';
    } finally {
      setOfficePreviewLoadingById((prev) => ({ ...prev, [file._id]: false }));
    }
  }, [officePreviewById]);

  const toggleStar = (fileId) => {
    setStarredIds((prev) => (
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [fileId, ...prev]
    ));
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = String(newFolderName || '').trim().replace(/\\/g, '/');
    const path = joinFolderPath(newFolderParent, name);
    if (!path) return;
    try {
      setCreatingFolder(true);
      setError('');
      await api.createFolder(path);
      setNewFolderName('');
      setNewFolderParent('');
      setShowNewFolderModal(false);
      await loadFolders();
      setFolderFilter(path);
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const executeFileMove = async (ids, destinationFolder) => {
    if (!ids.length) return;
    await api.moveFilesBulk(ids, destinationFolder || '');
    await loadFiles();
    await loadFolders();
  };

  const executeFileCopy = async (ids, destinationFolder) => {
    if (!ids.length) return;
    await api.copyFilesBulk(ids, destinationFolder || '');
    await loadFiles();
    await loadFolders();
  };

  const executeFolderMove = async (sourcePath, destinationPath) => {
    if (!sourcePath) return;
    await api.moveFolder(sourcePath, destinationPath || '');
    await loadFiles();
    await loadFolders();
  };

  const executeFolderCopy = async (sourcePath, destinationPath) => {
    if (!sourcePath) return;
    await api.copyFolder(sourcePath, destinationPath || '');
    await loadFiles();
    await loadFolders();
  };

  const handlePasteIntoFolder = async (destinationFolder = '') => {
    try {
      if (clipboard.type === 'files' && clipboard.ids.length) {
        if (clipboard.mode === 'copy') {
          await executeFileCopy(clipboard.ids, destinationFolder);
        } else {
          await executeFileMove(clipboard.ids, destinationFolder);
        }
      } else if (clipboard.type === 'folder' && clipboard.folderPath) {
        if (clipboard.mode === 'copy') {
          await executeFolderCopy(clipboard.folderPath, destinationFolder);
        } else {
          await executeFolderMove(clipboard.folderPath, destinationFolder);
        }
      }
      if (clipboard.mode === 'cut') {
        setClipboard({ type: '', mode: '', ids: [], folderPath: '' });
      }
    } catch (err) {
      setError(err.message || 'Paste failed');
    }
  };


  const toggleFileSelect = (fileId) => {
    setSelectedIds((prev) => (
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    ));
  };

  const selectFileWithEvent = (fileId, event) => {
    const isShift = Boolean(event && event.shiftKey);
    const isSelected = selectedIds.includes(fileId);
    const isToggle = Boolean(event && (event.ctrlKey || event.metaKey));

    // Shift+click adds a contiguous range based on current filtered order (Drive-like).
    if (isShift && lastSelectedId && !isSelected) {
      const ids = filteredFiles.map((f) => f._id);
      const a = ids.indexOf(lastSelectedId);
      const b = ids.indexOf(fileId);
      if (a !== -1 && b !== -1) {
        const [start, end] = a < b ? [a, b] : [b, a];
        const range = ids.slice(start, end + 1);
        setSelectedIds((prev) => Array.from(new Set([...prev, ...range])));
        setLastSelectedId(fileId);
        return;
      }
    }

    if (isToggle) {
      toggleFileSelect(fileId);
      setLastSelectedId(fileId);
      return;
    }

    // Plain click: select just this file (keep selected if it's already the only one).
    setSelectedIds((prev) => {
      if (prev.length === 1 && prev[0] === fileId) return prev;
      return [fileId];
    });
    setLastSelectedId(fileId);
  };

  const openBulkAction = (mode) => {
    if (!hasSelection) return;
    setBulkAction({
      open: true,
      mode,
      destinationFolder: folderFilter === 'all' ? '' : folderFilter,
    });
  };

  const runBulkAction = async () => {
    if (!bulkAction.open || !bulkAction.mode) return;
    const destination = bulkAction.destinationFolder || '';
    try {
      setLoading(true);
      if (bulkAction.mode === 'move') {
        await executeFileMove(selectedIds, destination);
      } else if (bulkAction.mode === 'copy') {
        await executeFileCopy(selectedIds, destination);
      }
      setBulkAction({ open: false, mode: '', destinationFolder: '' });
      await loadFiles();
      await loadFolders();
      await loadActivity();
    } catch (err) {
      setError(err.message || 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  const copySelectedLinks = useCallback(async () => {
    if (!selectedFiles.length) return;
    const links = selectedFiles
      .map((file) => resolveFileUrl(file))
      .filter(Boolean)
      .join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(links);
      } else {
        window.prompt('Copy file links:', links);
      }
    } catch (err) {
      window.prompt('Copy file links:', links);
    }
  }, [selectedFiles]);

  const toggleSelectAllVisible = useCallback(() => {
    const visibleIds = filteredFiles.map((file) => file._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }, [filteredFiles, selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    if (!canManage || !hasSelection) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected file(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map((id) => api.deleteFile(id)));
      setSelectedIds([]);
      await loadFiles();
      await loadFolders();
      await loadActivity();
    } catch (err) {
      setError(err.message || 'Failed to delete selected files');
    } finally {
      setLoading(false);
    }
  }, [canManage, hasSelection, loadActivity, loadFiles, loadFolders, selectedIds]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target && e.target.tagName) ? String(e.target.tagName).toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      // Let the preview modal own keyboard shortcuts while open.
      if (previewFile) return;

      if (e.key === 'Escape') {
        if (hasSelection) {
          e.preventDefault();
          setSelectedIds([]);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        toggleSelectAllVisible();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && canManage && hasSelection) {
        e.preventDefault();
        handleBulkDelete();
        return;
      }

      if (e.key === 'Enter' && selectedFiles.length === 1) {
        e.preventDefault();
        openFile(selectedFiles[0]);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && hasSelection) {
        e.preventDefault();
        copySelectedLinks();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canManage, copySelectedLinks, handleBulkDelete, hasSelection, openFile, previewFile, selectedFiles, toggleSelectAllVisible]);

  const copyFileLink = async (file) => {
    const url = resolveFileUrl(file);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt('Copy file link:', url);
      }
    } catch (err) {
      window.prompt('Copy file link:', url);
    }
  };

  const handleDropUpload = (event) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (!dropped) return;
    setUploadForm((prev) => ({ ...prev, file: dropped }));
  };

  const handleDriveDragOver = (event) => {
    if (!canManage) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDriveDragLeave = (event) => {
    if (!canManage) return;
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDragActive(false);
  };

  const handleDriveDrop = async (event) => {
    if (!canManage) return;
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      const destinationFolder = folderFilter === 'all' ? '' : folderFilter;
      setUploadForm((prev) => ({ ...prev, file: droppedFile, folder: destinationFolder }));
      setShowUploadModal(true);
      return;
    }

    const draggedFileId = event.dataTransfer?.getData('text/mti-file-id');
    const draggedFolderPath = event.dataTransfer?.getData('text/mti-folder-path');
    const destinationFolder = folderFilter === 'all' ? '' : folderFilter;

    try {
      if (draggedFileId) {
        await executeFileMove([draggedFileId], destinationFolder);
      } else if (draggedFolderPath) {
        await executeFolderMove(draggedFolderPath, destinationFolder);
      }
    } catch (err) {
      setError(err.message || 'Drag and drop failed');
    }
  };

  const openContextMenu = (event, file) => {
    event.preventDefault();
    event.stopPropagation();
    openFileMenuAt(event.clientX, event.clientY, file);
  };

  const openContextMenuFromButton = (event, file) => {
    event.preventDefault();
    event.stopPropagation();
    const mobile = window.innerWidth < 640;
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 320;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;
    setContextMenu({
      open: true,
      x: mobile ? 8 : Math.max(8, Math.min(rect.right - 12, maxX)),
      y: mobile ? 0 : Math.max(8, Math.min(rect.bottom + 4, maxY)),
      mobile,
      mode: selectedIds.includes(file._id) && selectedIds.length > 1 ? 'multi' : 'single',
      file,
      folderPath: '',
    });
  };

  const openFolderContextMenu = (event, folderPath) => {
    event.preventDefault();
    event.stopPropagation();
    openFolderMenuAt(event.clientX, event.clientY, folderPath);
  };

  const onDragStartFile = (event, fileId) => {
    event.dataTransfer.setData('text/mti-file-id', fileId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragStartFolder = (event, folderPath) => {
    event.dataTransfer.setData('text/mti-folder-path', folderPath);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDropToFolder = async (event, destinationFolder) => {
    event.preventDefault();
    const fileId = event.dataTransfer.getData('text/mti-file-id');
    const sourceFolder = event.dataTransfer.getData('text/mti-folder-path');
    try {
      if (fileId) {
        await executeFileMove([fileId], destinationFolder);
      } else if (sourceFolder) {
        await executeFolderMove(sourceFolder, destinationFolder);
      }
    } catch (err) {
      setError(err.message || 'Drag and drop failed');
    }
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu({ open: false, x: 0, y: 0, mobile: false, mode: 'single', file: null, folderPath: '' });
  }, []);

  useEffect(() => {
    if (!contextMenu.open) return;
    const onGlobalMouseDown = (event) => {
      if (event.button === 2) return;
      if (contextMenuRef.current && contextMenuRef.current.contains(event.target)) return;
      closeContextMenu();
    };
    const onEsc = (event) => {
      if (event.key === 'Escape') closeContextMenu();
    };
    const onScroll = () => closeContextMenu();
    window.addEventListener('mousedown', onGlobalMouseDown);
    window.addEventListener('keydown', onEsc);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('mousedown', onGlobalMouseDown);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [contextMenu.open, closeContextMenu]);

  useEffect(() => {
    if (!contextMenu.open || !contextMenuRef.current) return;
    const rect = contextMenuRef.current.getBoundingClientRect();
    let nextX = contextMenu.x;
    let nextY = contextMenu.y;
    if (rect.right > window.innerWidth - 8) {
      nextX = Math.max(8, window.innerWidth - rect.width - 8);
    }
    if (rect.bottom > window.innerHeight - 8) {
      nextY = Math.max(8, window.innerHeight - rect.height - 8);
    }
    if (nextX !== contextMenu.x || nextY !== contextMenu.y) {
      setContextMenu((prev) => ({ ...prev, x: nextX, y: nextY }));
    }
  }, [contextMenu.open, contextMenu.x, contextMenu.y]);

  const runContextAction = async (action) => {
    const file = contextMenu.file;
    const folderPath = contextMenu.folderPath === '__root__' ? '' : contextMenu.folderPath;
    const destinationFolder = folderPath || (folderFilter === 'all' ? '' : folderFilter);

    if (!file && !folderPath) return;

    if (action === 'new_folder') {
      setNewFolderParent(folderPath || '');
      setShowNewFolderModal(true);
      closeContextMenu();
      return;
    }

    if (action === 'upload_here') {
      setUploadForm((prev) => ({ ...prev, folder: destinationFolder || '' }));
      setShowUploadModal(true);
      closeContextMenu();
      return;
    }

    if (action === 'paste') {
      await handlePasteIntoFolder(destinationFolder);
      closeContextMenu();
      return;
    }

    if (action === 'copy_selected') {
      setClipboard({ type: 'files', mode: 'copy', ids: [...selectedIds], folderPath: '' });
      closeContextMenu();
      return;
    }
    if (action === 'cut_selected') {
      setClipboard({ type: 'files', mode: 'cut', ids: [...selectedIds], folderPath: '' });
      closeContextMenu();
      return;
    }

    if (!file && folderPath) {
      if (action === 'open_folder') {
        setFolderFilter(folderPath);
      } else if (action === 'copy_folder') {
        setClipboard({ type: 'folder', mode: 'copy', ids: [], folderPath });
      } else if (action === 'cut_folder') {
        setClipboard({ type: 'folder', mode: 'cut', ids: [], folderPath });
      }
      closeContextMenu();
      return;
    }

    if (action === 'open') {
      openFile(file);
      closeContextMenu();
      return;
    }
    if (action === 'download') {
      const url = resolveFileUrl(file, { download: true });
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName || '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      closeContextMenu();
      return;
    }
    if (action === 'view') {
      await viewFile(file);
      closeContextMenu();
      return;
    }
    if (action === 'copy') {
      await copyFileLink(file);
      closeContextMenu();
      return;
    }
    if (action === 'select') {
      toggleFileSelect(file._id);
      closeContextMenu();
      return;
    }
    if (action === 'copy_file') {
      setClipboard({ type: 'files', mode: 'copy', ids: [file._id], folderPath: '' });
      closeContextMenu();
      return;
    }
    if (action === 'cut_file') {
      setClipboard({ type: 'files', mode: 'cut', ids: [file._id], folderPath: '' });
      closeContextMenu();
      return;
    }
    if (action === 'move_here') {
      await executeFileMove([file._id], destinationFolder);
      closeContextMenu();
      return;
    }
    if (action === 'star') {
      toggleStar(file._id);
      closeContextMenu();
      return;
    }
    if (action === 'edit' && canManage) {
      openEditModal(file);
      closeContextMenu();
      return;
    }
    if (action === 'assign_project' && canManage) {
      setAssignProject({ open: true, file, projectId: String(file.projectId || '').trim() });
      setAssignProjectError('');
      closeContextMenu();
      return;
    }
    if (action === 'delete' && canManage) {
      closeContextMenu();
      await handleDelete(file);
      return;
    }
    if (action === 'bulk_copy') {
      await copySelectedLinks();
      closeContextMenu();
      return;
    }
    if (action === 'bulk_clear') {
      setSelectedIds([]);
      closeContextMenu();
      return;
    }
    if (action === 'bulk_delete' && canManage) {
      closeContextMenu();
      await handleBulkDelete();
    }
  };

  // (keyboard shortcuts handled in the earlier keydown effect)

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.login(authForm.username, authForm.password);
      await loadAuthUser();
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  if (authLoading) {
    return (
      <Card>
        <CardContent>
          <p className="text-text-secondary dark:text-gray-400">Checking session...</p>
        </CardContent>
      </Card>
    );
  }

  if (!authUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title} Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Username"
              value={authForm.username}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <Button type="submit" className="self-end">Login</Button>
          </form>
          {error && <p className="text-feedback-error mt-3">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  if (expectedRole && authUser.role !== expectedRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Mismatch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-text-secondary dark:text-gray-400">
            Logged in as <strong>{authUser.username}</strong> ({authUser.role}). This page requires <strong>{expectedRole}</strong>.
          </p>
          <p className="text-xs text-text-muted dark:text-gray-500">
            Use the correct login route (Admin vs User) in the sidebar/login page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${hasSelection ? 'pb-28' : ''}`}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-3 fm-toolbar-animate">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="flex-1 min-w-0">
                <label className="sr-only" htmlFor="drive-search">Search files</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.682 3.682a1 1 0 01-1.414 1.414l-3.682-3.682zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    id="drive-search"
                    type="search"
                    placeholder="Search files, folders, tags..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="w-full lg:w-60">
                <Select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  options={[
                    { value: 'my-drive', label: `My Drive (${sectionCounts.myDrive})` },
                    { value: 'shared', label: `Shared (${sectionCounts.shared})` },
                    { value: 'recent', label: `Recent (${sectionCounts.recent})` },
                    { value: 'starred', label: `Starred (${sectionCounts.starred})` },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  aria-label="Refresh files"
                  title="Refresh"
                  onClick={loadFiles}
                  disabled={loading}
                  className="w-10 h-10 rounded-lg border border-stroke dark:border-gray-600 text-text-secondary dark:text-gray-300 hover:bg-surface-muted dark:hover:bg-gray-800 hover:text-text-primary dark:hover:text-gray-100 flex items-center justify-center disabled:opacity-60 transition-colors"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.93 4.93A10 10 0 0 1 20 12h-2.5M19.07 19.07A10 10 0 0 1 4 12h2.5M20 4v6h-6M4 20v-6h6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Grid view"
                  title="Grid view"
                  onClick={() => setViewMode('grid')}
                  className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                    viewMode === 'grid'
                      ? 'border-brand bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-stroke text-text-secondary dark:text-gray-300 hover:bg-surface-muted dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  title="List view"
                  onClick={() => setViewMode('list')}
                  className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                    viewMode === 'list'
                      ? 'border-brand bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-stroke text-text-secondary dark:text-gray-300 hover:bg-surface-muted dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="View options"
                  title="Options"
                  onClick={() => setShowOptionsModal(true)}
                  className="w-10 h-10 rounded-lg border border-stroke dark:border-gray-600 text-text-secondary dark:text-gray-300 hover:bg-surface-muted dark:hover:bg-gray-800 hover:text-text-primary dark:hover:text-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h10M4 17h10M14 7h6M14 17h6M4 12h6M12 12h8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 7v0M10 12v0M14 17v0" />
                    <circle cx="14" cy="7" r="2" />
                    <circle cx="10" cy="12" r="2" />
                    <circle cx="14" cy="17" r="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {canManage && (
            <p className="text-xs text-text-secondary dark:text-gray-400">
              Right-click a folder card in grid for copy/cut/paste, drag files to folders to move.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-text-secondary dark:text-gray-400">
              Signed in as <strong>{authUser.username}</strong> ({authUser.role})
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Files: {filteredFiles.length}</Badge>
              <Badge variant="secondary">Size: {formatSize(stats.totalBytes)}</Badge>
              <Badge variant="secondary">Private: {stats.byVisibility.private || 0}</Badge>
              <Badge variant="secondary">Team: {stats.byVisibility.team || 0}</Badge>
              <Badge variant="secondary">Client: {stats.byVisibility.client || 0}</Badge>
            </div>
          </div>

          {error && <p className="text-feedback-error">{error}</p>}
          {loading && <p className="text-text-secondary dark:text-gray-400">Loading files...</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              {viewMode === 'grid' ? 'Drive Grid' : 'Files List'} ({filteredFiles.length + (viewMode === 'grid' ? folderCards.length : 0)})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFolderFilter(parentFolderPath || 'all')}
                disabled={!canGoFolderBack}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-stroke dark:border-gray-600 text-xs font-medium text-text-primary dark:text-gray-100 bg-surface-card dark:bg-gray-900 hover:bg-surface-muted dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={() => setFolderFilter('all')}
                className={`inline-flex items-center px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  !canGoFolderBack
                    ? 'border-brand/50 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-stroke dark:border-gray-600 text-text-primary dark:text-gray-100 hover:bg-surface-muted dark:hover:bg-gray-800'
                }`}
              >
                Root
              </button>
              {folderSegments.map((segment, index) => {
                const pathValue = folderSegments.slice(0, index + 1).join('/');
                const isLast = index === folderSegments.length - 1;
                return (
                  <button
                    key={`${pathValue}-${index}`}
                    type="button"
                    onClick={() => setFolderFilter(pathValue)}
                    className={`inline-flex items-center px-2 py-1 rounded-md border text-xs transition-colors ${
                      isLast
                        ? 'border-brand/50 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-stroke dark:border-gray-600 text-text-secondary dark:text-gray-300 hover:bg-surface-muted dark:hover:bg-gray-800'
                    }`}
                  >
                    {segment}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div
              onContextMenu={(e) => openFolderContextMenu(e, folderFilter === 'all' ? '__root__' : folderFilter)}
              onTouchStart={(e) => {
                const t = e.touches?.[0];
                if (!t) return;
                startLongPress(t, (x, y) => openFolderMenuAt(x, y, folderFilter === 'all' ? '__root__' : folderFilter));
              }}
              onTouchMove={(e) => {
                const t = e.touches?.[0];
                if (!t) return;
                moveLongPress(t);
              }}
              onTouchEnd={clearLongPress}
              onTouchCancel={clearLongPress}
              onDragOver={handleDriveDragOver}
              onDragLeave={handleDriveDragLeave}
              onDrop={handleDriveDrop}
              className={`flex-1 min-w-0 ${dragActive ? 'ring-2 ring-brand/30 rounded-xl' : ''}`}
            >
          {filteredFiles.length === 0 && (viewMode !== 'grid' || folderCards.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-stroke dark:border-gray-700 bg-surface-card/50 dark:bg-gray-900/40 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary dark:text-gray-100">
                    {files.length === 0 ? 'No files yet' : 'No results'}
                  </p>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                    {files.length === 0
                      ? (canManage
                        ? 'Right-click anywhere in this area to Upload or create a folder.'
                        : 'No files have been shared with you yet.')
                      : 'Try clearing filters or searching with a different keyword.'}
                  </p>
                  <p className="text-xs text-text-muted dark:text-gray-500 mt-2">
                    Mobile: long-press anywhere to open options.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canManage && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setUploadForm((prev) => ({ ...prev, folder: folderFilter === 'all' ? '' : folderFilter }));
                            setShowUploadModal(true);
                          }}
                        >
                          Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewFolderParent(folderFilter === 'all' ? '' : folderFilter);
                            setShowNewFolderModal(true);
                          }}
                        >
                          New folder
                        </Button>
                      </>
                    )}
                    {files.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setQuery('');
                          setVisibility(expectedRole === 'client' ? 'client' : 'all');
                          setProjectFilter('all');
                          setFolderFilter('all');
                          setSortBy('newest');
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke dark:border-gray-700 text-left">
                    {canManage && <th className="py-2 pr-4">Select</th>}
                    <th className="py-2 pr-4">File Name</th>
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4">Visibility</th>
                    <th className="py-2 pr-4">Folder</th>
                    <th className="py-2 pr-4">Tags</th>
                    <th className="py-2 pr-4">Size</th>
                    <th className="py-2 pr-4">Updated</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={file._id}
                      className={`border-b border-stroke/60 dark:border-gray-700/60 align-top transition-colors ${
                        selectedIds.includes(file._id) ? 'bg-brand-50/60 dark:bg-brand-900/20' : ''
                      }`}
                      onClick={(e) => {
                        openInspectorFor(file);
                        if (!canManage) return;
                        selectFileWithEvent(file._id, e);
                      }}
                      onContextMenu={(e) => openContextMenu(e, file)}
                      onTouchStart={(e) => {
                        const t = e.touches?.[0];
                        if (!t) return;
                        startLongPress(t, (x, y) => openFileMenuAt(x, y, file));
                      }}
                      onTouchMove={(e) => {
                        const t = e.touches?.[0];
                        if (!t) return;
                        moveLongPress(t);
                      }}
                      onTouchEnd={clearLongPress}
                      onTouchCancel={clearLongPress}
                      onDoubleClick={() => openFile(file)}
                      draggable
                      onDragStart={(e) => onDragStartFile(e, file._id)}
                    >
                      {canManage && (
                        <td className="py-2 pr-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(file._id)}
                            onChange={(e) => selectFileWithEvent(file._id, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      <td className="py-2 pr-4">
                        <p className="font-medium text-text-primary dark:text-gray-100 flex items-center gap-2">
                          {starredIds.includes(file._id) && (
                            <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M12 17.27l5.18 3.04-1.64-5.81L20 9.24l-5.9-.5L12 3.5 9.9 8.74 4 9.24l4.46 5.26-1.64 5.81L12 17.27z" />
                            </svg>
                          )}
                          <span>{file.originalName}</span>
                        </p>
                      </td>
                      <td className="py-2 pr-4">{file.ownerId}</td>
                      <td className="py-2 pr-4 capitalize">{file.visibility}</td>
                      <td className="py-2 pr-4">{file.folder || '-'}</td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(file.tags || []).length === 0 ? (
                            <span className="text-text-muted dark:text-gray-500">-</span>
                          ) : (
                            (file.tags || []).map((tag) => (
                              <Badge key={`${file._id}-${tag}`} variant="secondary" size="sm">{tag}</Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4">{formatSize(file.size)}</td>
                      <td className="py-2 pr-4">{formatDate(file.updatedAt || file.createdAt)}</td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          aria-label="File options"
                          className="w-8 h-8 rounded-md border border-stroke dark:border-gray-600 hover:bg-surface-muted dark:hover:bg-gray-800 flex items-center justify-center"
                          onClick={(e) => openContextMenuFromButton(e, file)}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="5" r="1.8" />
                            <circle cx="12" cy="12" r="1.8" />
                            <circle cx="12" cy="19" r="1.8" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${
                inspectorFile ? 'xl:grid-cols-3 2xl:grid-cols-4' : 'xl:grid-cols-4 2xl:grid-cols-5'
              }`}
            >
              {folderCards.map((folder, folderIndex) => (
                <div
                  key={`folder-${folder.path}`}
                  className="group relative rounded-xl border border-stroke dark:border-gray-700 p-3 bg-surface-card dark:bg-gray-900 fm-grid-item fm-card-animate hover:bg-surface-muted/40 dark:hover:bg-gray-900/60 transition-colors"
                  style={{ animationDelay: `${Math.min(folderIndex * 22, 180)}ms` }}
                  onContextMenu={(e) => openFolderContextMenu(e, folder.path)}
                  onTouchStart={(e) => {
                    const t = e.touches?.[0];
                    if (!t) return;
                    startLongPress(t, (x, y) => openFolderMenuAt(x, y, folder.path));
                  }}
                  onTouchMove={(e) => {
                    const t = e.touches?.[0];
                    if (!t) return;
                    moveLongPress(t);
                  }}
                  onTouchEnd={clearLongPress}
                  onTouchCancel={clearLongPress}
                  onDoubleClick={() => { setFolderFilter(folder.path); setInspectorFile(null); }}
                  draggable
                  onDragStart={(e) => onDragStartFolder(e, folder.path)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropToFolder(e, folder.path)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted/60 dark:bg-gray-800/60 border border-stroke dark:border-gray-700">
                        <svg className="h-5 w-5 text-text-secondary dark:text-gray-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M3.5 7.5c0-1.1.9-2 2-2h4.3c.5 0 1 .2 1.3.6l.9 1.1c.3.4.8.6 1.3.6h5.2c1.1 0 2 .9 2 2v7.5c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2V7.5z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary dark:text-gray-100 truncate">{folder.name}</p>
                        <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                          {folder.fileCount} item{folder.fileCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Folder options"
                      className="h-9 w-9 rounded-full border border-stroke dark:border-gray-700 bg-surface-card/80 dark:bg-gray-900/80 hover:bg-surface-muted dark:hover:bg-gray-800 flex items-center justify-center transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={(e) => openFolderContextMenu(e, folder.path)}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {filteredFiles.map((file, fileIndex) => (
                  <div
                    key={file._id}
                    className={`group relative rounded-xl border border-stroke dark:border-gray-700 p-3 bg-surface-card dark:bg-gray-900 fm-grid-item fm-card-animate transition-colors hover:bg-surface-muted/40 dark:hover:bg-gray-900/60 ${
                      selectedIds.includes(file._id) ? 'ring-2 ring-brand/30' : ''
                    }`}
                    style={{ animationDelay: `${Math.min((folderCards.length + fileIndex) * 22, 260)}ms` }}
                    onClick={(e) => {
                      openInspectorFor(file);
                      if (!canManage) return;
                      selectFileWithEvent(file._id, e);
                    }}
                    onContextMenu={(e) => openContextMenu(e, file)}
                    onTouchStart={(e) => {
                      const t = e.touches?.[0];
                      if (!t) return;
                      startLongPress(t, (x, y) => openFileMenuAt(x, y, file));
                    }}
                  onTouchMove={(e) => {
                    const t = e.touches?.[0];
                    if (!t) return;
                    moveLongPress(t);
                  }}
                  onTouchEnd={clearLongPress}
                  onTouchCancel={clearLongPress}
                  onDoubleClick={() => openFile(file)}
                  draggable
                  onDragStart={(e) => onDragStartFile(e, file._id)}
                >
                  <div className="relative overflow-hidden rounded-lg border border-stroke/60 dark:border-gray-800 bg-surface-muted/40 dark:bg-gray-800/20">
                    <div className="h-36 w-full">
                      {isImageFile(file) ? (
                        <img
                          src={resolveFileUrl(file)}
                          alt={file.originalName || 'File'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                          <div className="h-10 w-10 rounded-xl bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700 flex items-center justify-center">
                            <svg className="h-5 w-5 text-text-secondary dark:text-gray-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path
                                d="M7 3.5h7l3 3V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinejoin="round"
                              />
                              <path d="M14 3.5V7h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="text-xs text-text-secondary dark:text-gray-300">
                            <span className="font-semibold">{getFileExt(file.originalName || file.path || '').toUpperCase() || getFileKindLabel(file)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="absolute left-2 top-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(file._id)}
                          aria-label="Select file"
                          className="h-4 w-4 accent-emerald-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onChange={(e) => selectFileWithEvent(file._id, e)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    <div className="absolute right-2 top-2">
                      <button
                        type="button"
                        aria-label="File options"
                        className="h-9 w-9 rounded-full border border-stroke dark:border-gray-700 bg-surface-card/80 dark:bg-gray-900/80 hover:bg-surface-muted dark:hover:bg-gray-800 flex items-center justify-center transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={(e) => openContextMenuFromButton(e, file)}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 min-w-0">
                    <p className="font-semibold text-text-primary dark:text-gray-100 truncate flex items-center gap-1">
                      {starredIds.includes(file._id) && (
                        <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 17.27l5.18 3.04-1.64-5.81L20 9.24l-5.9-.5L12 3.5 9.9 8.74 4 9.24l4.46 5.26-1.64 5.81L12 17.27z" />
                        </svg>
                      )}
                      <span className="truncate">{file.originalName}</span>
                      {String(file.projectId || '').trim() ? (
                        <span
                          className="ml-1 inline-flex items-center text-text-muted dark:text-gray-400"
                          title={`Project: ${projectLabelForId(file.projectId)}`}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M6.5 7.5c0-1.1.9-2 2-2h7c1.1 0 2 .9 2 2v2.2c0 .5-.2 1-.6 1.3l-5.7 5.7c-.8.8-2 .8-2.8 0l-2.3-2.3c-.8-.8-.8-2 0-2.8l5.7-5.7c.4-.4.8-.6 1.3-.6H17.5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinejoin="round"
                            />
                            <path d="M14.5 9.5h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                          </svg>
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                      {file.folder ? file.folder : 'Root'}
                    </p>
                    <div className="mt-1 text-xs text-text-secondary dark:text-gray-400 flex flex-wrap gap-x-2 gap-y-1">
                      <span className="capitalize">{file.visibility || 'private'}</span>
                      <span className="opacity-70">|</span>
                      <span>{formatSize(file.size)}</span>
                      <span className="opacity-70">|</span>
                      <span className="truncate" title={formatDate(file.updatedAt || file.createdAt)}>
                        {formatShortDateTime(file.updatedAt || file.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

            <aside className="hidden lg:block w-[360px] shrink-0">
              <div className="sticky top-24">
                {!inspectorFile ? (
                  <div className="rounded-2xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-4">
                    <p className="text-sm font-semibold text-text-primary dark:text-gray-100">Preview</p>
                    <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                      Select a file to preview it here.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 overflow-hidden">
                    <div className="p-4 border-b border-stroke dark:border-gray-700 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary dark:text-gray-100 truncate">
                          {inspectorFile.originalName}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                          {inspectorFile.folder ? inspectorFile.folder : 'Root'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-full border border-stroke dark:border-gray-700 hover:bg-surface-muted dark:hover:bg-gray-800 flex items-center justify-center"
                        aria-label="Close preview panel"
                        onClick={() => setInspectorFile(null)}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="inline-flex rounded-full border border-stroke dark:border-gray-700 overflow-hidden">
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-sm ${
                            inspectorTab === 'details'
                              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                              : 'text-text-secondary dark:text-gray-300'
                          }`}
                          onClick={() => setInspectorTab('details')}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-sm ${
                            inspectorTab === 'activity'
                              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                              : 'text-text-secondary dark:text-gray-300'
                          }`}
                          onClick={() => setInspectorTab('activity')}
                        >
                          Activity
                        </button>
                      </div>

                      {inspectorTab === 'details' ? (
                        <>
                          <div className="rounded-xl border border-stroke dark:border-gray-700 bg-surface-muted/30 dark:bg-gray-800/20 overflow-hidden">
                            <div className="h-56 w-full bg-white/70 dark:bg-black/20">
                              {(() => {
                                const url = resolveFileUrl(inspectorFile);
                                if (isImageFile(inspectorFile)) {
                                  return (
                                    <img
                                      src={url}
                                      alt={inspectorFile.originalName || 'Preview'}
                                      className="h-full w-full object-contain"
                                      loading="lazy"
                                    />
                                  );
                                }
                                if (isPdfFile(inspectorFile)) {
                                  return (
                                    <iframe
                                      title={inspectorFile.originalName || 'PDF preview'}
                                      src={url}
                                      className="w-full h-full border-0 bg-white"
                                    />
                                  );
                                }
                                if (isVideoFile(inspectorFile)) {
                                  return (
                                    <video
                                      controls
                                      preload="metadata"
                                      className="w-full h-full object-contain bg-black"
                                      src={url}
                                    />
                                  );
                                }
                                if (isOfficeFile(inspectorFile)) {
                                  const officeUrl = officePreviewById[inspectorFile._id] || '';
                                  const officeLoading = Boolean(officePreviewLoadingById[inspectorFile._id]);
                                  const officeError = officePreviewErrorById[inspectorFile._id] || '';
                                  if (officeUrl) {
                                    return (
                                      <iframe
                                        title={`${inspectorFile.originalName || 'Office'} (PDF preview)`}
                                        src={officeUrl}
                                        className="w-full h-full border-0 bg-white"
                                      />
                                    );
                                  }
                                  return (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-2 p-4">
                                      <p className="text-sm text-text-secondary dark:text-gray-300 text-center">
                                        Office files preview as PDF.
                                      </p>
                                      {officeError ? (
                                        <p className="text-xs text-red-600 dark:text-red-400 text-center">{officeError}</p>
                                      ) : null}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => { await ensureOfficePreview(inspectorFile); }}
                                        disabled={officeLoading}
                                      >
                                        {officeLoading ? 'Generating…' : 'Generate Preview'}
                                      </Button>
                                    </div>
                                  );
                                }
                                if (isTextPreview(inspectorFile)) {
                                  if (inspectorText.loading) {
                                    return <div className="h-full w-full flex items-center justify-center text-sm text-text-secondary dark:text-gray-300">Loading…</div>;
                                  }
                                  if (inspectorText.error) {
                                    return <div className="h-full w-full flex items-center justify-center text-sm text-text-secondary dark:text-gray-300">{inspectorText.error}</div>;
                                  }
                                  return (
                                    <div className="h-full w-full overflow-auto p-3 bg-white dark:bg-gray-950">
                                      <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                        {(inspectorText.id === inspectorFile._id ? inspectorText.text : '') || ''}
                                      </pre>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 p-4">
                                    <p className="text-sm text-text-secondary dark:text-gray-300 text-center">
                                      No preview available.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => openFile(inspectorFile)}>
                                      Open
                                    </Button>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex items-center justify-between gap-2 p-3 border-t border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900">
                              <Button variant="outline" size="sm" onClick={() => openPreviewFor(inspectorFile, filteredFiles)}>
                                Full preview
                              </Button>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openFile(inspectorFile)}>
                                  Open
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    const url = resolveFileUrl(inspectorFile, { download: true });
                                    if (!url) return;
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-text-secondary dark:text-gray-400">Type</p>
                              <p className="text-text-primary dark:text-gray-100 break-words">{inspectorFile.mimeType || getFileKindLabel(inspectorFile)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-text-secondary dark:text-gray-400">Size</p>
                              <p className="text-text-primary dark:text-gray-100">{formatSize(inspectorFile.size)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-text-secondary dark:text-gray-400">Visibility</p>
                              <p className="text-text-primary dark:text-gray-100 capitalize">{inspectorFile.visibility || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-text-secondary dark:text-gray-400">Updated</p>
                              <p className="text-text-primary dark:text-gray-100">{formatDate(inspectorFile.updatedAt || inspectorFile.createdAt)}</p>
                            </div>
                            {String(inspectorFile.projectId || '').trim() ? (
                              <div className="col-span-2">
                                <p className="text-xs text-text-secondary dark:text-gray-400">Project</p>
                                <p className="text-text-primary dark:text-gray-100 break-words">{projectLabelForId(inspectorFile.projectId)}</p>
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          {authUser?.role !== 'admin' ? (
                            <p className="text-sm text-text-secondary dark:text-gray-300">Activity is available to admins only.</p>
                          ) : inspectorActivityLoading ? (
                            <p className="text-sm text-text-secondary dark:text-gray-300">Loading activity…</p>
                          ) : inspectorActivityError ? (
                            <p className="text-sm text-red-600 dark:text-red-400">{inspectorActivityError}</p>
                          ) : inspectorActivity.length === 0 ? (
                            <p className="text-sm text-text-secondary dark:text-gray-300">No activity yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              {inspectorActivity.slice(0, 24).map((log) => (
                                <li key={log._id} className="rounded-lg border border-stroke/60 dark:border-gray-700/60 p-3 bg-surface-card dark:bg-gray-900">
                                  <p className="text-sm text-text-primary dark:text-gray-100">
                                    <span className="font-semibold">{log.actorRole}</span> - {log.action}
                                  </p>
                                  <p className="text-xs text-text-secondary dark:text-gray-400">
                                    {log.details || log.targetType} - {formatDate(log.createdAt)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      {authUser.role === 'admin' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-44">
                  <Select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'file', label: 'Files' },
                      { value: 'folder', label: 'Folders' },
                      { value: 'auth', label: 'Auth' },
                      { value: 'user', label: 'Users' },
                    ]}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowActivityModal(true)}>
                  View all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-text-secondary dark:text-gray-400">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {activityLogs
                  .filter((log) => {
                    if (!activityActionPrefix) return true;
                    return String(log.action || '').startsWith(activityActionPrefix);
                  })
                  .slice(0, 8)
                  .map((log) => (
                  <li key={log._id} className="border-b border-stroke/60 dark:border-gray-700/60 pb-2 last:border-0">
                    <p className="text-sm text-text-primary dark:text-gray-100">
                      <span className="font-semibold">{log.actorRole}</span> - {log.action}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      {log.details || log.targetType} - {formatDate(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {showActivityModal && authUser.role === 'admin' && (
        <Modal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          title="Activity Log"
          size="lg"
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:w-64">
                <Select
                  label="Filter"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All activity' },
                    { value: 'file', label: 'File actions' },
                    { value: 'folder', label: 'Folder actions' },
                    { value: 'auth', label: 'Auth actions' },
                    { value: 'user', label: 'User actions' },
                  ]}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadActivityFeedPage({ reset: true })}
                disabled={activityFeedLoading}
              >
                Refresh
              </Button>
            </div>

            {activityFeedError ? (
              <p className="text-sm text-feedback-error">{activityFeedError}</p>
            ) : null}

            {activityFeed.length === 0 && !activityFeedLoading ? (
              <p className="text-sm text-text-secondary dark:text-gray-400">No activity found.</p>
            ) : (
              <ul className="max-h-[60vh] overflow-auto pr-1 space-y-2">
                {activityFeed.map((log) => (
                  <li key={log._id} className="rounded-xl border border-stroke/60 dark:border-gray-700/60 bg-surface-card dark:bg-gray-900 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary dark:text-gray-100">
                          <span className="font-semibold">{log.actorRole}</span> · <span className="font-mono text-xs">{log.action}</span>
                        </p>
                        <p className="text-xs text-text-secondary dark:text-gray-400 mt-1 break-words">
                          {log.details || log.targetType}
                        </p>
                      </div>
                      <p className="text-xs text-text-muted dark:text-gray-500 shrink-0">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-text-muted dark:text-gray-500">
                Showing {activityFeed.length} log{activityFeed.length === 1 ? '' : 's'}{activityActionPrefix ? ` (${activityFilter})` : ''}.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowActivityModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => loadActivityFeedPage({ reset: false })}
                  loading={activityFeedLoading}
                  disabled={!activityFeedHasMore}
                >
                  Load more
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {editingFile && (
        <Modal
          isOpen={Boolean(editingFile)}
          onClose={() => setEditingFile(null)}
          title="Edit File Name and Details"
          size="md"
        >
          <form className="space-y-4" onSubmit={handleSaveEdit}>
            <Input
              label="File Name"
              value={editForm.originalName}
              onChange={(e) => setEditForm((prev) => ({ ...prev, originalName: e.target.value }))}
              required
            />
            <Select
              label="Visibility"
              value={editForm.visibility}
              onChange={(e) => setEditForm((prev) => ({ ...prev, visibility: e.target.value }))}
              options={[
                { value: 'private', label: 'Private' },
                { value: 'team', label: 'Team' },
                { value: 'client', label: 'Client shared' },
              ]}
            />
            <Select
              label="Project"
              value={editForm.projectId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, projectId: e.target.value }))}
              options={projectOptions}
            />
            <Input
              label="Folder"
              value={editForm.folder}
              onChange={(e) => setEditForm((prev) => ({ ...prev, folder: e.target.value }))}
            />
            <Input
              label="Tags (comma-separated)"
              value={editForm.tags}
              onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
            <Textarea
              label="Notes"
              value={editForm.notes}
              onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <ModalFooter>
              <Button variant="secondary" onClick={() => setEditingFile(null)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button type="submit" loading={savingEdit}>
                Save
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {hasSelection && (
        <div className="fixed bottom-4 left-0 right-0 z-[900] px-3">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-stroke dark:border-gray-700 bg-surface-card/95 dark:bg-gray-900/95 backdrop-blur shadow-elevated px-3 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="secondary" className="shrink-0">
                    {selectedIds.length} selected
                  </Badge>
                  <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                    Tip: Shift+click to select a range.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <button
                    type="button"
                    className={iconBtnBase}
                    title="Select all visible (Ctrl/Cmd+A)"
                    aria-label="Select all visible"
                    onClick={toggleSelectAllVisible}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M5 12h14M5 17h14" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v0M7 12v0M7 17v0" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={iconBtnBase}
                    title="Clear selection"
                    aria-label="Clear selection"
                    onClick={() => setSelectedIds([])}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={iconBtnBase}
                    title="Copy selected links"
                    aria-label="Copy selected links"
                    onClick={copySelectedLinks}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 000-7.07 5 5 0 00-7.07 0L10 5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 01-7.07 0L5.52 9.59a5 5 0 010-7.07 5 5 0 017.07 0L14 4" />
                    </svg>
                  </button>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className={iconBtnBase}
                        title="Move selected"
                        aria-label="Move selected"
                        onClick={() => openBulkAction('move')}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h14M10 5l-4 4 4 4M14 19l4-4-4-4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={iconBtnBase}
                        title="Copy selected"
                        aria-label="Copy selected"
                        onClick={() => openBulkAction('copy')}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h11v11H8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 16H4a1 1 0 01-1-1V4a1 1 0 011-1h11a1 1 0 011 1v1" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`${iconBtnBase} text-feedback-error hover:bg-red-50 dark:hover:bg-red-900/20`}
                        title="Delete selected"
                        aria-label="Delete selected"
                        onClick={handleBulkDelete}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bulkAction.open && canManage && (
        <Modal
          isOpen={bulkAction.open}
          onClose={() => setBulkAction({ open: false, mode: '', destinationFolder: '' })}
          title={bulkAction.mode === 'move' ? 'Move Selected' : 'Copy Selected'}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary dark:text-gray-400">
              {bulkAction.mode === 'move' ? 'Move' : 'Copy'} {selectedIds.length} item(s) to:
            </p>
            <Select
              label="Destination Folder"
              value={bulkAction.destinationFolder}
              onChange={(e) => setBulkAction((prev) => ({ ...prev, destinationFolder: e.target.value }))}
              options={[
                { value: '', label: 'Root' },
                ...allFolders.map((folder) => ({ value: folder, label: folder })),
              ]}
            />
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setBulkAction({ open: false, mode: '', destinationFolder: '' })}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={runBulkAction} loading={loading}>
                {bulkAction.mode === 'move' ? 'Move' : 'Copy'}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {contextMenu.open && createPortal(
        <div
          ref={contextMenuRef}
          className={`fixed z-[1000] max-h-[70vh] overflow-auto rounded-xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 text-text-primary dark:text-gray-100 shadow-xl p-2 fm-menu-pop ${
            contextMenu.mobile ? 'left-2 right-2 bottom-2 w-auto max-h-[60vh]' : 'w-56'
          }`}
          style={contextMenu.mobile ? undefined : { top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenu.mode === 'multi' && contextMenu.file ? (
            <>
              <p className="px-3 py-2 text-xs text-text-secondary dark:text-gray-400">
                {selectedIds.length} selected
              </p>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('bulk_copy')}
              >
                Copy Selected Links
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('copy_selected')}
              >
                Copy Selected
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('cut_selected')}
              >
                Cut Selected
              </button>
              {(clipboard.type || clipboard.folderPath) && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                  onClick={() => runContextAction('paste')}
                >
                  Paste Here
                </button>
              )}
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('bulk_clear')}
              >
                Clear Selection
              </button>
              {canManage && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-feedback-error hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => runContextAction('bulk_delete')}
                >
                  Delete Selected
                </button>
              )}
            </>
          ) : contextMenu.file ? (
            <>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('open')}
              >
                Open
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('view')}
              >
                View
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('download')}
              >
                Download
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('copy')}
              >
                Copy Link
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('copy_file')}
              >
                Copy
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('cut_file')}
              >
                Cut
              </button>
              {(clipboard.type || clipboard.folderPath) && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                  onClick={() => runContextAction('paste')}
                >
                  Paste Here
                </button>
              )}
              {canManage && (
                <>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                    onClick={() => runContextAction('upload_here')}
                  >
                    Upload Here
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                    onClick={() => runContextAction('new_folder')}
                  >
                    New Folder
                  </button>
                </>
              )}
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('star')}
              >
                {starredIds.includes(contextMenu.file._id) ? 'Remove Star' : 'Add Star'}
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('select')}
              >
                {selectedIds.includes(contextMenu.file._id) ? 'Unselect' : 'Select'}
              </button>
              {canManage && (
                <>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                    onClick={() => runContextAction('edit')}
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                    onClick={() => runContextAction('assign_project')}
                  >
                    Assign Project
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-feedback-error hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => runContextAction('delete')}
                  >
                    Delete
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('open_folder')}
              >
                Open Folder
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('copy_folder')}
              >
                Copy Folder
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                onClick={() => runContextAction('cut_folder')}
              >
                Cut Folder
              </button>
              {(clipboard.type || clipboard.folderPath) && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                  onClick={() => runContextAction('paste')}
                >
                  Paste Into Folder
                </button>
              )}
              {canManage && (
                <>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                    onClick={() => runContextAction('upload_here')}
                  >
                    Upload Here
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-muted dark:hover:bg-gray-800"
                    onClick={() => runContextAction('new_folder')}
                  >
                    New Subfolder
                  </button>
                </>
              )}
            </>
          )}
        </div>,
        document.body
      )}

      {previewFile && (
        <Modal
          isOpen={Boolean(previewFile)}
          onClose={closePreview}
          title={null}
          showCloseButton={false}
          size="full"
          className="h-[90vh]"
        >
          <div className="-mx-6 -my-4 h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900">
              <Button variant="outline" size="sm" onClick={closePreview} aria-label="Close preview">
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </span>
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-sm text-text-primary dark:text-gray-100 truncate">
                    {previewFile.originalName}
                  </p>
                  {previewFile.cloudProvider ? (
                    <Badge variant="secondary" className="shrink-0">
                      {previewFile.cloudProvider}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  {previewIndex >= 0 && previewQueue.length ? `${previewIndex + 1} / ${previewQueue.length}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={iconBtnBase}
                  onClick={previewPrev}
                  disabled={previewIndex <= 0}
                  title="Previous (←)"
                  aria-label="Previous file"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={iconBtnBase}
                  onClick={previewNext}
                  disabled={previewIndex >= previewQueue.length - 1}
                  title="Next (→)"
                  aria-label="Next file"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const officePdf = isOfficeFile(previewFile) ? officePreviewById[previewFile._id] : '';
                  const canZoom =
                    isPdfFile(previewFile) ||
                    isImageFile(previewFile) ||
                    isTextPreview(previewFile) ||
                    Boolean(officePdf);
                  if (!canZoom) return null;
                  return (
                  <>
                    <button
                      type="button"
                      className={iconBtnBase}
                      title="Zoom out (-)"
                      aria-label="Zoom out"
                      onClick={() => setPreviewZoom((z) => clampZoom(z - 0.1))}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`${iconBtnBase} w-auto px-2.5 font-semibold text-xs`}
                      title="Reset zoom (0)"
                      aria-label="Reset zoom"
                      onClick={() => setPreviewZoom(1)}
                    >
                      {Math.round(previewZoom * 100)}%
                    </button>
                    <button
                      type="button"
                      className={iconBtnBase}
                      title="Zoom in (+)"
                      aria-label="Zoom in"
                      onClick={() => setPreviewZoom((z) => clampZoom(z + 0.1))}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </>
                  );
                })()}
                <button
                  type="button"
                  className={`${iconBtnBase} ${previewShowDetails ? iconBtnActive : ''}`}
                  title="Details (D)"
                  aria-label="Toggle details panel"
                  onClick={() => setPreviewShowDetails((v) => !v)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h10M9 7h10M9 17h10M5 7h.01M5 12h.01M5 17h.01" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={iconBtnBase}
                  title="Open"
                  aria-label="Open in new tab"
                  onClick={() => openFile(previewFile)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v7H3V3h7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={iconBtnBase}
                  title="Download"
                  aria-label="Download"
                  onClick={() => {
                    const url = resolveFileUrl(previewFile, { download: true });
                    if (!url) return;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v3h16v-3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex bg-surface-page dark:bg-gray-950">
              <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative z-0 isolate">
                {(() => {
                  const url = resolveFileUrl(previewFile);
                  if (isImageFile(previewFile)) {
                    return (
                      <div className="h-full w-full overflow-auto p-6">
                        <div
                          className="inline-block"
                          style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}
                        >
                          <img
                            src={url}
                            alt={previewFile.originalName}
                            className="max-w-none rounded-xl border border-stroke dark:border-gray-700 bg-white"
                          />
                        </div>
                      </div>
                    );
                  }
                  if (isPdfFile(previewFile)) {
                    const inv = 1 / previewZoom;
                    return (
                      <div className="h-full w-full overflow-auto relative z-0">
                        <div
                          className="h-full"
                          style={{
                            transform: `scale(${previewZoom})`,
                            transformOrigin: 'top left',
                            width: `${inv * 100}%`,
                            height: `${inv * 100}%`,
                          }}
                        >
                          <iframe
                            title={previewFile.originalName}
                            src={url}
                            className="w-full h-full border-0 bg-white"
                          />
                        </div>
                      </div>
                    );
                  }
                  if (isVideoFile(previewFile)) {
                    return (
                      <div className="h-full w-full flex items-center justify-center bg-black">
                        <video
                          controls
                          preload="metadata"
                          className="w-full h-full max-h-full object-contain"
                          src={url}
                        />
                      </div>
                    );
                  }
                  if (isOfficeFile(previewFile)) {
                    const officeUrl = officePreviewById[previewFile._id] || '';
                    const officeLoading = Boolean(officePreviewLoadingById[previewFile._id]);
                    const officeError = officePreviewErrorById[previewFile._id] || '';
                    if (officeUrl) {
                      const inv = 1 / previewZoom;
                      return (
                        <div className="h-full w-full overflow-auto relative z-0">
                          <div
                            className="h-full"
                            style={{
                              transform: `scale(${previewZoom})`,
                              transformOrigin: 'top left',
                              width: `${inv * 100}%`,
                              height: `${inv * 100}%`,
                            }}
                          >
                            <iframe
                              title={`${previewFile.originalName} (PDF preview)`}
                              src={officeUrl}
                              className="w-full h-full border-0 bg-white"
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="h-full w-full flex items-center justify-center p-6">
                        <div className="max-w-xl w-full rounded-2xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-5">
                          <p className="text-sm font-semibold text-text-primary dark:text-gray-100">
                            Office preview
                          </p>
                          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                            Generate a PDF preview (CloudConvert) or use Open/Download.
                          </p>
                          {officeError ? (
                            <p className="text-sm text-feedback-error mt-3">{officeError}</p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={officeLoading}
                              onClick={async () => {
                                await ensureOfficePreview(previewFile);
                              }}
                            >
                              Generate Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openFile(previewFile)}>
                              Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const dl = resolveFileUrl(previewFile, { download: true });
                                if (!dl) return;
                                window.open(dl, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (isTextPreview(previewFile)) {
                    return (
                      <div className="h-full w-full overflow-auto p-6">
                        {previewLoading ? (
                          <p className="text-sm text-text-secondary dark:text-gray-400">Loading preview...</p>
                        ) : (
                          <div
                            className="inline-block"
                            style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}
                          >
                            <pre className="text-xs whitespace-pre-wrap rounded-xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-4 text-text-primary dark:text-gray-100 max-w-none">
                              {previewText || 'No content.'}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="h-full w-full flex items-center justify-center p-6">
                      <div className="max-w-xl w-full rounded-2xl border border-stroke dark:border-gray-700 bg-surface-card dark:bg-gray-900 p-5">
                        <p className="text-sm font-semibold text-text-primary dark:text-gray-100">
                          Preview not available
                        </p>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                          Use Open or Download.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {previewShowDetails && (
                <aside className="hidden md:block w-80 shrink-0 border-l border-stroke dark:border-gray-800 bg-surface-card dark:bg-gray-900 overflow-y-auto relative z-10">
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-text-secondary dark:text-gray-400">Name</p>
                      <p className="text-sm text-text-primary dark:text-gray-100 break-all leading-snug">
                        {previewFile.originalName}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary dark:text-gray-400">Type</p>
                        <p className="text-sm text-text-primary dark:text-gray-100 break-all leading-snug">
                          {previewFile.mimeType || '-'}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary dark:text-gray-400">Size</p>
                        <p className="text-sm text-text-primary dark:text-gray-100">{formatSize(previewFile.size)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary dark:text-gray-400">Visibility</p>
                        <p className="text-sm text-text-primary dark:text-gray-100">{previewFile.visibility || '-'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary dark:text-gray-400">Folder</p>
                        <p className="text-sm text-text-primary dark:text-gray-100">{previewFile.folder || 'root'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary dark:text-gray-400">Project</p>
                        <p className="text-sm text-text-primary dark:text-gray-100 break-words">
                          {projectLabelForId(previewFile.projectId)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary dark:text-gray-400">Uploaded</p>
                      <p className="text-sm text-text-primary dark:text-gray-100">{formatDate(previewFile.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary dark:text-gray-400">Owner</p>
                      <p className="text-sm text-text-primary dark:text-gray-100 break-words">{previewFile.ownerId || '-'}</p>
                    </div>
                    {Array.isArray(previewFile.tags) && previewFile.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {previewFile.tags.slice(0, 12).map((t) => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {previewFile.notes ? (
                      <div>
                        <p className="text-xs text-text-secondary dark:text-gray-400">Notes</p>
                        <p className="text-sm text-text-primary dark:text-gray-100 whitespace-pre-wrap break-words">{previewFile.notes}</p>
                      </div>
                    ) : null}
                    <p className="text-[11px] text-text-muted dark:text-gray-500 pt-1">
                      Shortcuts: ←/→, +/-, 0, D
                    </p>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showOptionsModal && (
        <Modal
          isOpen={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          title="View Options"
          size="md"
        >
          <div className="space-y-4">
            <Select
              label="Project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All projects' },
                ...projectOptions,
              ]}
            />
            <Select
              label="Visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              options={[
                { value: 'all', label: 'All visibility' },
                { value: 'private', label: 'Private' },
                { value: 'team', label: 'Team' },
                { value: 'client', label: 'Client shared' },
              ]}
            />
            <Select
              label="Folder"
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All folders' },
                ...allFolders.map((folder) => ({ value: folder, label: folder })),
              ]}
            />
            <Select
              label="Sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'name_asc', label: 'Name A-Z' },
                { value: 'name_desc', label: 'Name Z-A' },
                { value: 'size_desc', label: 'Largest size' },
                { value: 'size_asc', label: 'Smallest size' },
              ]}
            />
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAllVisible}>
                  Select Visible
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedIds([])} disabled={!hasSelection}>
                  Clear Selection
                </Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={!hasSelection}>
                  Delete Selected ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showUploadModal && canManage && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => { setShowUploadModal(false); setUploadModalError(''); }}
          title="Upload File"
          size="md"
        >
          <form
            onSubmit={async (e) => {
              const ok = await handleUpload(e);
              if (ok) setShowUploadModal(false);
            }}
            className="space-y-3"
          >
            <div
              className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
                dragActive
                  ? 'border-brand bg-brand-50 dark:bg-brand-900/20'
                  : 'border-stroke dark:border-gray-600'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDropUpload}
            >
              <label className="block text-sm font-medium text-text-primary dark:text-gray-200 mb-1">File</label>
              <input
                type="file"
                onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                className="w-full px-3 py-2 rounded-lg border border-stroke dark:border-gray-600 bg-surface-card dark:bg-gray-800 text-text-primary dark:text-gray-100"
              />
            </div>
            <Select
              label="Visibility"
              value={uploadForm.visibility}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, visibility: e.target.value }))}
              options={[
                { value: 'private', label: 'Private' },
                { value: 'team', label: 'Team' },
                { value: 'client', label: 'Client shared' },
              ]}
            />
            <Select
              label="Project"
              value={uploadForm.projectId}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, projectId: e.target.value }))}
              options={projectOptions}
            />
            <Input
              label="Folder"
              placeholder="Site-A/Permits"
              value={uploadForm.folder}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, folder: e.target.value }))}
            />
            <Input
              label="Tags"
              placeholder="invoice, permit"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
            {uploadModalError && (
              <p className="text-sm text-feedback-error">{uploadModalError}</p>
            )}
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" loading={uploading} disabled={!uploadForm.file}>
                Upload
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {showNewFolderModal && canManage && (
        <Modal
          isOpen={showNewFolderModal}
          onClose={() => setShowNewFolderModal(false)}
          title="Create Folder"
          size="sm"
        >
          <form onSubmit={handleCreateFolder} className="space-y-3">
            <Select
              label="Parent Folder"
              value={newFolderParent}
              onChange={(e) => setNewFolderParent(e.target.value)}
              options={[
                { value: '', label: 'Root' },
                ...allFolders.map((folder) => ({ value: folder, label: folder })),
              ]}
            />
            <Input
              label="Folder Name"
              placeholder="e.g. Plans-2026"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
            />
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowNewFolderModal(false)} disabled={creatingFolder}>
                Cancel
              </Button>
              <Button type="submit" loading={creatingFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {assignProject.open && assignProject.file && canManage && (
        <Modal
          isOpen={assignProject.open}
          onClose={() => { setAssignProject({ open: false, file: null, projectId: '' }); setAssignProjectError(''); }}
          title="Assign Project"
          size="sm"
        >
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const file = assignProject.file;
              if (!file) return;
              const nextProjectId = String(assignProject.projectId || '').trim();
              if (file.visibility === 'client' && !nextProjectId) {
                setAssignProjectError('Client shared files must be assigned to a project.');
                return;
              }
              try {
                setAssignProjectError('');
                setAssignProjectSaving(true);
                await api.updateFile(file._id, { projectId: nextProjectId });
                await loadFiles();
                await loadActivity();
                setAssignProject({ open: false, file: null, projectId: '' });
              } catch (err) {
                setAssignProjectError(err.message || 'Failed to assign project');
              } finally {
                setAssignProjectSaving(false);
              }
            }}
          >
            <p className="text-sm text-text-secondary dark:text-gray-400">
              File: <span className="text-text-primary dark:text-gray-100 font-medium">{assignProject.file.originalName}</span>
            </p>
            <Select
              label="Project"
              value={assignProject.projectId}
              onChange={(e) => setAssignProject((prev) => ({ ...prev, projectId: e.target.value }))}
              options={projectOptions}
            />
            {assignProject.file.visibility === 'client' && (
              <p className="text-xs text-text-muted dark:text-gray-500">
                Note: Client shared files require a project.
              </p>
            )}
            {assignProjectError && <p className="text-sm text-feedback-error">{assignProjectError}</p>}
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => { setAssignProject({ open: false, file: null, projectId: '' }); setAssignProjectError(''); }}
                disabled={assignProjectSaving}
              >
                Cancel
              </Button>
              <Button type="submit" loading={assignProjectSaving}>
                Save
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}
