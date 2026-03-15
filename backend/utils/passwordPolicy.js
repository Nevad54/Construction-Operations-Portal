const PASSWORD_POLICY = {
  minLength: 8,
  requiresLetter: true,
  requiresNumber: true,
};

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include at least one letter and one number';

const isPasswordStrong = (value) => {
  const password = String(value || '');
  if (password.length < PASSWORD_POLICY.minLength) return false;
  if (PASSWORD_POLICY.requiresLetter && !/[A-Za-z]/.test(password)) return false;
  if (PASSWORD_POLICY.requiresNumber && !/\d/.test(password)) return false;
  return true;
};

module.exports = {
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
  isPasswordStrong,
};
