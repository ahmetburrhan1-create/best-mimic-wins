import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class AuthService {
  constructor() {
    this.users = new Map(); // id -> user object
    this.usernameIndex = new Map(); // lowercase username -> id
    this.tokens = new Map(); // token -> { userId, expiresAt }
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.users && typeof data.users === 'object') {
          for (const [id, user] of Object.entries(data.users)) {
            this.users.set(id, user);
            if (user.username) {
              this.usernameIndex.set(user.username.toLowerCase(), id);
            }
          }
        }
        if (data.tokens && typeof data.tokens === 'object') {
          const now = Date.now();
          for (const [token, info] of Object.entries(data.tokens)) {
            if (info.expiresAt > now) {
              this.tokens.set(token, info);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading users.json:', err);
    }
  }

  saveData() {
    try {
      const usersObj = {};
      for (const [id, user] of this.users.entries()) {
        usersObj[id] = user;
      }
      const tokensObj = {};
      const now = Date.now();
      for (const [token, info] of this.tokens.entries()) {
        if (info.expiresAt > now) {
          tokensObj[token] = info;
        }
      }
      const tmpFile = `${USERS_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify({ users: usersObj, tokens: tokensObj }, null, 2), 'utf-8');
      fs.renameSync(tmpFile, USERS_FILE);
    } catch (err) {
      console.error('Error saving users.json:', err);
    }
  }

  hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  calculateLevel(totalScore = 0) {
    if (totalScore >= 5000) return { level: 5, title: '👑 Oscar Adayı', nextLevelScore: 10000 };
    if (totalScore >= 2500) return { level: 4, title: '⭐ Yeşilçam Efsanesi', nextLevelScore: 5000 };
    if (totalScore >= 1200) return { level: 3, title: '🎙️ Usta Dublör', nextLevelScore: 2500 };
    if (totalScore >= 500) return { level: 2, title: '🎭 Mahalle Raconcusu', nextLevelScore: 1200 };
    return { level: 1, title: '🌱 Acemi Taklitçi', nextLevelScore: 500 };
  }

  getPublicUser(user) {
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    const levelInfo = this.calculateLevel(user.stats?.totalScore || 0);
    return {
      ...safeUser,
      stats: {
        ...safeUser.stats,
        ...levelInfo
      }
    };
  }

  register({ username, password, displayName, avatar = '🎭' }) {
    if (!username || typeof username !== 'string') {
      return { success: false, error: 'Kullanıcı adı gereklidir.' };
    }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return { success: false, error: 'Kullanıcı adı 3-20 karakter arasında olmalıdır.' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return { success: false, error: 'Kullanıcı adı yalnızca harf, rakam, alt çizgi ve tire içerebilir.' };
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return { success: false, error: 'Şifre en az 4 karakter olmalıdır.' };
    }
    if (this.usernameIndex.has(cleanUsername)) {
      return { success: false, error: 'Bu kullanıcı adı zaten alınmış.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const id = `u_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const newUser = {
      id,
      username: cleanUsername,
      displayName: (displayName && displayName.trim()) || username.trim(),
      avatar: avatar || '🎭',
      passwordHash,
      salt,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0
      },
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };

    this.users.set(id, newUser);
    this.usernameIndex.set(cleanUsername, id);

    // Generate token (valid for 30 days)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    this.tokens.set(token, { userId: id, expiresAt });

    this.saveData();

    return {
      success: true,
      token,
      user: this.getPublicUser(newUser)
    };
  }

  login({ username, password }) {
    if (!username || !password) {
      return { success: false, error: 'Kullanıcı adı ve şifre gereklidir.' };
    }
    const cleanUsername = username.trim().toLowerCase();
    const userId = this.usernameIndex.get(cleanUsername);
    if (!userId) {
      return { success: false, error: 'Kullanıcı bulunamadı veya şifre yanlış.' };
    }
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'Kullanıcı bulunamadı.' };
    }

    const testHash = this.hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      return { success: false, error: 'Kullanıcı bulunamadı veya şifre yanlış.' };
    }

    user.lastLoginAt = Date.now();

    // Generate fresh token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    this.tokens.set(token, { userId, expiresAt });

    this.saveData();

    return {
      success: true,
      token,
      user: this.getPublicUser(user)
    };
  }

  getUserByToken(token) {
    if (!token) return null;
    const info = this.tokens.get(token);
    if (!info) return null;
    if (info.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return null;
    }
    const user = this.users.get(info.userId);
    return this.getPublicUser(user);
  }

  getUserById(userId) {
    if (!userId) return null;
    const user = this.users.get(userId);
    return this.getPublicUser(user);
  }

  updateProfile(userId, { displayName, avatar }) {
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

    if (displayName && typeof displayName === 'string') {
      user.displayName = displayName.trim().slice(0, 24);
    }
    if (avatar && typeof avatar === 'string') {
      user.avatar = avatar;
    }

    this.saveData();
    return { success: true, user: this.getPublicUser(user) };
  }

  recordGameResult(userId, { won = false, score = 0 }) {
    const user = this.users.get(userId);
    if (!user) return null;

    if (!user.stats) {
      user.stats = { gamesPlayed: 0, gamesWon: 0, totalScore: 0 };
    }

    user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + 1;
    if (won) {
      user.stats.gamesWon = (user.stats.gamesWon || 0) + 1;
    }
    user.stats.totalScore = Math.max(0, (user.stats.totalScore || 0) + Math.max(0, Math.round(score)));

    this.saveData();
    return this.getPublicUser(user);
  }

  logout(token) {
    if (token && this.tokens.has(token)) {
      this.tokens.delete(token);
      this.saveData();
    }
    return { success: true };
  }
}

export const authService = new AuthService();
export default authService;
