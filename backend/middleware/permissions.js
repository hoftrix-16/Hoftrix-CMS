const User = require('../models/User');

const ERP_RULES = [
  { pattern: /^\/dashboard/, permissions: ['dashboards', 'dashboard-analytics'], methods: ['GET'] },
  { pattern: /^\/projects/, permissions: ['mgmt-projects'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/project-tasks/, permissions: ['mgmt-projects', 'mgmt-project-tasks'], methods: ['GET'] },
  { pattern: /^\/invoices/, permissions: ['mgmt-invoices'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/company-settings/, permissions: ['mgmt-invoices'], methods: ['GET', 'POST', 'PUT'] },
  { pattern: /^\/services/, permissions: ['mgmt-services'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/finance/, permissions: ['mgmt-balance-sheet', 'mgmt-payments', 'mgmt-expenses'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/calendar-events/, permissions: ['mgmt-calendar'], methods: ['GET'] },
  { pattern: /^\/holidays/, permissions: ['mgmt-calendar'], methods: ['GET'] },
  { pattern: /^\/holidays/, permissions: ['mgmt-calendar'], methods: ['POST', 'DELETE'] },
  { pattern: /^\/leads/, permissions: ['mgmt-kanban', 'mgmt-deals'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/clients/, permissions: ['mgmt-clients', 'mgmt-clients-list', 'mgmt-add-client'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/follow-ups/, permissions: ['mgmt-followups', 'mgmt-clients'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/proposals/, permissions: ['mgmt-proposals', 'mgmt-services'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/contracts/, permissions: ['mgmt-contracts', 'mgmt-services'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { pattern: /^\/activity-logs/, permissions: ['mgmt-activity-logs'], methods: ['GET'] },
  { pattern: /^\/employees$/, permissions: ['mgmt-employees', 'mgmt-employees-list'], methods: ['GET'] },
  { pattern: /^\/employees$/, permissions: ['mgmt-add-employee', 'mgmt-employees'], methods: ['POST'] },
  { pattern: /^\/employees\/[^/]+$/, permissions: ['mgmt-employees', 'mgmt-employees-list'], methods: ['PUT', 'DELETE'] },
];

function isSelfEmployeeRoute(req) {
  const emailMatch = req.path.match(/^\/employees\/email\/(.+)$/);
  if (emailMatch && decodeURIComponent(emailMatch[1]).toLowerCase() === req.user.email?.toLowerCase()) {
    return true;
  }

  if (req.user.role !== 'employee') return false;

  if (req.path.match(/^\/employees\/[^/]+\/clock-(in|out)/)) return true;
  if (req.path.match(/^\/employees\/[^/]+\/time-logs/) && req.method === 'POST') return true;
  if (req.path === '/employees/me/leaves' && req.method === 'POST') return true;
  if (req.path.match(/^\/employees\/[^/]+$/) && req.method === 'PUT') return true;

  return false;
}

function hasAnyPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

function erpAccessControl(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'client') {
    return res.status(403).json({ message: 'Clients cannot access ERP resources' });
  }

  if (
    req.method === 'GET' &&
    (req.path === '/calendar-events' || req.path === '/holidays')
  ) {
    return next();
  }

  if (isSelfEmployeeRoute(req)) return next();

  const matchedRule = ERP_RULES.find(
    (rule) => rule.pattern.test(req.path) && rule.methods.includes(req.method)
  );

  if (!matchedRule) {
    return res.status(403).json({ message: 'Access denied for this ERP action' });
  }

  const userPermissions = req.user.permissions || [];
  if (!hasAnyPermission(userPermissions, matchedRule.permissions)) {
    return res.status(403).json({ message: 'Insufficient permissions for this action' });
  }

  next();
}

async function attachUserFromToken(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User account not found' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      permissions: user.permissions || [],
    };
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { erpAccessControl, attachUserFromToken };
