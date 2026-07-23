function getDefaultEmployeePassword() {
  const configured = process.env.DEFAULT_EMPLOYEE_PASSWORD;
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEFAULT_EMPLOYEE_PASSWORD must be set in production');
  }

  console.warn('⚠️  DEFAULT_EMPLOYEE_PASSWORD not set — using dev fallback. Set it in backend/.env');
  return 'ChangeMeInEnv1!';
}

module.exports = { getDefaultEmployeePassword };
