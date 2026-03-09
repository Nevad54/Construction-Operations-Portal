#!/usr/bin/env node
/*
  Sanitize data for security/demo usage:
  - Removes asset-heavy records (projects/files/inquiries/activity logs)
  - Replaces with safe construction sample data

  Usage:
    node backend/scripts/sanitize-demo-data.js --mode=fallback
    node backend/scripts/sanitize-demo-data.js --mode=mongo
    node backend/scripts/sanitize-demo-data.js --mode=both
*/

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode='));
const mode = (modeArg ? modeArg.split('=')[1] : 'fallback').toLowerCase();

if (!['fallback', 'mongo', 'both'].includes(mode)) {
  console.error('Invalid mode. Use --mode=fallback|mongo|both');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..', '..');
try {
  require('dotenv').config({ path: path.join(repoRoot, '.env') });
  require('dotenv').config();
} catch (_) {
  // dotenv is optional at runtime if env already provided
}

function nowIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function getSampleUploadImages() {
  const uploadsDir = path.join(repoRoot, 'public', 'Uploads');
  const fallback = ['/Uploads/industrial.jpg', '/Uploads/commercial.jpg', '/Uploads/renovation.jpg'];
  if (!fs.existsSync(uploadsDir)) return fallback;

  const deny = new Set([
    'logo.png',
    'logo-removebg-preview.png',
    'background.jpg',
    'background1.jpg',
    'background1.png',
    'cat.jpg',
    'dog.jpg',
    'bird.jpg',
  ]);

  const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
  const files = fs
    .readdirSync(uploadsDir)
    .filter((name) => allowedExt.has(path.extname(name).toLowerCase()))
    .filter((name) => !deny.has(name.toLowerCase()))
    .slice(0, 6)
    .map((name) => `/Uploads/${name}`);

  if (files.length < 3) return fallback;
  return files;
}

function pickExistingUploadPath(candidates, fallback = '/Uploads/industrial.jpg') {
  for (const candidate of candidates) {
    const name = String(candidate || '').replace('/Uploads/', '');
    const filePath = path.join(repoRoot, 'public', 'Uploads', name);
    if (name && fs.existsSync(filePath)) return `/Uploads/${name}`;
  }
  return fallback;
}

function buildSampleProjects() {
  const templates = [
    ['Bridge Retrofit Program', 'Retrofit works for aging bridge components, including deck strengthening and railing upgrades.', 'North District', 'City Infrastructure Office', ['/Uploads/1744087023216.png', '/Uploads/1744087111712.png']],
    ['Warehouse Expansion Phase 1', 'Design-build expansion with structural steel, slab extension, and stormwater improvements.', 'Logistics Park', 'LogiBuild Partners', ['/Uploads/showcase3.png', '/Uploads/commercial.jpg']],
    ['Municipal Road Improvement', 'Road widening, concrete paving, drainage channels, and traffic safety markings.', 'West Access Road', 'Municipal Engineering Office', ['/Uploads/1744082626975.png', '/Uploads/showcase1.png']],
    ['Site Drainage Upgrade', 'Installation of drain lines, catch basins, and pavement tie-ins to improve stormwater flow.', 'South Utility Zone', 'Regional Public Works', ['/Uploads/1744082424394.png', '/Uploads/1743834690463.jpg']],
    ['Plant Utility Piping Renewal', 'Replacement of old utility pipe racks, supports, and valves in active production zones.', 'Industrial Strip A', 'Apex Manufacturing', ['/Uploads/1743834690463.jpg', '/Uploads/1744087191359.png']],
    ['Commercial Fit-Out Package', 'Interior fit-out for office and retail units with MEP coordination and compliance checks.', 'Central Commercial Block', 'BlueStone Properties', ['/Uploads/commercial.jpg', '/Uploads/showcase2.png']],
    ['Concrete Pavement Rehabilitation', 'Concrete panel replacement, joint resealing, and surface correction for heavy traffic lanes.', 'Cargo Access Road', 'Port Logistics Authority', ['/Uploads/showcase1.png', '/Uploads/1744082626975.png']],
    ['Flood Control Channel Works', 'Channel lining, embankment stabilization, and culvert tie-ins for seasonal flood reduction.', 'Riverside Sector', 'Provincial Engineering Unit', ['/Uploads/1744082424394.png', '/Uploads/1744087023216.png']],
    ['Substation Civil Works', 'Foundation, cable trenching, and equipment pads for substation upgrade.', 'Power Corridor East', 'Grid Services Contractor', ['/Uploads/1744086896698.png', '/Uploads/1744080293122.png']],
    ['Factory Ventilation Upgrade', 'Duct routing, fan support structures, and airflow balancing works in production halls.', 'Plant Zone 3', 'Northline Fabrication', ['/Uploads/1744085193927.png', '/Uploads/1744085840617.png']],
    ['School Building Retrofit', 'Structural strengthening and accessibility upgrades for academic facilities.', 'Education District', 'School Facilities Board', ['/Uploads/showcase2.png', '/Uploads/residential.jpg']],
    ['Homeowner Condo Fit-Out', 'Premium residential interior renovation with kitchen rework, finish approvals, and portal-backed homeowner updates through closeout.', 'South Tower Residences', 'Private Homeowner', ['/Uploads/residential-hero.jpg', '/Uploads/residential.jpg']],
  ];

  return templates.map((t, idx) => {
    const image = pickExistingUploadPath(t[4], getSampleUploadImages()[0] || '/Uploads/industrial.jpg');
    return {
      _id: `prj-sample-${String(idx + 1).padStart(3, '0')}`,
      title: t[0],
      description: t[1],
      location: t[2],
      owner: t[3],
      image,
      date: nowIso(-(idx * 18 + 10)),
      status: idx < 6 ? 'ongoing' : 'completed',
      featured: idx % 3 === 0,
    };
  });
}

function buildSampleFiles(projectIds) {
  const visibilities = ['team', 'client', 'private'];
  const clientFacingTemplates = {
    1: {
      originalName: 'owner-approval-log.xlsx',
      folder: 'Projects/Ongoing/Approvals',
      tags: ['construction', 'ongoing', 'approval', 'owner'],
      notes: 'Owner approval tracker for active design decisions and pending site responses.',
    },
    4: {
      originalName: 'plant-shutdown-coordination-pack.pdf',
      folder: 'Projects/Ongoing/Coordination',
      tags: ['construction', 'ongoing', 'coordination', 'shutdown'],
      notes: 'Coordination pack for shutdown sequencing, access windows, and client-side hold points.',
    },
    7: {
      originalName: 'flood-channel-closeout-checklist.xlsx',
      folder: 'Projects/Completed/Closeout',
      tags: ['construction', 'completed', 'closeout', 'checklist'],
      notes: 'Closeout checklist covering remaining handoff items and final client review steps.',
    },
    10: {
      originalName: 'school-retrofit-progress-photos.pdf',
      folder: 'Projects/Completed/Updates',
      tags: ['construction', 'completed', 'progress', 'photo'],
      notes: 'Compiled visual progress update for final review of retrofit scope and outstanding observations.',
    },
  };

  return projectIds.slice(0, 12).map((pid, idx) => {
    const isResidentialCloseout = idx === 11;
    const clientTemplate = clientFacingTemplates[idx];
    const ext = isResidentialCloseout
      ? 'pdf'
      : clientTemplate
        ? path.extname(clientTemplate.originalName).replace('.', '') || (idx % 2 === 0 ? 'pdf' : 'xlsx')
        : (idx % 2 === 0 ? 'pdf' : 'xlsx');
    const fileName = isResidentialCloseout
      ? 'homeowner-closeout-package.pdf'
      : clientTemplate?.originalName || `project-${idx + 1}-package.${ext}`;
    return {
      _id: `file-sample-${String(idx + 1).padStart(3, '0')}`,
      originalName: fileName,
      storedName: fileName,
      path: `/samples/${fileName}`,
      mimeType: ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 65000 + (idx * 5173),
      ownerId: idx % 3 === 0 ? 'admin-1' : 'user-1',
      visibility: isResidentialCloseout ? 'client' : visibilities[idx % visibilities.length],
      folder: isResidentialCloseout
        ? 'Projects/Completed/Residential'
        : clientTemplate?.folder || (idx < 6 ? 'Projects/Ongoing' : 'Projects/Completed'),
      projectId: String(pid || ''),
      sharedWithUsers: [],
      sharedWithRoles: isResidentialCloseout
        ? ['admin', 'client']
        : (idx % 3 === 1 ? ['admin', 'client'] : ['admin', 'user']),
      linkAccess: isResidentialCloseout ? 'view' : (idx % 3 === 2 ? 'none' : 'view'),
      tags: isResidentialCloseout
        ? ['construction', 'completed', 'residential', 'closeout']
        : clientTemplate?.tags || ['construction', idx < 6 ? 'ongoing' : 'completed'],
      notes: isResidentialCloseout
        ? 'Sample homeowner closeout package for demo use.'
        : clientTemplate?.notes || 'Sample operational document for demo use.',
      cloudProvider: '',
      cloudPublicId: '',
      previewProvider: '',
      previewUrl: '',
      previewMimeType: '',
      previewExpiresAt: null,
      createdAt: nowIso(-(idx + 5)),
      updatedAt: nowIso(-(idx % 4)),
    };
  });
}

function buildSampleFolders() {
  return [
    { _id: 'folder-sample-001', path: 'Projects/Ongoing', ownerId: 'admin-1', createdAt: nowIso(-20) },
    { _id: 'folder-sample-002', path: 'Projects/Completed', ownerId: 'admin-1', createdAt: nowIso(-20) },
    { _id: 'folder-sample-003', path: 'Documents/Permits', ownerId: 'admin-1', createdAt: nowIso(-18) },
    { _id: 'folder-sample-004', path: 'Projects/Completed/Residential', ownerId: 'admin-1', createdAt: nowIso(-12) },
  ];
}

function buildSampleInquiries() {
  const rows = [
    ['Jordan Reyes', 'jordan.reyes@example.com', '+1 555 0142', 'Need a budgetary quote for a warehouse slab and drainage upgrade.', 'new', 'normal', 'estimating-team'],
    ['Casey Morgan', 'casey.morgan@example.com', '+1 555 0199', 'Requesting timeline and method statement for a concrete road widening project.', 'in_progress', 'high', 'project-controls'],
    ['Avery Shaw', 'avery.shaw@example.com', '+1 555 0103', 'Can you provide BOQ support for a plant utility renewal project?', 'new', 'normal', 'estimating-team'],
    ['Riley Cruz', 'riley.cruz@example.com', '+1 555 0190', 'Looking for civil works contractor for substation foundation package.', 'in_progress', 'urgent', 'tender-desk'],
    ['Jamie Park', 'jamie.park@example.com', '+1 555 0185', 'Need inspection and rehabilitation options for an older bridge.', 'resolved', 'high', 'engineering-review'],
    ['Morgan Lee', 'morgan.lee@example.com', '+1 555 0132', 'Please send capability statement for flood control channel works.', 'new', 'low', 'biz-dev'],
    ['Taylor Quinn', 'taylor.quinn@example.com', '+1 555 0158', 'Seeking design-build partner for warehouse fit-out and MEP works.', 'resolved', 'normal', 'project-controls'],
    ['Dakota Miles', 'dakota.miles@example.com', '+1 555 0117', 'Require shortlisting support for municipal drainage project.', 'in_progress', 'high', 'estimating-team'],
  ];
  return rows.map((r, idx) => ({
    _id: `inq-sample-${String(idx + 1).padStart(3, '0')}`,
    name: r[0],
    email: r[1],
    phone: r[2],
    message: r[3],
    source: 'contact_form',
    ipAddress: '0.0.0.0',
    status: r[4],
    priority: r[5],
    assignedTo: r[6],
    notes: 'Sample inquiry only. No real personal data.',
    handledBy: r[4] === 'resolved' ? 'admin' : '',
    handledAt: r[4] === 'resolved' ? nowIso(-(idx % 3 + 1)) : null,
    createdAt: nowIso(-(idx + 3)),
    updatedAt: nowIso(-(idx % 4)),
  }));
}

function buildSampleActivity() {
  const entries = [
    { action: 'data.sanitized', targetType: 'system', targetId: 'sample-1', details: 'Sample data set sanitized for safe demo use.' },
    { action: 'project.seeded', targetType: 'project', targetId: 'prj-sample-012', details: 'Residential closeout sample project seeded for homeowner-facing proof.' },
    { action: 'file.seeded', targetType: 'file', targetId: 'file-sample-012', details: 'Homeowner closeout package seeded with client-visible access.' },
    { action: 'file.permissions_update', targetType: 'file', targetId: 'file-sample-012', details: 'Residential closeout package shared with client role for final handoff review.' },
    { action: 'report.generated', targetType: 'system', targetId: 'sample-5', details: 'Sample report generated for dashboard review.' },
    { action: 'dashboard.refresh', targetType: 'system', targetId: 'sample-6', details: 'Dashboard refresh sample created for demo activity.' },
  ];

  return entries.map((entry, idx) => ({
    _id: `act-sample-${String(idx + 1).padStart(3, '0')}`,
    actorId: 'admin-1',
    actorRole: 'admin',
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details,
    metadata: { source: 'sanitize-demo-data' },
    createdAt: nowIso(-idx),
    updatedAt: nowIso(-idx),
  }));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function sanitizeFallback() {
  const base = path.join(repoRoot, 'backend');
  const projects = buildSampleProjects();
  const projectIds = projects.map((p) => p._id);

  writeJson(path.join(base, 'dev_projects.json'), projects);
  writeJson(path.join(base, 'dev_files.json'), buildSampleFiles(projectIds));
  writeJson(path.join(base, 'dev_folders.json'), buildSampleFolders());
  writeJson(path.join(base, 'dev_inquiries.json'), buildSampleInquiries());
  writeJson(path.join(base, 'dev_activity_logs.json'), buildSampleActivity());

  console.log('Fallback data sanitized and replaced with construction sample data.');
}

async function sanitizeMongo() {
  const mongoose = require('mongoose');
  const Project = require(path.join(repoRoot, 'backend', 'models', 'Projects'));
  const FileItem = require(path.join(repoRoot, 'backend', 'models', 'FileItem'));
  const Inquiry = require(path.join(repoRoot, 'backend', 'models', 'Inquiry'));
  const ActivityLog = require(path.join(repoRoot, 'backend', 'models', 'ActivityLog'));

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Cannot sanitize MongoDB.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
  });

  try {
    await Promise.all([
      Project.deleteMany({}),
      FileItem.deleteMany({}),
      Inquiry.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    const insertedProjects = await Project.insertMany(
      buildSampleProjects().map((p) => ({
        title: p.title,
        description: p.description,
        location: p.location,
        owner: p.owner,
        date: new Date(p.date),
        image: p.image,
        status: p.status,
      }))
    );

    const projectIds = insertedProjects.map((p) => String(p._id));

    await FileItem.insertMany(
      buildSampleFiles(projectIds).map((f) => ({
        originalName: f.originalName,
        storedName: f.storedName,
        path: f.path,
        mimeType: f.mimeType,
        size: f.size,
        ownerId: f.ownerId,
        visibility: f.visibility,
        folder: f.folder,
        projectId: f.projectId,
        sharedWithUsers: f.sharedWithUsers,
        sharedWithRoles: f.sharedWithRoles,
        linkAccess: f.linkAccess,
        tags: f.tags,
        notes: f.notes,
        cloudProvider: '',
        cloudPublicId: '',
        previewProvider: '',
        previewUrl: '',
        previewMimeType: '',
        previewExpiresAt: null,
      }))
    );

    await Inquiry.insertMany(
      buildSampleInquiries().map((i) => ({
        name: i.name,
        email: i.email,
        phone: i.phone,
        message: i.message,
        source: i.source,
        ipAddress: '0.0.0.0',
        status: i.status,
        priority: i.priority,
        assignedTo: i.assignedTo,
        notes: i.notes,
        handledBy: i.handledBy,
        handledAt: i.handledAt ? new Date(i.handledAt) : null,
      }))
    );

    await ActivityLog.insertMany(buildSampleActivity().map((a) => ({
      actorId: a.actorId,
      actorRole: a.actorRole,
      action: a.action,
      targetType: a.targetType,
      targetId: a.targetId,
      details: a.details,
      metadata: a.metadata,
    })));

    console.log('MongoDB sanitized and seeded with sample construction data.');
  } finally {
    await mongoose.disconnect();
  }
}

(async () => {
  try {
    if (mode === 'fallback' || mode === 'both') {
      await sanitizeFallback();
    }
    if (mode === 'mongo' || mode === 'both') {
      await sanitizeMongo();
    }
    console.log(`Done (mode=${mode}).`);
  } catch (err) {
    console.error('Sanitization failed:', err.message || err);
    process.exit(1);
  }
})();
