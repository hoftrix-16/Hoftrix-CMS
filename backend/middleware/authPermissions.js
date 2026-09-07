function hasAnyPermission(user, permissions) {
  if (user.role === 'admin') return true;
  const userPermissions = user.permissions || [];
  return permissions.some((permission) => userPermissions.includes(permission));
}

function requireAuthPermission(...permissions) {
  return (req, res, next) => {
    if (hasAnyPermission(req.user, permissions)) return next();
    return res.status(403).json({ message: 'Insufficient permissions for this action' });
  };
}

function blockClientRole(req, res, next) {
  if (req.user.role === 'client') {
    return res.status(403).json({ message: 'Clients cannot access admin API resources' });
  }
  next();
}

module.exports = { requireAuthPermission, blockClientRole, hasAnyPermission };
