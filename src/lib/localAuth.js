/**
 * localAuth.js
 * Offline-capable user authentication using localStorage and the Web Crypto API.
 * Passwords are salted and hashed with SHA-256 via crypto.subtle.
 */

const USERS_KEY = 'dr_monster_users';
const SESSION_KEY = 'dr_monster_session';

function generateId() {
  return crypto.randomUUID();
}

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Returns the current logged-in user object, or null if not logged in. */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Register a new account.
 * Throws if the email is already taken.
 * Returns the session user object on success.
 */
export async function register(email, password, username) {
  if (!email || !password || !username) {
    throw new Error('All fields are required');
  }

  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
    throw new Error('An account with this email already exists');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser = {
    id: generateId(),
    email: email.toLowerCase().trim(),
    username: username.trim(),
    passwordHash,
    salt,
    created_date: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);

  const sessionUser = {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    created_date: newUser.created_date,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/**
 * Log in with email and password.
 * Throws if credentials are invalid.
 * Returns the session user object on success.
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    created_date: user.created_date,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/** Log out the current user. */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Update the current user's profile fields (e.g. username).
 * Returns the updated session user object.
 */
export function updateUser(data) {
  const session = getCurrentUser();
  if (!session) throw new Error('Not logged in');

  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx === -1) throw new Error('User not found');

  if (data.username !== undefined) users[idx].username = data.username.trim();
  saveUsers(users);

  const updated = { ...session, ...data };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Permanently delete the given user account and log out.
 */
export function deleteUser(id) {
  saveUsers(getUsers().filter(u => u.id !== id));
  localStorage.removeItem(SESSION_KEY);
}
