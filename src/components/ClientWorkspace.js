import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Badge, Card, CardContent, CardHeader, CardTitle } from './ui';

const formatDate = (value) => {
  if (!value) return 'Waiting for first update';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const startCase = (value) => {
  return String(value || 'active')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getFollowUpTone = (status, notes = '') => {
  const normalized = String(status || '').toLowerCase();
  const noteFingerprint = String(notes || '').toLowerCase();
  if (noteFingerprint.includes('approval-approved')) return 'Approved';
  if (noteFingerprint.includes('approval-changes')) return 'Changes Requested';
  if (normalized === 'resolved') return 'Resolved';
  if (normalized === 'in_progress') return 'In Progress';
  if (normalized === 'spam') return 'Closed';
  return 'New';
};

const getNewestStamp = (file) => {
  return new Date(file?.updatedAt || file?.createdAt || 0).getTime();
};

const getFileFingerprint = (file = {}, projectTitle = '') => {
  return [
    projectTitle,
    file?.originalName,
    file?.folder,
    Array.isArray(file?.tags) ? file.tags.join(' ') : '',
    file?.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const getReviewQueueEntry = (file, projectTitle) => {
  const fingerprint = getFileFingerprint(file, projectTitle);

  if (/closeout|warranty|handoff|turnover|punch/.test(fingerprint)) {
    return {
      label: 'Closeout review',
      summary: 'Confirm punch follow-up, handoff notes, and the final client-ready package before turnover closes.',
      badge: 'Ready for handoff',
    };
  }

  if (/permit|approval|submittal|finish|selection|owner/.test(fingerprint)) {
    return {
      label: 'Approval review',
      summary: 'Check the approval-sensitive material and confirm any owner-side decision still needed to keep work moving.',
      badge: 'Approval needed',
    };
  }

  if (/photo|image|jpg|jpeg|png|snapshot|progress/.test(fingerprint)) {
    return {
      label: 'Progress review',
      summary: 'Use the latest visual update to confirm field progress and flag anything that needs clarification.',
      badge: 'Field update',
    };
  }

  if (/schedule|plan|checklist|xlsx|spreadsheet|coordination/.test(fingerprint)) {
    return {
      label: 'Coordination review',
      summary: 'Review the planning package so the next milestone, dependency, or client-side response stays on track.',
      badge: 'Coordination',
    };
  }

  return {
    label: 'File review',
    summary: 'Open the latest shared document and confirm whether any response or follow-up is needed from the client side.',
    badge: 'New file',
  };
};

const looksResidentialProject = (projectTitle = '', fileName = '') => {
  const fingerprint = `${projectTitle} ${fileName}`.toLowerCase();
  return /residential|homeowner|home|condo|kitchen|bath|closeout/.test(fingerprint);
};

const inferProjectType = (projectTitle = '', fileName = '', note = '') => {
  const fingerprint = `${projectTitle} ${fileName} ${note}`.toLowerCase();

  if (/residential|homeowner|condo|kitchen|bath|living room|fit-out/.test(fingerprint)) {
    return 'Residential Renovation';
  }

  if (/industrial|plant|shutdown|fabrication|process|maintenance/.test(fingerprint)) {
    return 'Industrial Retrofit';
  }

  if (/commercial|office|tenant|retail|lobby/.test(fingerprint)) {
    return 'Commercial Fit-Out';
  }

  if (/site|drainage|channel|grading|civil/.test(fingerprint)) {
    return 'Site Development';
  }

  return 'Plant Support';
};

const buildWorkspaceActionLink = ({ fileName, projectTitle, label, note, context = 'follow-up-request', action = 'Need follow-up on' }) => {
  const params = new URLSearchParams({
    projectType: inferProjectType(projectTitle, fileName, note),
    source: 'client-workspace',
    context,
    message: `${action} "${fileName}" for ${projectTitle}. Current review item: ${label}.${context === 'approval-approved'
      ? ' Please record this item as approved and confirm the next handoff step.'
      : context === 'approval-changes'
        ? ' Please record that changes were requested and confirm the revised next step.'
        : ' Please confirm status, any client-side decisions needed, and the next handoff step.'}${note ? ` Additional note: ${note}` : ''}`,
  });

  return `/contact?${params.toString()}`;
};

export default function ClientWorkspace() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [summary, setSummary] = useState({
    user: null,
    files: [],
    projects: [],
    followUps: [],
    warnings: [],
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError('');

      const [meResult, filesResult, projectsResult, followUpsResult] = await Promise.allSettled([
        api.me(),
        api.getFiles(),
        api.getProjects(),
        api.getClientFollowUps(),
      ]);

      if (!active) return;

      if (meResult.status === 'rejected') {
        setLoadError(meResult.reason?.message || 'Failed to load your workspace.');
        setSummary({ user: null, files: [], projects: [], followUps: [], warnings: [] });
        setLoading(false);
        return;
      }

      const warnings = [];

      if (filesResult.status === 'rejected') {
        warnings.push('Shared files are temporarily unavailable. You can refresh or try the file library directly.');
      }

      if (projectsResult.status === 'rejected') {
        warnings.push('Project labels could not be loaded, so the workspace is showing file activity without project names.');
      }

      if (followUpsResult.status === 'rejected') {
        warnings.push('Follow-up status is temporarily unavailable. Requests still go through the contact intake, but status history could not be loaded right now.');
      }

      setSummary({
        user: meResult.value?.user || null,
        files: Array.isArray(filesResult.value) ? filesResult.value : [],
        projects: Array.isArray(projectsResult.value) ? projectsResult.value : [],
        followUps: Array.isArray(followUpsResult.value?.items) ? followUpsResult.value.items : [],
        warnings,
      });
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const user = summary.user;
  const files = summary.files;
  const projects = summary.projects;
  const followUps = summary.followUps;

  const projectTitleById = useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      const id = String(project?._id || project?.id || '').trim();
      if (!id) return;
      map[id] = {
        title: String(project?.title || 'Untitled project'),
        status: startCase(project?.status || 'active'),
      };
    });
    return map;
  }, [projects]);

  const recentFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => getNewestStamp(b) - getNewestStamp(a))
      .slice(0, 5);
  }, [files]);

  const reviewQueue = useMemo(() => {
    return recentFiles.slice(0, 3).map((file) => {
      const project = projectTitleById[String(file?.projectId || '').trim()];
      const projectTitle = project?.title || 'Shared project workspace';
      return {
        id: file._id || `${file.originalName}-${file.createdAt}`,
        fileName: file.originalName || 'Untitled file',
        projectTitle,
        updatedAt: file.updatedAt || file.createdAt || '',
        note: String(file?.notes || '').trim(),
        access: startCase(file.visibility || 'client'),
        followUpHref: buildWorkspaceActionLink({
          fileName: file.originalName || 'Untitled file',
          projectTitle,
          label: getReviewQueueEntry(file, projectTitle).label,
          note: String(file?.notes || '').trim(),
        }),
        approveHref: buildWorkspaceActionLink({
          fileName: file.originalName || 'Untitled file',
          projectTitle,
          label: getReviewQueueEntry(file, projectTitle).label,
          note: String(file?.notes || '').trim(),
          context: 'approval-approved',
          action: 'Approving',
        }),
        requestChangesHref: buildWorkspaceActionLink({
          fileName: file.originalName || 'Untitled file',
          projectTitle,
          label: getReviewQueueEntry(file, projectTitle).label,
          note: String(file?.notes || '').trim(),
          context: 'approval-changes',
          action: 'Requesting changes on',
        }),
        ...getReviewQueueEntry(file, projectTitle),
      };
    });
  }, [projectTitleById, recentFiles]);

  const projectSummaries = useMemo(() => {
    const grouped = new Map();

    recentFiles.forEach((file) => {
      const key = String(file?.projectId || '').trim();
      if (!key) return;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title: projectTitleById[key]?.title || 'Shared project workspace',
          status: projectTitleById[key]?.status || 'Active',
          latestUpdate: file?.updatedAt || file?.createdAt || '',
          fileCount: 0,
        });
      }

      const entry = grouped.get(key);
      entry.fileCount += 1;

      const currentStamp = new Date(entry.latestUpdate || 0).getTime();
      const nextStamp = getNewestStamp(file);
      if (nextStamp > currentStamp) {
        entry.latestUpdate = file?.updatedAt || file?.createdAt || '';
      }
    });

    return Array.from(grouped.values()).slice(0, 3);
  }, [projectTitleById, recentFiles]);

  const recentUpdateCount = useMemo(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return files.filter((file) => getNewestStamp(file) >= sevenDaysAgo).length;
  }, [files]);

  const featuredResidentialHandoff = useMemo(() => {
    const candidate = [...files]
      .sort((a, b) => getNewestStamp(b) - getNewestStamp(a))
      .find((file) => {
        const projectTitle = projectTitleById[String(file?.projectId || '').trim()]?.title || '';
        return looksResidentialProject(projectTitle, file?.originalName || '');
      });

    if (!candidate) return null;

    const project = projectTitleById[String(candidate?.projectId || '').trim()];
    return {
      title: project?.title || 'Residential handoff',
      status: project?.status || 'Active',
      fileName: candidate?.originalName || 'Shared residential file',
      updatedAt: candidate?.updatedAt || candidate?.createdAt || '',
      summary: String(candidate?.originalName || '').toLowerCase().includes('closeout')
        ? 'Closeout material is ready for homeowner review, punch follow-up, and final handoff visibility.'
        : 'Residential owner-facing files are available here so approvals and turnover steps stay visible.',
    };
  }, [files, projectTitleById]);

  const nextActions = useMemo(() => {
    const actions = [];

    if (recentFiles.length > 0) {
      actions.push(`Review the latest shared document: ${recentFiles[0].originalName || 'recent file'}.`);
    } else {
      actions.push('Watch for your first shared file drop. The workspace will surface it here as soon as it lands.');
    }

    if (projectSummaries.length > 0) {
      actions.push(`Check the current project room for ${projectSummaries[0].title} and confirm the latest handoff items.`);
    } else {
      actions.push('Use the file library to confirm which project folders are live and ask for anything still missing.');
    }

    actions.push('Use this workspace as the single record for updates, shared documents, and the next client-side review step.');

    return actions;
  }, [projectSummaries, recentFiles]);

  const followUpItems = useMemo(() => {
    return [...followUps]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        statusLabel: getFollowUpTone(item.status, item.notes),
        projectType: item.projectType || 'Client follow-up',
        message: item.message || 'Follow-up request submitted through the client workspace.',
        owner: item.owner || 'Awaiting assignment',
        notes: item.notes || '',
        updatedAt: item.updatedAt || item.createdAt || '',
        nextFollowUpAt: item.nextFollowUpAt || '',
      }));
  }, [followUps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary dark:text-gray-400">Loading client summary...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-feedback-error">{loadError}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login/client"
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600"
                >
                  Return to client login
                </Link>
                <Link
                  to="/client/files"
                  className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-muted dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  Open file library
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page dark:bg-gray-950 text-text-primary dark:text-gray-100 px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="overflow-hidden border-brand/15 dark:border-brand/30">
          <div className="bg-gradient-to-r from-brand/10 via-surface-card to-amber-100/50 px-6 py-6 dark:from-brand-900/30 dark:via-gray-900 dark:to-amber-900/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Client Workspace</p>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-gray-100">
                    Keep project visibility, shared files, and next actions in one place.
                  </h1>
                  <p className="max-w-3xl text-sm sm:text-base text-text-secondary dark:text-gray-300">
                    {user?.username ? `${user.username}, this workspace is your current handoff summary.` : 'Use this workspace as your current handoff summary.'} Review what changed recently, which project rooms are active, and where to go next without digging through separate threads.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/client/files"
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600"
                >
                  Open shared files
                </Link>
                <Link
                  to="/client-portal"
                  className="inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-muted dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  Review portal overview
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {summary.warnings.length > 0 && (
          <Card variant="subtle">
            <CardContent className="space-y-2">
              {summary.warnings.map((warning) => (
                <p key={warning} className="text-sm text-text-secondary dark:text-gray-300">
                  {warning}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {featuredResidentialHandoff && (
          <Card className="overflow-hidden border-amber-200 dark:border-amber-700/40">
            <div className="bg-gradient-to-r from-amber-50 via-surface-card to-orange-50 px-6 py-5 dark:from-amber-900/20 dark:via-gray-900 dark:to-orange-900/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                    Residential Handoff Spotlight
                  </p>
                  <div>
                    <h2 className="text-2xl font-semibold text-text-primary dark:text-gray-100">
                      {featuredResidentialHandoff.title}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary dark:text-gray-300">
                      {featuredResidentialHandoff.summary}
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    Latest shared item: {featuredResidentialHandoff.fileName} | Updated {formatDate(featuredResidentialHandoff.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{featuredResidentialHandoff.status}</Badge>
                  <Link
                    to="/client/files"
                    className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600"
                  >
                    Review residential files
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle size="sm">Shared Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-text-primary dark:text-gray-100">{files.length}</p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Client-visible files currently available for review and download.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle size="sm">Active Project Rooms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-text-primary dark:text-gray-100">{projectSummaries.length}</p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Project spaces with recent shared activity tied to your file access.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle size="sm">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-text-primary dark:text-gray-100">{recentUpdateCount}</p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Files touched in the last 7 days, so you can see whether new material has landed.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Client Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewQueue.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-gray-400">
                No review items are staged yet. As soon as the team shares a client-visible drawing, checklist, photo, or closeout pack, this queue will turn it into an explicit next step.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {reviewQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-stroke bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                        {item.label}
                      </p>
                      <Badge variant="secondary">{item.badge}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <h2 className="text-lg font-semibold text-text-primary dark:text-gray-100">{item.fileName}</h2>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        {item.projectTitle} | Updated {formatDate(item.updatedAt)}
                      </p>
                      <p className="text-sm text-text-secondary dark:text-gray-300">{item.summary}</p>
                      {item.note && (
                        <p className="rounded-lg border border-dashed border-brand/25 bg-brand/5 px-3 py-2 text-sm text-text-secondary dark:bg-brand-900/10 dark:text-gray-300">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{item.access}</Badge>
                      <Link
                        to="/client/files"
                        className="inline-flex items-center justify-center rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-text-primary transition-all hover:bg-surface-muted dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                      >
                        Review in library
                      </Link>
                      <Link
                        to={item.followUpHref}
                        className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600"
                      >
                        Request follow-up
                      </Link>
                      <Link
                        to={item.approveHref}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                      >
                        Approve item
                      </Link>
                      <Link
                        to={item.requestChangesHref}
                        className="inline-flex items-center justify-center rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                      >
                        Request changes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-Up Status</CardTitle>
          </CardHeader>
          <CardContent>
            {followUpItems.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Follow-up requests you send from this workspace will appear here with their current status and next response target.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {followUpItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-stroke bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                        {item.statusLabel}
                      </p>
                      <Badge variant="secondary">{item.projectType}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-text-secondary dark:text-gray-300">{item.message}</p>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Status updated {formatDate(item.updatedAt)}
                      </p>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Owner: {item.owner}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Tracking note: {item.notes.replace(/^Context:\s*/i, '')}
                        </p>
                      )}
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        {item.nextFollowUpAt ? `Next follow-up target: ${formatDate(item.nextFollowUpAt)}` : 'Next follow-up target pending assignment.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Current Project Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectSummaries.length === 0 ? (
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  No project rooms are linked yet. Shared files will start building a project summary here as soon as the first client-visible handoff is attached to a project.
                </p>
              ) : (
                <div className="space-y-3">
                  {projectSummaries.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-stroke bg-surface-muted/50 p-4 dark:border-gray-700 dark:bg-gray-900/60"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <h2 className="text-lg font-semibold text-text-primary dark:text-gray-100">{project.title}</h2>
                          <p className="text-sm text-text-secondary dark:text-gray-400">
                            Latest shared update: {formatDate(project.latestUpdate)}
                          </p>
                        </div>
                        <Badge variant="secondary">{project.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-text-secondary dark:text-gray-300">
                        {project.fileCount} recent client-visible {project.fileCount === 1 ? 'item' : 'items'} connected to this project room.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                {nextActions.map((action) => (
                  <li
                    key={action}
                    className="rounded-xl border border-stroke bg-surface-muted/50 px-4 py-3 text-sm text-text-secondary dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
                  >
                    {action}
                  </li>
                ))}
              </ol>
              <div className="rounded-xl border border-dashed border-brand/30 bg-brand/5 px-4 py-3 dark:bg-brand-900/10">
                <p className="text-sm text-text-secondary dark:text-gray-300">
                  Need something that is not in the workspace yet? Use the portal as the source of truth, then request the missing handoff item from the project team.
                </p>
                <div className="mt-3">
                  <Link
                    to="/contact?source=client-workspace&context=general-follow-up&message=Need a follow-up on a client workspace item that is not currently visible. Please confirm the missing handoff item, current status, and expected next step."
                    className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600"
                  >
                    Request a general follow-up
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Latest Shared Material</CardTitle>
          </CardHeader>
          <CardContent>
            {recentFiles.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-gray-400">
                No shared files yet. When the team uploads drawings, photos, permits, or closeout material, the newest items will appear here first.
              </p>
            ) : (
              <div className="space-y-3">
                {recentFiles.map((file) => {
                  const project = projectTitleById[String(file?.projectId || '').trim()];
                  return (
                    <div
                      key={file._id || `${file.originalName}-${file.createdAt}`}
                      className="flex flex-col gap-3 rounded-xl border border-stroke bg-white/70 px-4 py-4 dark:border-gray-700 dark:bg-gray-900/60 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-text-primary dark:text-gray-100">{file.originalName || 'Untitled file'}</p>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          {project?.title || 'Shared file'} | Updated {formatDate(file.updatedAt || file.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{startCase(file.visibility || 'client')}</Badge>
                        <Link
                          to="/client/files"
                          className="inline-flex items-center justify-center rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-text-primary transition-all hover:bg-surface-muted dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                        >
                          Open library
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
