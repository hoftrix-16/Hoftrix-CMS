/** Default human placeholder path (served from /public). Frontend resolves empty avatars to this. */
const DEFAULT_AVATAR_URL = '/default-avatar.png';

function getDefaultAvatar(_name = 'User') {
  return DEFAULT_AVATAR_URL;
}

module.exports = { getDefaultAvatar, DEFAULT_AVATAR_URL };
