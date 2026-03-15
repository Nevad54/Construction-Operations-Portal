import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, ModalFooter, Select } from '../ui';

const roleOptions = [
  { value: 'user', label: 'User (Employee)' },
  { value: 'admin', label: 'Admin' },
  { value: 'client', label: 'Client' },
];

export default function AccountSettings({ mode = 'user' }) {
  const isAdmin = mode === 'admin';
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState('');
  const [me, setMe] = useState(null);

  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeOk, setChangeOk] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [users, setUsers] = useState([]);

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [projects, setProjects] = useState([]);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'user' });

  const [resetModal, setResetModal] = useState({ open: false, user: null });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  const [projectsModal, setProjectsModal] = useState({ open: false, user: null });
  const [projectsSaving, setProjectsSaving] = useState(false);
  const [projectsPick, setProjectsPick] = useState([]);
  const [projectsPickError, setProjectsPickError] = useState('');
  const [projectsQuery, setProjectsQuery] = useState('');

  const mounted = useRef(true);

  const loadMe = async () => {
    try {
      setMeError('');
      const data = await api.me();
      if (!mounted.current) return;
      setMe(data?.user || null);
    } catch (err) {
      if (!mounted.current) return;
      setMe(null);
      setMeError(err?.message || 'Failed to load session');
    } finally {
      if (mounted.current) setMeLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      setUsersError('');
      setUsersLoading(true);
      const data = await api.adminListUsers();
      if (!mounted.current) return;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!mounted.current) return;
      setUsers([]);
      setUsersError(err?.message || 'Failed to load users');
    } finally {
      if (mounted.current) setUsersLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!isAdmin) return;
    try {
      setProjectsError('');
      setProjectsLoading(true);
      const data = await api.getProjects();
      if (!mounted.current) return;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!mounted.current) return;
      setProjects([]);
      setProjectsError(err?.message || 'Failed to load projects');
    } finally {
      if (mounted.current) setProjectsLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    loadMe();
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin && !meLoading) {
      loadUsers();
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, meLoading]);

  const onChangePassword = async (e) => {
    e.preventDefault();
    setChangeOk('');
    setChangeError('');
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setChangeError('Please fill in current and new password.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setChangeError('New password and confirmation do not match.');
      return;
    }
    try {
      setChanging(true);
      await api.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setChangeOk('Password updated.');
    } catch (err) {
      setChangeError(err?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  const onCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.email || !createForm.password) {
      setCreateError('Email and password are required.');
      return;
    }
    try {
      setCreateLoading(true);
      await api.adminCreateUser(createForm);
      setCreateForm({ email: '', password: '', role: 'user' });
      await loadUsers();
    } catch (err) {
      setCreateError(err?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const openReset = (user) => {
    setResetError('');
    setResetPassword('');
    setResetModal({ open: true, user });
  };

  const openProjects = (user) => {
    const ids = Array.isArray(user?.projectIds) ? user.projectIds : [];
    setProjectsPickError('');
    setProjectsQuery('');
    setProjectsPick(ids.map((v) => String(v)));
    setProjectsModal({ open: true, user });
  };

  const onSaveProjects = async () => {
    if (!projectsModal.user) return;
    setProjectsPickError('');
    try {
      setProjectsSaving(true);
      await api.adminUpdateUser(projectsModal.user.id, { projectIds: projectsPick });
      setProjectsModal({ open: false, user: null });
      await loadUsers();
      await loadMe();
    } catch (err) {
      setProjectsPickError(err?.message || 'Failed to update project access');
    } finally {
      setProjectsSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!resetModal.user) return;
    setResetError('');
    if (!resetPassword) {
      setResetError('New password is required.');
      return;
    }
    try {
      setResetLoading(true);
      await api.adminResetUserPassword(resetModal.user.id, resetPassword);
      setResetModal({ open: false, user: null });
      setResetPassword('');
    } catch (err) {
      setResetError(err?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const onDeleteUser = async (user) => {
    if (!user) return;
    const isActive = user.isActive !== false;
    if (!window.confirm(
      isActive
        ? `Deactivate "${user.email || user.username}" (${user.role})? They will keep their history but lose access.`
        : `Reactivate "${user.email || user.username}" (${user.role})?`
    )) return;
    try {
      if (isActive) {
        await api.adminDeleteUser(user.id);
      } else {
        await api.adminSetUserActive(user.id, true);
      }
      await loadUsers();
    } catch (err) {
      setUsersError(err?.message || `Failed to ${isActive ? 'deactivate' : 'reactivate'} user`);
    }
  };

  const meBadge = useMemo(() => {
    if (!me) return null;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-muted dark:bg-gray-800 text-text-secondary dark:text-gray-300 capitalize">
        {me.role}
      </span>
    );
  }, [me]);

  const projectOptions = useMemo(() => {
    return (projects || [])
      .map((p) => ({ id: String(p._id || p.id || ''), title: String(p.title || 'Untitled Project') }))
      .filter((p) => p.id);
  }, [projects]);

  const filteredProjectOptions = useMemo(() => {
    const q = String(projectsQuery || '').trim().toLowerCase();
    if (!q) return projectOptions;
    return projectOptions.filter((p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [projectOptions, projectsQuery]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {meLoading ? (
            <p className="text-text-secondary dark:text-gray-400">Loading account...</p>
          ) : me ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-text-secondary dark:text-gray-400">Signed in as</p>
                <p className="text-base font-semibold text-text-primary dark:text-gray-100 truncate">
                  {me.email || me.username} {meBadge}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-feedback-error">{meError || 'Not signed in.'}</p>
          )}

          <form onSubmit={onChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="email"
              name="accountEmail"
              value={me?.email || me?.username || ''}
              autoComplete="username"
              readOnly
              tabIndex={-1}
              className="sr-only"
              aria-hidden="true"
            />
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              autoComplete="current-password"
              required
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              autoComplete="new-password"
              helperText="Use at least 8 characters with at least one letter and one number."
              required
            />
            <Input
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
              required
            />
            <div className="md:col-span-3">
              <Button type="submit" loading={changing}>
                Change Password
              </Button>
            </div>
          </form>
          {changeError && <p className="text-feedback-error text-sm">{changeError}</p>}
          {changeOk && <p className="text-feedback-success text-sm">{changeOk}</p>}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Email"
                name="createUserEmail"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                name="createUserPassword"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                autoComplete="new-password"
                helperText="Use at least 8 characters with at least one letter and one number."
                required
              />
              <Select
                label="Role"
                value={createForm.role}
                onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
                options={roleOptions}
              />
              <div className="md:col-span-3">
                <Button type="submit" loading={createLoading}>
                  Create User
                </Button>
              </div>
            </form>
            {createError && <p className="text-feedback-error text-sm">{createError}</p>}

            <div className="rounded-xl border border-stroke dark:border-gray-700 overflow-hidden">
              {usersLoading ? (
                <div className="px-4 py-3 text-sm text-text-secondary dark:text-gray-400">Loading users...</div>
              ) : users.length ? (
                <>
                  <div className="hidden md:grid grid-cols-12 bg-surface-muted dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-text-secondary dark:text-gray-300">
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-3">Projects</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                  <div className="hidden md:block">
                    {users.map((u) => (
                      <div key={`desktop-${u.id}`} className="grid grid-cols-12 px-4 py-3 text-sm border-t border-stroke dark:border-gray-700 items-center">
                        <div className="col-span-4 min-w-0">
                          <p className="font-medium text-text-primary dark:text-gray-100 truncate">{u.email || u.username}</p>
                        </div>
                        <div className="col-span-2 capitalize text-text-secondary dark:text-gray-300">{u.isActive === false ? `inactive ${u.role}` : u.role}</div>
                        <div className="col-span-3 text-text-secondary dark:text-gray-300">
                          {Array.isArray(u.projectIds) && u.projectIds.length ? `${u.projectIds.length} assigned` : 'None'}
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openProjects(u)}>
                            Assign
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openReset(u)}>
                            Reset Password
                          </Button>
                          <Button variant={u.isActive === false ? 'outline' : 'danger'} size="sm" onClick={() => onDeleteUser(u)}>
                            {u.isActive === false ? 'Reactivate' : 'Deactivate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="md:hidden divide-y divide-stroke dark:divide-gray-700">
                    {users.map((u) => (
                      <div key={`mobile-${u.id}`} className="px-4 py-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary dark:text-gray-100 truncate">{u.email || u.username}</p>
                            <p className="text-xs text-text-secondary dark:text-gray-400 capitalize">{u.isActive === false ? `inactive ${u.role}` : u.role}</p>
                          </div>
                          <span className="text-xs text-text-secondary dark:text-gray-400">
                            {Array.isArray(u.projectIds) && u.projectIds.length ? `${u.projectIds.length} assigned` : 'No projects'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openProjects(u)}>
                            Assign
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openReset(u)}>
                            Reset Password
                          </Button>
                          <Button variant={u.isActive === false ? 'outline' : 'danger'} size="sm" onClick={() => onDeleteUser(u)}>
                            {u.isActive === false ? 'Reactivate' : 'Deactivate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-text-secondary dark:text-gray-400">No users found.</div>
              )}
            </div>
            {usersError && <p className="text-feedback-error text-sm">{usersError}</p>}
            {projectsError && <p className="text-feedback-error text-sm">{projectsError}</p>}
          </CardContent>
        </Card>
      )}

      {resetModal.open && (
        <Modal
          isOpen={resetModal.open}
          title="Reset Password"
          onClose={() => setResetModal({ open: false, user: null })}
          size="sm"
        >
          <div className="space-y-3">
            <p className="text-sm text-text-secondary dark:text-gray-400">
              Reset password for <span className="font-semibold text-text-primary dark:text-gray-100">{resetModal.user?.email || resetModal.user?.username}</span>
            </p>
            <input
              type="email"
              name="resetUserEmail"
              value={resetModal.user?.email || resetModal.user?.username || ''}
              autoComplete="username"
              readOnly
              tabIndex={-1}
              className="sr-only"
              aria-hidden="true"
            />
            <Input
              label="New Password"
              name="resetUserPassword"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              autoComplete="new-password"
              helperText="Use at least 8 characters with at least one letter and one number."
              required
            />
            {resetError && <p className="text-feedback-error text-sm">{resetError}</p>}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setResetModal({ open: false, user: null })} disabled={resetLoading}>
              Cancel
            </Button>
            <Button onClick={onResetPassword} loading={resetLoading}>
              Reset
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {projectsModal.open && (
        <Modal
          isOpen={projectsModal.open}
          title="Assign Projects"
          onClose={() => setProjectsModal({ open: false, user: null })}
          size="md"
        >
          <div className="space-y-3">
            <p className="text-sm text-text-secondary dark:text-gray-400">
              Project access for <span className="font-semibold text-text-primary dark:text-gray-100">{projectsModal.user?.email || projectsModal.user?.username}</span>
            </p>

            <Input
              label="Search Projects"
              value={projectsQuery}
              onChange={(e) => setProjectsQuery(e.target.value)}
              placeholder="Type to filter projects..."
            />

            <div className="rounded-xl border border-stroke dark:border-gray-700 max-h-64 overflow-auto">
              {projectsLoading ? (
                <div className="px-4 py-3 text-sm text-text-secondary dark:text-gray-400">Loading projects...</div>
              ) : filteredProjectOptions.length ? (
                filteredProjectOptions.map((p) => {
                  const checked = projectsPick.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-start gap-3 px-4 py-3 border-t first:border-t-0 border-stroke dark:border-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? Array.from(new Set([...projectsPick, p.id]))
                            : projectsPick.filter((id) => id !== p.id);
                          setProjectsPick(next);
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary dark:text-gray-100 truncate">{p.title}</p>
                        <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{p.id}</p>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-text-secondary dark:text-gray-400">
                  No projects found.
                </div>
              )}
            </div>

            {projectsPickError && <p className="text-feedback-error text-sm">{projectsPickError}</p>}
            {!projectsPickError && (
              <p className="text-xs text-text-secondary dark:text-gray-400">
                Tip: Client users only see files marked as <span className="font-medium">client</span> visibility that match their assigned projects.
              </p>
            )}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setProjectsModal({ open: false, user: null })} disabled={projectsSaving}>
              Cancel
            </Button>
            <Button onClick={onSaveProjects} loading={projectsSaving}>
              Save
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
