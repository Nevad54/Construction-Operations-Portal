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

const isPreviewable = (file) => {
  return isImageFile(file) || isPdfFile(file) || isVideoFile(file) || isTextPreview(file) || isOfficeFile(file);
};

const isTextPreview = (file) => {
  const ext = getFileExt(file?.originalName || file?.path || '');
  return ['txt', 'md', 'json', 'csv'].includes(ext);
};

const normalizePath = (path = '') => {
  const cleaned = String(path || '').replace(/\\/g, '/').trim();
  if (!cleaned) return '';
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
};

const resolveFileUrl = (file) => {
  const path = normalizePath(file?.path || '');
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (IMAGE_BASE_URL) return `${IMAGE_BASE_URL}${path}`;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://localhost:3002${path}`;
  }
  return path;
};

const getAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${window.location.origin}${url}`;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState(expectedRole === 'client' ? 'client' : 'all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeSection, setActiveSection] = useState('my-drive');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
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
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState('');
  const [starredIds, setStarredIds] = useState([]);
  const [recentOpenIds, setRecentOpenIds] = useState([]);
  const [clipboard, setClipboard] = useState({ type: '', mode: '', ids: [], folderPath: '' });

  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    visibility: expectedRole === 'client' ? 'client' : 'private',
    folder: '',
    tags: '',
    notes: '',
  });

  const [editingFile, setEditingFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    originalName: '',
    visibility: 'private',
    folder: '',
    tags: '',
    notes: '',
  });

  const canManage = canManageByRole(authUser?.role);
  const hasSelection = selectedIds.length > 0;

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

  const loadActivity = useCallback(async () => {
    if (!authUser || authUser.role !== 'admin') return;
    try {
      const data = await api.getActivityLogs(20);
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivityLogs([]);
    }
  }, [authUser]);

  useEffect(() => {
    loadAuthUser();
  }, [loadAuthUser]);

  useEffect(() => {
    if (authUser) {
      loadFiles();
      loadFolders();
      loadActivity();
    }
  }, [authUser, loadFiles, loadFolders, loadActivity]);

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
      if (folderFilter !== 'all' && (f.folder || '') !== folderFilter) return false;
      if (!q) return true;
      const blob = [
        f.originalName,
        f.ownerId,
        f.visibility,
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
  }, [files, query, visibility, folderFilter, sortBy, activeSection, recentOpenIds, starredIds]);

  const scopedFiles = useMemo(() => {
    return files.filter((f) => {
      if (activeSection === 'shared' && !(f.visibility === 'team' || f.visibility === 'client')) return false;
      if (activeSection === 'recent' && !isRecentFile(f) && !recentOpenIds.includes(f._id)) return false;
      if (activeSection === 'starred' && !starredIds.includes(f._id)) return false;
      if (visibility !== 'all' && f.visibility !== visibility) return false;
      return true;
    });
  }, [files, activeSection, recentOpenIds, starredIds, visibility]);

  const allFolders = useMemo(() => {
    const source = new Set([...(folders || []), ...files.map((f) => f.folder).filter(Boolean)]);
    return Array.from(source).sort((a, b) => String(a).localeCompare(String(b)));
  }, [folders, files]);

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

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      if (authUser?.role === 'admin') {
        formData.append('ownerId', authUser.id);
      }
      formData.append('visibility', uploadForm.visibility);
      formData.append('folder', uploadForm.folder);
      formData.append('tags', uploadForm.tags);
      formData.append('notes', uploadForm.notes);
      await api.uploadFile(formData);
      setUploadForm({
        file: null,
        visibility: expectedRole === 'client' ? 'client' : 'private',
        folder: '',
        tags: '',
        notes: '',
      });
      await loadFiles();
      await loadFolders();
      await loadActivity();
    } catch (err) {
      setError(err.message || 'Failed to upload file');
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
      tags: Array.isArray(file.tags) ? file.tags.join(', ') : '',
      notes: file.notes || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingFile) return;
    try {
      setSavingEdit(true);
      await api.updateFile(editingFile._id, {
        originalName: editForm.originalName,
        visibility: editForm.visibility,
        folder: editForm.folder,
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

  const openFile = (file) => {
    const url = resolveFileUrl(file);
    if (!url) return;
    setRecentOpenIds((prev) => [file._id, ...prev.filter((id) => id !== file._id)].slice(0, 50));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const viewFile = async (file) => {
    if (!isPreviewable(file)) {
      openFile(file);
      return;
    }
    setRecentOpenIds((prev) => [file._id, ...prev.filter((id) => id !== file._id)].slice(0, 50));
    setPreviewFile(file);
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

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredFiles.map((file) => file._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleBulkDelete = async () => {
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
  };

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

  const copySelectedLinks = async () => {
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
  };

  const handleDropUpload = (event) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (!dropped) return;
    setUploadForm((prev) => ({ ...prev, file: dropped }));
  };

  const openContextMenu = (event, file) => {
    event.preventDefault();
    event.stopPropagation();
    const mobile = window.innerWidth < 640;
    const menuWidth = 220;
    const menuHeight = 320;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;
    setContextMenu({
      open: true,
      x: mobile ? 8 : Math.max(8, Math.min(event.clientX, maxX)),
      y: mobile ? 0 : Math.max(8, Math.min(event.clientY, maxY)),
      mobile,
      mode: selectedIds.includes(file._id) && selectedIds.length > 1 ? 'multi' : 'single',
      file,
      folderPath: '',
    });
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
    const mobile = window.innerWidth < 640;
    const menuWidth = 220;
    const menuHeight = 320;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;
    setContextMenu({
      open: true,
      x: mobile ? 8 : Math.max(8, Math.min(event.clientX, maxX)),
      y: mobile ? 0 : Math.max(8, Math.min(event.clientY, maxY)),
      mobile,
      mode: 'single',
      file: null,
      folderPath: folderPath || '__root__',
    });
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
      const url = resolveFileUrl(file);
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

  useEffect(() => {
    const onKeyDown = async (event) => {
      const target = event.target;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isEditable) return;

      if (event.key === 'Delete' && canManage && hasSelection) {
        event.preventDefault();
        await handleBulkDelete();
        return;
      }

      if (event.key === 'Enter' && selectedFiles.length === 1) {
        event.preventDefault();
        openFile(selectedFiles[0]);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && hasSelection) {
        event.preventDefault();
        await copySelectedLinks();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canManage, hasSelection, selectedFiles]);

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

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setAuthUser(null);
      setFiles([]);
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
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
                <Button variant="outline" size="sm" onClick={() => setShowOptionsModal(true)}>
                  Options
                </Button>
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
        <CardContent onContextMenu={(e) => openFolderContextMenu(e, folderFilter === 'all' ? '__root__' : folderFilter)}>
          {filteredFiles.length === 0 && (viewMode !== 'grid' || folderCards.length === 0) ? (
            <p className="text-text-secondary dark:text-gray-400">No files found.</p>
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
                      className="border-b border-stroke/60 dark:border-gray-700/60 align-top"
                      onContextMenu={(e) => openContextMenu(e, file)}
                      onDoubleClick={() => openFile(file)}
                      draggable
                      onDragStart={(e) => onDragStartFile(e, file._id)}
                    >
                      {canManage && (
                        <td className="py-2 pr-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(file._id)}
                            onChange={() => toggleFileSelect(file._id)}
                          />
                        </td>
                      )}
                      <td className="py-2 pr-4">
                        <p className="font-medium text-text-primary dark:text-gray-100 flex items-center gap-2">
                          {starredIds.includes(file._id) && <span className="text-yellow-500">★</span>}
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
                          <span className="text-lg leading-none">⋮</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {folderCards.map((folder, folderIndex) => (
                <div
                  key={`folder-${folder.path}`}
                  className="rounded-xl border border-stroke dark:border-gray-700 p-3 bg-surface-card dark:bg-gray-900 fm-grid-item fm-card-animate"
                  style={{ animationDelay: `${Math.min(folderIndex * 22, 180)}ms` }}
                  onContextMenu={(e) => openFolderContextMenu(e, folder.path)}
                  onDoubleClick={() => setFolderFilter(folder.path)}
                  draggable
                  onDragStart={(e) => onDragStartFolder(e, folder.path)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropToFolder(e, folder.path)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary dark:text-gray-100 truncate">Folder: {folder.name}</p>
                      <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{folder.path}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Folder options"
                      className="w-8 h-8 rounded-md border border-stroke dark:border-gray-600 hover:bg-surface-muted dark:hover:bg-gray-800 flex items-center justify-center"
                      onClick={(e) => openFolderContextMenu(e, folder.path)}
                    >
                      <span className="text-lg leading-none">⋮</span>
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" size="sm">{folder.fileCount} files</Badge>
                  </div>
                </div>
              ))}
              {filteredFiles.map((file, fileIndex) => (
                <div
                  key={file._id}
                  className="rounded-xl border border-stroke dark:border-gray-700 p-3 bg-surface-card dark:bg-gray-900 fm-grid-item fm-card-animate"
                  style={{ animationDelay: `${Math.min((folderCards.length + fileIndex) * 22, 260)}ms` }}
                  onContextMenu={(e) => openContextMenu(e, file)}
                  onDoubleClick={() => openFile(file)}
                  draggable
                  onDragStart={(e) => onDragStartFile(e, file._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary dark:text-gray-100 truncate flex items-center gap-1">
                        {starredIds.includes(file._id) && <span className="text-yellow-500">★</span>}
                        <span className="truncate">{file.originalName}</span>
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{file.folder || 'No folder'}</p>
                    </div>
                    {canManage && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(file._id)}
                        onChange={() => toggleFileSelect(file._id)}
                      />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" size="sm">{file.visibility}</Badge>
                    <Badge variant="secondary" size="sm">{formatSize(file.size)}</Badge>
                    <Badge variant="secondary" size="sm">{formatDate(file.updatedAt || file.createdAt)}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-label="File options"
                      className="w-8 h-8 rounded-md border border-stroke dark:border-gray-600 hover:bg-surface-muted dark:hover:bg-gray-800 flex items-center justify-center"
                      onClick={(e) => openContextMenuFromButton(e, file)}
                    >
                      <span className="text-lg leading-none">⋮</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {authUser.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-text-secondary dark:text-gray-400">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {activityLogs.map((log) => (
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
          onClose={() => { setPreviewFile(null); setPreviewText(''); }}
          title={`Preview: ${previewFile.originalName}`}
          size="xl"
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openFile(previewFile)}>
                Open in New Tab
              </Button>
            </div>
            {(() => {
              const url = resolveFileUrl(previewFile);
              if (isImageFile(previewFile)) {
                return <img src={url} alt={previewFile.originalName} className="max-h-[70vh] w-full object-contain rounded-lg border border-stroke dark:border-gray-700" />;
              }
              if (isPdfFile(previewFile)) {
                return <iframe title={previewFile.originalName} src={url} className="w-full h-[70vh] rounded-lg border border-stroke dark:border-gray-700" />;
              }
              if (isVideoFile(previewFile)) {
                return (
                  <video
                    controls
                    preload="metadata"
                    className="w-full max-h-[70vh] rounded-lg border border-stroke dark:border-gray-700 bg-black"
                    src={url}
                  />
                );
              }
              if (isOfficeFile(previewFile)) {
                const absoluteUrl = getAbsoluteUrl(url);
                const isPublicHttps =
                  absoluteUrl.startsWith('https://') &&
                  !absoluteUrl.includes('localhost') &&
                  !absoluteUrl.includes('127.0.0.1');
                if (isPublicHttps) {
                  const officeEmbed = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
                  return (
                    <iframe
                      title={previewFile.originalName}
                      src={officeEmbed}
                      className="w-full h-[70vh] rounded-lg border border-stroke dark:border-gray-700"
                    />
                  );
                }
                return (
                  <div className="rounded-lg border border-stroke dark:border-gray-700 p-4 bg-surface-muted dark:bg-gray-800">
                    <p className="text-sm text-text-primary dark:text-gray-100">
                      Office preview needs a public HTTPS file URL.
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                      In local development, use Open in New Tab or download the file.
                    </p>
                  </div>
                );
              }
              if (isTextPreview(previewFile)) {
                if (previewLoading) {
                  return <p className="text-sm text-text-secondary dark:text-gray-400">Loading preview...</p>;
                }
                return (
                  <pre className="text-xs whitespace-pre-wrap max-h-[70vh] overflow-auto rounded-lg border border-stroke dark:border-gray-700 bg-surface-muted dark:bg-gray-800 p-3 text-text-primary dark:text-gray-100">
                    {previewText || 'No content.'}
                  </pre>
                );
              }
              return <p className="text-sm text-text-secondary dark:text-gray-400">Preview is not available for this file type.</p>;
            })()}
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
          onClose={() => setShowUploadModal(false)}
          title="Upload File"
          size="md"
        >
          <form onSubmit={async (e) => { await handleUpload(e); setShowUploadModal(false); }} className="space-y-3">
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
    </div>
  );
}
