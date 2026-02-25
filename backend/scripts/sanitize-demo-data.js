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

function buildSampleProjects() {
  return [
    {
      _id: 'prj-sample-001',
      title: 'Bridge Retrofit Program',
      description: 'Retrofit works for aging bridge components, including deck strengthening and railing upgrades.',
      location: 'North District',
      owner: 'City Infrastructure Office',
      image: '/uploads/sample-bridge.jpg',
      date: new Date('2026-01-15T00:00:00.000Z').toISOString(),
      status: 'ongoing',
      featured: true,
    },
    {
      _id: 'prj-sample-002',
      title: 'Warehouse Expansion Phase 1',
      description: 'Design-build expansion with structural steel, slab extension, and stormwater improvements.',
      location: 'Logistics Park',
      owner: 'LogiBuild Partners',
      image: '/uploads/sample-warehouse.jpg',
      date: new Date('2025-11-20T00:00:00.000Z').toISOString(),
      status: 'ongoing',
      featured: false,
    },
    {
      _id: 'prj-sample-003',
      title: 'Municipal Road Improvement',
      description: 'Road widening, concrete paving, drainage channels, and traffic safety markings.',
      location: 'West Access Road',
      owner: 'Municipal Engineering Office',
      image: '/uploads/sample-road.jpg',
      date: new Date('2025-08-05T00:00:00.000Z').toISOString(),
      status: 'completed',
      featured: true,
    },
  ];
}

function buildSampleFiles(projectIds) {
  const [p1, p2, p3] = projectIds;
  return [
    {
      _id: 'file-sample-001',
      originalName: 'bridge-inspection-summary.pdf',
      storedName: 'bridge-inspection-summary.pdf',
      path: '/samples/bridge-inspection-summary.pdf',
      mimeType: 'application/pdf',
      size: 142321,
      ownerId: 'admin-1',
      visibility: 'team',
      folder: 'Projects/Ongoing',
      projectId: String(p1 || ''),
      sharedWithUsers: [],
      sharedWithRoles: ['admin', 'user'],
      linkAccess: 'view',
      tags: ['bridge', 'inspection'],
      notes: 'Sample redacted document for demo use.',
      cloudProvider: '',
      cloudPublicId: '',
      previewProvider: '',
      previewUrl: '',
      previewMimeType: '',
      previewExpiresAt: null,
      createdAt: nowIso(-10),
      updatedAt: nowIso(-2),
    },
    {
      _id: 'file-sample-002',
      originalName: 'warehouse-safety-plan.pdf',
      storedName: 'warehouse-safety-plan.pdf',
      path: '/samples/warehouse-safety-plan.pdf',
      mimeType: 'application/pdf',
      size: 98111,
      ownerId: 'admin-1',
      visibility: 'client',
      folder: 'Projects/Ongoing',
      projectId: String(p2 || ''),
      sharedWithUsers: [],
      sharedWithRoles: ['admin', 'client'],
      linkAccess: 'view',
      tags: ['safety', 'warehouse'],
      notes: 'Sample safety plan for client sharing.',
      cloudProvider: '',
      cloudPublicId: '',
      previewProvider: '',
      previewUrl: '',
      previewMimeType: '',
      previewExpiresAt: null,
      createdAt: nowIso(-9),
      updatedAt: nowIso(-1),
    },
    {
      _id: 'file-sample-003',
      originalName: 'road-qa-checklist.xlsx',
      storedName: 'road-qa-checklist.xlsx',
      path: '/samples/road-qa-checklist.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 54210,
      ownerId: 'user-1',
      visibility: 'private',
      folder: 'Projects/Completed',
      projectId: String(p3 || ''),
      sharedWithUsers: [],
      sharedWithRoles: [],
      linkAccess: 'none',
      tags: ['qa', 'road'],
      notes: 'Internal QA checklist sample.',
      cloudProvider: '',
      cloudPublicId: '',
      previewProvider: '',
      previewUrl: '',
      previewMimeType: '',
      previewExpiresAt: null,
      createdAt: nowIso(-15),
      updatedAt: nowIso(-5),
    },
  ];
}

function buildSampleFolders() {
  return [
    { _id: 'folder-sample-001', path: 'Projects/Ongoing', ownerId: 'admin-1', createdAt: nowIso(-20) },
    { _id: 'folder-sample-002', path: 'Projects/Completed', ownerId: 'admin-1', createdAt: nowIso(-20) },
    { _id: 'folder-sample-003', path: 'Documents/Permits', ownerId: 'admin-1', createdAt: nowIso(-18) },
  ];
}

function buildSampleInquiries() {
  return [
    {
      _id: 'inq-sample-001',
      name: 'Jordan Reyes',
      email: 'jordan.reyes@example.com',
      phone: '+1 555 0142',
      message: 'Need a budgetary quote for a warehouse slab and drainage upgrade.',
      source: 'contact_form',
      ipAddress: '0.0.0.0',
      status: 'new',
      priority: 'normal',
      assignedTo: 'estimating-team',
      notes: 'Sample inquiry only. No real personal data.',
      handledBy: '',
      handledAt: null,
      createdAt: nowIso(-3),
      updatedAt: nowIso(-3),
    },
    {
      _id: 'inq-sample-002',
      name: 'Casey Morgan',
      email: 'casey.morgan@example.com',
      phone: '+1 555 0199',
      message: 'Requesting timeline and method statement for a concrete road widening project.',
      source: 'contact_form',
      ipAddress: '0.0.0.0',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'project-controls',
      notes: 'Sent sample response draft.',
      handledBy: 'admin',
      handledAt: nowIso(-1),
      createdAt: nowIso(-8),
      updatedAt: nowIso(-1),
    },
  ];
}

function buildSampleActivity() {
  return [
    {
      _id: 'act-sample-001',
      actorId: 'admin-1',
      actorRole: 'admin',
      action: 'data.sanitized',
      targetType: 'system',
      targetId: 'sample-seed',
      details: 'Demo data refreshed and asset references removed.',
      metadata: { source: 'sanitize-demo-data' },
      createdAt: nowIso(0),
      updatedAt: nowIso(0),
    },
  ];
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
