import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'data', 'users_db.json');

export function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) || [];
  } catch (e) {
    return [];
  }
}
export function writeUsers(users) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('users_db write error', e);
  }
}
export function findUserByEmail(email) {
  const users = readUsers();
  return users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
}
export function findUserById(id) {
  const users = readUsers();
  return users.find(u => String(u.id) === String(id));
}
export function addUser(user) {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
}
export function upsertUser(user) {
  const users = readUsers();
  const idx = users.findIndex(u => String(u.id) === String(user.id));
  if (idx >= 0) users[idx] = { ...users[idx], ...user }; else users.push(user);
  writeUsers(users);
}

export default { readUsers, writeUsers, findUserByEmail, findUserById, addUser, upsertUser };