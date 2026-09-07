const { Employee } = require('../models/ERPModels');

async function findEmployeeByUserEmail(email) {
  if (!email) return null;
  return Employee.findOne({ email: email.toLowerCase() });
}

function isSameEmployee(employee, user) {
  if (!employee || !user?.email) return false;
  return employee.email.toLowerCase() === user.email.toLowerCase();
}

function assertEmployeeOwnerOrAdmin(req, res, employee) {
  if (req.user.role === 'admin') return true;
  if (isSameEmployee(employee, req.user)) return true;
  res.status(403).json({ message: 'You can only access your own employee record' });
  return false;
}

module.exports = { findEmployeeByUserEmail, isSameEmployee, assertEmployeeOwnerOrAdmin };
