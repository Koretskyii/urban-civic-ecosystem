export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INVALID_PASSWORD: 'Invalid password',
  USER_EXISTS: 'User with this email already exists',
  OAUTH_LOGIN_REQUIRED:
    'This account uses Google authentication. Please log in with Google.',
  LOCAL_LOGIN_REQUIRED:
    'This email is linked to a Google account. Please log in with Google.',
  OAUTH_USER_AUTH_FAILED: 'Unable to authenticate OAuth user',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  GOOGLE_NO_EMAIL: 'Google account has no email',
} as const;
