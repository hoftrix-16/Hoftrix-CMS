const { ActivityLog } = require('../models/ERPModels');

/**
 * Helper to record activity log in MongoDB
 * @param {string} userId - User ID who triggered the action
 * @param {string} userName - Name of the user
 * @param {string} action - Brief description of action (e.g. "Invoice Created")
 * @param {string} details - Detailed description of action
 * @param {string} type - Display type ('success', 'info', 'warning', 'danger')
 */
const logActivity = async (userId, userName, action, details, type = 'info') => {
  try {
    const log = new ActivityLog({
      userId: userId || null,
      userName: userName || 'System',
      action,
      details,
      type
    });
    await log.save();
    console.log(`📝 Activity Logged: [${action}] by ${userName || 'System'}`);
  } catch (error) {
    console.error('🔥 Error creating activity log:', error.message);
  }
};

module.exports = { logActivity };
