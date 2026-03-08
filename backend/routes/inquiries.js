function registerInquiryRoutes(app, deps) {
  const {
    Inquiry,
    fallbackInquiries,
    useFallback,
    mongoose,
    requireAuth,
    requireRoles,
    normalizeInquiryStatus,
    normalizeInquiryPriority,
    normalizeInquiryOwner,
    normalizeFollowUpAt,
    isClosedInquiryStatus,
    sanitizeInquiry,
    persistFallbackInquiries,
    logActivity,
  } = deps;

  app.get('/api/admin/inquiries', requireAuth, requireRoles(['admin']), async (req, res) => {
    try {
      const statusFilter = String(req.query.status || '').trim().toLowerCase();
      const q = String(req.query.q || '').trim().toLowerCase();
      const limitRaw = Number(req.query.limit);
      const skipRaw = Number(req.query.skip);
      const usePaging = Number.isFinite(limitRaw) && limitRaw > 0;
      const limit = usePaging ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 0;
      const skip = usePaging && Number.isFinite(skipRaw) && skipRaw > 0 ? Math.floor(skipRaw) : 0;

      if (useFallback || mongoose.connection.readyState !== 1) {
        let list = [...fallbackInquiries];
        if (statusFilter && statusFilter !== 'all') {
          list = list.filter((item) => normalizeInquiryStatus(item.status) === statusFilter);
        }
        if (q) {
          list = list.filter((item) => {
            const haystack = [item.name, item.email, item.phone, item.message, item.notes]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return haystack.includes(q);
          });
        }
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        const sanitized = list.map((item) => sanitizeInquiry(item));
        if (!usePaging) return res.json(sanitized);
        const items = sanitized.slice(skip, skip + limit);
        return res.json({
          items,
          total: sanitized.length,
          skip,
          limit,
          hasMore: skip + items.length < sanitized.length,
        });
      }

      const query = {};
      if (statusFilter && statusFilter !== 'all') {
        query.status = statusFilter;
      }
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { message: { $regex: q, $options: 'i' } },
          { notes: { $regex: q, $options: 'i' } },
        ];
      }
      if (!usePaging) {
        const list = await Inquiry.find(query).sort({ createdAt: -1 }).lean();
        return res.json(list.map((item) => sanitizeInquiry(item)));
      }
      const [list, total] = await Promise.all([
        Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Inquiry.countDocuments(query),
      ]);
      return res.json({
        items: list.map((item) => sanitizeInquiry(item)),
        total,
        skip,
        limit,
        hasMore: skip + list.length < total,
      });
    } catch (err) {
      console.error('List inquiries failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/admin/inquiries/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Inquiry id required' });

    const status = normalizeInquiryStatus(req.body.status);
    const owner = normalizeInquiryOwner(req.body.owner !== undefined ? req.body.owner : req.body.assignedTo);
    const nextFollowUpAt = normalizeFollowUpAt(req.body.nextFollowUpAt);

    if (req.body.status === undefined) {
      return res.status(400).json({ error: 'Status is required' });
    }
    if (!owner) {
      return res.status(400).json({ error: 'Owner is required' });
    }
    if (!isClosedInquiryStatus(status) && !nextFollowUpAt) {
      return res.status(400).json({ error: 'Next follow-up date is required for active inquiries' });
    }

    const updates = {};
    updates.status = status;
    updates.owner = owner;
    updates.assignedTo = owner;
    updates.nextFollowUpAt = isClosedInquiryStatus(status) ? null : nextFollowUpAt;
    if (updates.status !== 'new') {
      updates.handledBy = String(req.authUser.username || req.authUser.id || '');
      updates.handledAt = new Date();
    } else {
      updates.handledBy = '';
      updates.handledAt = null;
    }
    if (req.body.notes !== undefined) {
      updates.notes = String(req.body.notes || '').trim();
    }
    if (req.body.priority !== undefined) {
      updates.priority = normalizeInquiryPriority(req.body.priority);
    }

    try {
      if (useFallback || mongoose.connection.readyState !== 1) {
        const idx = fallbackInquiries.findIndex((item) => String(item._id) === id);
        if (idx === -1) return res.status(404).json({ error: 'Inquiry not found' });
        fallbackInquiries[idx] = {
          ...fallbackInquiries[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistFallbackInquiries();
        await logActivity(req, {
          action: 'inquiry.update',
          targetType: 'inquiry',
          targetId: id,
          details: `Updated inquiry from ${fallbackInquiries[idx].name}`,
          metadata: updates,
        });
        return res.json({ inquiry: sanitizeInquiry(fallbackInquiries[idx]) });
      }

      const updated = await Inquiry.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ error: 'Inquiry not found' });
      await logActivity(req, {
        action: 'inquiry.update',
        targetType: 'inquiry',
        targetId: String(updated._id),
        details: `Updated inquiry from ${updated.name}`,
        metadata: updates,
      });
      return res.json({ inquiry: sanitizeInquiry(updated.toObject ? updated.toObject() : updated) });
    } catch (err) {
      console.error('Update inquiry failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/admin/inquiries/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Inquiry id required' });
    try {
      if (useFallback || mongoose.connection.readyState !== 1) {
        const idx = fallbackInquiries.findIndex((item) => String(item._id) === id);
        if (idx === -1) return res.status(404).json({ error: 'Inquiry not found' });
        const [removed] = fallbackInquiries.splice(idx, 1);
        persistFallbackInquiries();
        await logActivity(req, {
          action: 'inquiry.delete',
          targetType: 'inquiry',
          targetId: id,
          details: `Deleted inquiry from ${removed?.name || 'unknown'}`,
        });
        return res.json({ ok: true });
      }

      const deleted = await Inquiry.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ error: 'Inquiry not found' });
      await logActivity(req, {
        action: 'inquiry.delete',
        targetType: 'inquiry',
        targetId: id,
        details: `Deleted inquiry from ${deleted?.name || 'unknown'}`,
      });
      return res.json({ ok: true });
    } catch (err) {
      console.error('Delete inquiry failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });
}

module.exports = {
  registerInquiryRoutes,
};
