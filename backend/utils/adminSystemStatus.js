function buildAdminSystemStatusAlerts({
  usingFallback,
  emailConfigured,
  frontendUrlConfigured,
  isProduction,
  adminCount,
  demoSeedEnabled,
  setupTokenConfigured,
}) {
  const alerts = [];

  if (usingFallback) {
    alerts.push({
      severity: 'warning',
      code: 'fallback_mode',
      message: 'Database fallback storage is active. Admin changes are not using the primary MongoDB connection.',
    });
  }

  if (!emailConfigured) {
    alerts.push({
      severity: 'warning',
      code: 'email_missing',
      message: 'Email delivery is not configured. Forgot-password will only log reset links locally.',
    });
  }

  if (!frontendUrlConfigured) {
    alerts.push({
      severity: 'warning',
      code: 'frontend_url_missing',
      message: 'FRONTEND_URL is missing, so password reset links may point to the wrong host.',
    });
  }

  if (isProduction && adminCount === 0) {
    alerts.push({
      severity: 'error',
      code: 'admin_setup_required',
      message: 'No admin account exists in production. Complete first-run admin setup before handing off the app.',
    });
  }

  if (isProduction && adminCount > 0 && setupTokenConfigured) {
    alerts.push({
      severity: 'warning',
      code: 'bootstrap_token_still_configured',
      message: 'FIRST_ADMIN_SETUP_TOKEN is still configured after setup completed. Remove or rotate it so bootstrap access cannot be reused.',
    });
  }

  if (demoSeedEnabled) {
    alerts.push({
      severity: 'info',
      code: 'demo_seed_enabled',
      message: 'Demo seed accounts are enabled in this environment for local testing only.',
    });
  }

  return alerts;
}

module.exports = {
  buildAdminSystemStatusAlerts,
};
