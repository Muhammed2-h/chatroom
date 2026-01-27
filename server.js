require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const USER_TIMEOUT = 15000;
const MAX_MESSAGES = 50;

// Health check endpoint (must be first)
app.get('/up', (_, res) => res.send('OK'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Helpers
const sanitize = text => sanitizeHtml(text, { allowedTags: [] });
const isSuperAdmin = email => ADMIN_EMAIL && email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

// --- In-Memory Store ---
class MemoryStore {
    constructor() {
        this.rooms = { world: { passkey: null, messages: [], users: {}, bans: new Set() } };
        this.accounts = {}; // email -> { password, displayName, createdAt }
        this.sessions = {}; // authToken -> { email, displayName, expiresAt }
    }

    async init() { console.log('💾 Storage: In-Memory'); }

    // Auth methods
    async createAccount(email, hashedPassword, displayName) {
        if (this.accounts[email]) return null;
        this.accounts[email] = {
            password: hashedPassword,
            displayName,
            createdAt: Date.now(),
            bio: '',
            avatar: '',
            status: 'online'
        };
        return { email, displayName };
    }

    async updateProfile(email, { bio, avatar, status, displayName }) {
        const account = this.accounts[email];
        if (!account) return null;

        if (bio !== undefined) account.bio = bio;
        if (avatar !== undefined) account.avatar = avatar;
        if (status !== undefined) account.status = status;

        if (displayName !== undefined) {
            account.displayName = displayName;
            // Update active sessions
            for (const t in this.sessions) {
                if (this.sessions[t].email === email) this.sessions[t].displayName = displayName;
            }
        }

        // Update profile in all active rooms
        for (const roomId in this.rooms) {
            const roomUsers = this.rooms[roomId].users;
            for (const userName in roomUsers) {
                if (roomUsers[userName].email === email || userName === account.displayName) {
                    if (bio !== undefined) roomUsers[userName].bio = bio;
                    if (avatar !== undefined) roomUsers[userName].avatar = avatar;
                    if (status !== undefined) roomUsers[userName].status = status;
                }
            }
        }
        return account;
    }

    async getAccount(email) {
        return this.accounts[email] || null;
    }

    async createSession(email, displayName) {
        const token = crypto.randomUUID();
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        this.sessions[token] = { email, displayName, expiresAt };
        return token;
    }

    async getSession(token) {
        const session = this.sessions[token];
        if (!session) return null;
        if (session.expiresAt < Date.now()) {
            delete this.sessions[token];
            return null;
        }
        return session;
    }

    async deleteSession(token) {
        delete this.sessions[token];
    }

    // Room methods
    async getRoom(id) { return this.rooms[id] || null; }

    async createRoom(id, passkey, description = '') {
        this.rooms[id] = { passkey, description, messages: [], users: {}, bans: new Set(), typing: {}, pinnedMessage: null };
    }

    async updateRoom(id, description) {
        if (this.rooms[id]) this.rooms[id].description = description;
    }

    async getRoomDescription(id) { return this.rooms[id]?.description || ''; }

    async getMessages(id) { return this.rooms[id]?.messages || []; }

    async addMessage(id, msg) {
        const room = this.rooms[id];
        if (!room) return;
        msg.reactions = {};
        msg.readBy = [msg.name];
        room.messages.push(msg);
        if (room.messages.length > MAX_MESSAGES) room.messages = room.messages.slice(-MAX_MESSAGES);
    }

    // Typing
    async setTyping(id, username, isTyping) {
        const room = this.rooms[id];
        if (!room) return;
        if (isTyping) {
            room.typing[username] = Date.now();
        } else {
            delete room.typing[username];
        }
    }

    async getTyping(id) {
        const room = this.rooms[id];
        if (!room) return [];
        const now = Date.now();
        // Clean up stale typing (older than 3 seconds)
        room.typing = Object.fromEntries(
            Object.entries(room.typing).filter(([_, time]) => now - time < 3000)
        );
        return Object.keys(room.typing);
    }

    // Reactions
    async addReaction(id, messageId, emoji, username) {
        const room = this.rooms[id];
        if (!room) return;
        const msg = room.messages.find(m => m.id == messageId);
        if (!msg) return;
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
        const idx = msg.reactions[emoji].indexOf(username);
        if (idx === -1) {
            msg.reactions[emoji].push(username);
        } else {
            msg.reactions[emoji].splice(idx, 1);
            if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        }
    }

    // Read receipts
    async markRead(id, username, lastRead) {
        const room = this.rooms[id];
        if (!room) return;
        room.messages.forEach(msg => {
            if (msg.id <= lastRead && msg.name !== username) {
                if (!msg.readBy) msg.readBy = [msg.name];
                if (!msg.readBy.includes(username)) msg.readBy.push(username);
            }
        });
    }

    // Pinned messages
    async pinMessage(id, messageId) {
        const room = this.rooms[id];
        if (!room) return;
        room.pinnedMessage = room.messages.find(m => m.id == messageId) || null;
    }

    async unpinMessage(id) {
        if (this.rooms[id]) this.rooms[id].pinnedMessage = null;
    }

    async getPinnedMessage(id) {
        return this.rooms[id]?.pinnedMessage || null;
    }

    async clearMessages(id) { if (this.rooms[id]) this.rooms[id].messages = []; }

    async getUsers(id) {
        const room = this.rooms[id];
        if (!room) return [];
        const now = Date.now();
        room.users = Object.fromEntries(Object.entries(room.users).filter(([_, d]) => now - d.lastSeen < USER_TIMEOUT));
        return Object.entries(room.users).map(([name, data]) => ({
            name,
            avatar: data.avatar || '',
            status: data.status || 'online',
            bio: data.bio || ''
        }));
    }

    async touchUser(id, name, token) {
        const room = this.rooms[id];
        if (!room?.users[name] || room.users[name].token !== token) return false;
        room.users[name].lastSeen = Date.now();
        return true;
    }

    async setUser(id, name, token, isAdmin = false, profile = {}) {
        if (this.rooms[id]) {
            this.rooms[id].users[name] = {
                token,
                lastSeen: Date.now(),
                isAdmin,
                email: profile.email || null,
                avatar: profile.avatar || '',
                status: profile.status || 'online',
                bio: profile.bio || ''
            };
        }
    }

    async isAdmin(id, name) { return !!this.rooms[id]?.users[name]?.isAdmin; }

    async checkUsername(id, name) {
        const user = this.rooms[id]?.users[name];
        return !user || (Date.now() - user.lastSeen >= USER_TIMEOUT);
    }

    async verifyToken(id, name, token) { return this.rooms[id]?.users[name]?.token === token; }

    async isBanned(id, name) { return this.rooms[id]?.bans?.has(name) || false; }
}

// --- PostgreSQL Store ---
class PostgresStore {
    constructor(url) {
        this.pool = new Pool({
            connectionString: url,
            ssl: { rejectUnauthorized: false },
            max: 20,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000
        });
        this.pool.on('error', err => console.error('DB Pool Error:', err.message));
    }

    async init() {
        console.log('🐘 Storage: PostgreSQL');
        for (let i = 5; i > 0; i--) {
            try {
                const client = await this.pool.connect();
                try {
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, passkey TEXT, description TEXT DEFAULT '');
                        CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, room_id TEXT REFERENCES rooms(id), name TEXT, content TEXT, created_at BIGINT);
                        CREATE TABLE IF NOT EXISTS room_users (
                            room_id TEXT REFERENCES rooms(id), 
                            name TEXT, 
                            last_seen BIGINT, 
                            session_token TEXT,
                            is_admin BOOLEAN DEFAULT FALSE,
                            avatar TEXT DEFAULT '',
                            status TEXT DEFAULT 'online',
                            bio TEXT DEFAULT '',
                            email TEXT,
                            PRIMARY KEY (room_id, name)
                        );
                        CREATE TABLE IF NOT EXISTS bans (room_id TEXT REFERENCES rooms(id), name TEXT, PRIMARY KEY (room_id, name));
                        CREATE TABLE IF NOT EXISTS accounts (
                            email TEXT PRIMARY KEY, 
                            password TEXT NOT NULL, 
                            display_name TEXT NOT NULL, 
                            created_at BIGINT,
                            avatar TEXT DEFAULT '',
                            status TEXT DEFAULT 'online',
                            bio TEXT DEFAULT ''
                        );
                        CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT REFERENCES accounts(email), display_name TEXT, expires_at BIGINT);
                        INSERT INTO rooms (id, passkey) VALUES ('world', NULL) ON CONFLICT DO NOTHING;
                        CREATE INDEX IF NOT EXISTS idx_msg_room ON messages(room_id);
                        CREATE INDEX IF NOT EXISTS idx_users_room ON room_users(room_id);
                        CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
                    `);
                    await client.query(`
                        DO $$ BEGIN
                            -- rooms
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='description') THEN
                                ALTER TABLE rooms ADD COLUMN description TEXT DEFAULT '';
                            END IF;
                            -- room_users
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='session_token') THEN
                                ALTER TABLE room_users ADD COLUMN session_token TEXT;
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='is_admin') THEN
                                ALTER TABLE room_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='avatar') THEN
                                ALTER TABLE room_users ADD COLUMN avatar TEXT DEFAULT '';
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='status') THEN
                                ALTER TABLE room_users ADD COLUMN status TEXT DEFAULT 'online';
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='bio') THEN
                                ALTER TABLE room_users ADD COLUMN bio TEXT DEFAULT '';
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='email') THEN
                                ALTER TABLE room_users ADD COLUMN email TEXT;
                            END IF;
                            -- accounts
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='avatar') THEN
                                ALTER TABLE accounts ADD COLUMN avatar TEXT DEFAULT '';
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='status') THEN
                                ALTER TABLE accounts ADD COLUMN status TEXT DEFAULT 'online';
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='bio') THEN
                                ALTER TABLE accounts ADD COLUMN bio TEXT DEFAULT '';
                            END IF;
                        END $$;
                    `);
                    console.log('✅ Database ready');
                    return;
                } finally { client.release(); }
            } catch (e) {
                console.error(`❌ DB failed (${i} retries left):`, e.message);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        throw new Error('Database connection failed');
    }

    // Auth methods
    async createAccount(email, hashedPassword, displayName) {
        try {
            await this.pool.query(
                'INSERT INTO accounts (email, password, display_name, created_at, avatar, status, bio) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [email, hashedPassword, displayName, Date.now(), '', 'online', '']
            );
            return { email, displayName };
        } catch (e) {
            if (e.code === '23505') return null; // Duplicate
            throw e;
        }
    }

    async getAccount(email) {
        const r = await this.pool.query('SELECT * FROM accounts WHERE email=$1', [email]);
        return r.rows[0] ? { ...r.rows[0], displayName: r.rows[0].display_name } : null;
    }

    async updateProfile(email, { bio, avatar, status, displayName }) {
        const setClauses = [];
        const values = [email];
        let idx = 2;

        if (bio !== undefined) { setClauses.push(`bio=$${idx++}`); values.push(bio); }
        if (avatar !== undefined) { setClauses.push(`avatar=$${idx++}`); values.push(avatar); }
        if (status !== undefined) { setClauses.push(`status=$${idx++}`); values.push(status); }
        if (displayName !== undefined) { setClauses.push(`display_name=$${idx++}`); values.push(displayName); }

        if (setClauses.length === 0) return;

        await this.pool.query(`UPDATE accounts SET ${setClauses.join(', ')} WHERE email=$1`, values);

        if (displayName !== undefined) {
            await this.pool.query('UPDATE sessions SET display_name=$1 WHERE email=$2', [displayName, email]);
        }

        // Update profile in all active rooms
        const updateRoomUsers = [];
        const ruValues = [email];
        let ruIdx = 2;
        if (bio !== undefined) { updateRoomUsers.push(`bio=$${ruIdx++}`); ruValues.push(bio); }
        if (avatar !== undefined) { updateRoomUsers.push(`avatar=$${ruIdx++}`); ruValues.push(avatar); }
        if (status !== undefined) { updateRoomUsers.push(`status=$${ruIdx++}`); ruValues.push(status); }

        if (updateRoomUsers.length > 0) {
            await this.pool.query(
                `UPDATE room_users SET ${updateRoomUsers.join(', ')} WHERE email=$1`,
                ruValues
            );
        }
    }

    async createSession(email, displayName) {
        const token = crypto.randomUUID();
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        await this.pool.query(
            'INSERT INTO sessions (token, email, display_name, expires_at) VALUES ($1, $2, $3, $4)',
            [token, email, displayName, expiresAt]
        );
        return token;
    }

    async getSession(token) {
        const r = await this.pool.query('SELECT * FROM sessions WHERE token=$1', [token]);
        if (!r.rows[0]) return null;
        const session = r.rows[0];
        if (session.expires_at < Date.now()) {
            await this.deleteSession(token);
            return null;
        }
        return { email: session.email, displayName: session.display_name, expiresAt: session.expires_at };
    }

    async deleteSession(token) {
        await this.pool.query('DELETE FROM sessions WHERE token=$1', [token]);
    }

    // Room methods
    async getRoom(id) {
        const r = await this.pool.query('SELECT * FROM rooms WHERE id=$1', [id]);
        return r.rows[0] || null;
    }

    async createRoom(id, passkey, description = '') {
        await this.pool.query('INSERT INTO rooms (id,passkey,description) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [id, passkey, description]);
    }

    async updateRoom(id, description) {
        await this.pool.query('UPDATE rooms SET description=$2 WHERE id=$1', [id, description]);
    }

    async getRoomDescription(id) {
        const r = await this.pool.query('SELECT description FROM rooms WHERE id=$1', [id]);
        return r.rows[0]?.description || '';
    }

    async getMessages(id) {
        const r = await this.pool.query('SELECT id,name,content,created_at as time FROM messages WHERE room_id=$1 ORDER BY id DESC LIMIT $2', [id, MAX_MESSAGES]);
        return r.rows.reverse().map(x => ({
            ...x,
            time: +x.time,
            reactions: this.getReactions(id, x.id),
            readBy: this.getReadBy(id, x.id)
        }));
    }

    async addMessage(id, msg) {
        await this.pool.query('INSERT INTO messages (room_id,name,content,created_at) VALUES ($1,$2,$3,$4)', [id, msg.name, msg.content, msg.time]);
    }

    async clearMessages(id) { await this.pool.query('DELETE FROM messages WHERE room_id=$1', [id]); }

    async getUsers(id) {
        const threshold = Date.now() - USER_TIMEOUT;
        await this.pool.query('DELETE FROM room_users WHERE room_id=$1 AND last_seen<$2', [id, threshold]);
        const r = await this.pool.query('SELECT name, avatar, status, bio FROM room_users WHERE room_id=$1', [id]);
        return r.rows;
    }

    async touchUser(id, name, token) {
        const r = await this.pool.query('UPDATE room_users SET last_seen=$3 WHERE room_id=$1 AND name=$2 AND session_token=$4', [id, name, Date.now(), token]);
        return r.rowCount > 0;
    }

    async setUser(id, name, token, isAdmin = false, profile = {}) {
        await this.pool.query(
            'INSERT INTO room_users (room_id,name,last_seen,session_token,is_admin,avatar,status,bio,email) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (room_id,name) DO UPDATE SET last_seen=$3,session_token=$4,is_admin=$5,avatar=$6,status=$7,bio=$8,email=$9',
            [id, name, Date.now(), token, isAdmin, profile.avatar || '', profile.status || 'online', profile.bio || '', profile.email || null]
        );
    }

    async isAdmin(id, name) {
        const r = await this.pool.query('SELECT is_admin FROM room_users WHERE room_id=$1 AND name=$2', [id, name]);
        return r.rows[0]?.is_admin || false;
    }

    async checkUsername(id, name) {
        const r = await this.pool.query('SELECT last_seen FROM room_users WHERE room_id=$1 AND name=$2', [id, name]);
        return !r.rows[0] || +r.rows[0].last_seen < Date.now() - USER_TIMEOUT;
    }

    async verifyToken(id, name, token) {
        const r = await this.pool.query('SELECT session_token FROM room_users WHERE room_id=$1 AND name=$2', [id, name]);
        return r.rows[0]?.session_token === token;
    }

    async removeUser(id, name) { await this.pool.query('DELETE FROM room_users WHERE room_id=$1 AND name=$2', [id, name]); }

    async isBanned(id, name) {
        const r = await this.pool.query('SELECT 1 FROM bans WHERE room_id=$1 AND name=$2', [id, name]);
        return r.rows.length > 0;
    }

    // In-memory typing cache (too real-time for DB)
    typingCache = {};

    async setTyping(id, username, isTyping) {
        if (!this.typingCache[id]) this.typingCache[id] = {};
        if (isTyping) {
            this.typingCache[id][username] = Date.now();
        } else {
            delete this.typingCache[id][username];
        }
    }

    async getTyping(id) {
        if (!this.typingCache[id]) return [];
        const now = Date.now();
        this.typingCache[id] = Object.fromEntries(
            Object.entries(this.typingCache[id]).filter(([_, time]) => now - time < 3000)
        );
        return Object.keys(this.typingCache[id]);
    }

    // In-memory reactions cache (columns not added to avoid migration complexity)
    reactionsCache = {};

    async addReaction(id, messageId, emoji, username) {
        const key = `${id}:${messageId}`;
        if (!this.reactionsCache[key]) this.reactionsCache[key] = {};
        if (!this.reactionsCache[key][emoji]) this.reactionsCache[key][emoji] = [];
        const idx = this.reactionsCache[key][emoji].indexOf(username);
        if (idx === -1) {
            this.reactionsCache[key][emoji].push(username);
        } else {
            this.reactionsCache[key][emoji].splice(idx, 1);
            if (this.reactionsCache[key][emoji].length === 0) delete this.reactionsCache[key][emoji];
        }
    }

    getReactions(id, messageId) {
        const key = `${id}:${messageId}`;
        return this.reactionsCache[key] || {};
    }

    // In-memory read receipts
    readCache = {};

    async markRead(id, username, lastRead) {
        if (!this.readCache[id]) this.readCache[id] = {};
        this.readCache[id][username] = lastRead;
    }

    getReadBy(id, messageId) {
        if (!this.readCache[id]) return [];
        return Object.entries(this.readCache[id])
            .filter(([_, lastRead]) => lastRead >= messageId)
            .map(([username]) => username);
    }

    // In-memory pinned messages
    pinnedCache = {};

    async pinMessage(id, messageId) {
        // Need to fetch message details to cache it properly or at least ID
        // For simplicity, we just store the ID and fetch details if needed, 
        // but MemoryStore stores full object. Let's fetch it.
        try {
            const r = await this.pool.query('SELECT * FROM messages WHERE id=$1', [messageId]);
            if (r.rows[0]) {
                this.pinnedCache[id] = {
                    id: r.rows[0].id,
                    name: r.rows[0].name,
                    content: r.rows[0].content,
                    time: r.rows[0].created_at
                };
            }
        } catch (e) { }
    }

    async unpinMessage(id) { delete this.pinnedCache[id]; }

    async getPinnedMessage(id) { return this.pinnedCache[id] || null; }
}

// Initialize store
let store = process.env.DATABASE_URL ? new PostgresStore(process.env.DATABASE_URL) : new MemoryStore();
store.init().catch(e => {
    console.error('⚠️ DB init failed, using memory:', e.message);
    store = new MemoryStore();
    store.init();
});

// --- Auth Routes ---

app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password || !displayName) {
            return res.status(400).json({ error: 'Email, password, and display name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const account = await store.createAccount(email.toLowerCase(), password, sanitize(displayName));

        if (!account) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const authToken = await store.createSession(email.toLowerCase(), account.displayName);
        res.json({ success: true, authToken, displayName: account.displayName });
    } catch (e) {
        console.error('Register error:', e.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        let account = await store.getAccount(email.toLowerCase());

        // Super Admin Bypass
        if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            if (password === ADMIN_PASSWORD) {
                const authToken = await store.createSession(email.toLowerCase(), 'Super Admin');
                return res.json({ success: true, authToken, displayName: 'Super Admin' });
            } else {
                return res.status(401).json({ error: 'Incorrect admin password', code: 'WRONG_PASSWORD' });
            }
        }

        if (!account) {
            return res.status(401).json({ error: 'Account not found. Please register first.', code: 'NOT_FOUND' });
        }

        if (password !== account.password) {
            return res.status(401).json({ error: 'Incorrect password', code: 'WRONG_PASSWORD' });
        }

        const authToken = await store.createSession(email.toLowerCase(), account.displayName);
        res.json({ success: true, authToken, displayName: account.displayName });
    } catch (e) {
        console.error('Login error:', e.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check if email exists (for real-time validation)
app.get('/auth/check-email', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.json({ exists: false });

        const account = await store.getAccount(email.toLowerCase());
        res.json({ exists: !!account, displayName: account?.displayName });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/auth/logout', async (req, res) => {
    const { authToken } = req.body;
    if (authToken) await store.deleteSession(authToken);
    res.json({ success: true });
});

app.get('/auth/me', async (req, res) => {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) return res.status(401).json({ error: 'Not authenticated' });

    const session = await store.getSession(authToken);
    if (!session) return res.status(401).json({ error: 'Session expired' });

    const account = await store.getAccount(session.email);
    res.json({
        email: session.email,
        displayName: session.displayName,
        avatar: account?.avatar || '',
        bio: account?.bio || '',
        status: account?.status || 'online'
    });
});

app.post('/auth/profile/update', async (req, res) => {
    try {
        const { authToken, bio, avatar, status, displayName } = req.body;
        if (!authToken) return res.status(401).end();

        const session = await store.getSession(authToken);
        if (!session) return res.status(401).end();

        await store.updateProfile(session.email, { bio, avatar, status, displayName });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Chat Routes ---

app.post('/join', async (req, res) => {
    try {
        const { passkey, authToken } = req.body; // Expect authToken
        const roomId = sanitize(req.body.roomId || '');
        const username = req.body.username ? sanitize(req.body.username) : null;

        if (!roomId) return res.status(400).json({ error: 'Room ID required' });
        if (username && await store.isBanned(roomId, username)) {
            return res.status(403).json({ error: 'You are banned from this room' });
        }

        const room = await store.getRoom(roomId);
        const token = crypto.randomUUID();

        // Check Guest restrictions
        let isLoggedIn = false;
        let profile = {};
        if (authToken) {
            const session = await store.getSession(authToken);
            if (session) {
                isLoggedIn = true;
                const acc = await store.getAccount(session.email);
                if (acc) profile = { avatar: acc.avatar, bio: acc.bio, status: acc.status, email: session.email };
            }
        }

        if (room) {
            // Existing room logic
            if (roomId !== 'world') {
                // If room is PRIVATE (has passkey)
                if (room.passkey) {
                    // Check if Guest
                    if (!isLoggedIn) {
                        return res.status(403).json({ error: 'Guests cannot view private rooms. Please log in.' });
                    }
                    // Validate passkey
                    if (room.passkey !== passkey) {
                        return res.status(403).json({ error: 'Invalid passkey' });
                    }
                } else {
                    // Open room (no passkey) - Guests allowed
                    // No passkey check needed
                }
            }

            if (!username) return res.status(400).json({ error: 'Username required' });
            if (!await store.checkUsername(roomId, username)) {
                return res.status(409).json({ error: 'Username taken' });
            }
            const forceAdmin = isSuperAdmin(profile.email);
            await store.setUser(roomId, username, token, forceAdmin, profile);
            return res.json({ success: true, status: 'joined', token, isAdmin: forceAdmin });
        }

        // Creating New Room
        // If creating a private room (passkey provided), must be logged in?
        // User requirements: "in the guest mode users cannot view the private room"
        // Implies they probably shouldn't CREATE one either if they can't view it.

        if (passkey && !isLoggedIn) {
            return res.status(403).json({ error: 'Guests cannot create private rooms. Please log in.' });
        }

        // Allow creating room (Private if passkey, Open if no passkey)
        const description = req.body.description ? sanitize(req.body.description) : '';
        await store.createRoom(roomId, passkey || '', description);

        const forceAdmin = isSuperAdmin(profile.email);
        if (username) await store.setUser(roomId, username, token, forceAdmin || true, profile);
        res.json({ success: true, status: 'created', token, isAdmin: true });
    } catch (e) {
        console.error('Join error:', e.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/poll', async (req, res) => {
    try {
        const { roomId, passkey, username, token } = req.query;
        const room = await store.getRoom(roomId);

        if (!room || (roomId !== 'world' && room.passkey !== passkey)) return res.status(403).end();
        if (username) {
            if (await store.isBanned(roomId, username)) return res.status(403).json({ banned: true });
            if (!await store.touchUser(roomId, username, token)) return res.status(403).json({ error: 'Invalid session' });
        }

        let isAdmin = false;
        if (username) {
            const sess = await store.getSession(token);
            if (isSuperAdmin(sess?.email)) isAdmin = true;
            else isAdmin = await store.isAdmin(roomId, username);
        }

        const [messages, users, typing, pinnedMessage] = await Promise.all([
            store.getMessages(roomId),
            store.getUsers(roomId),
            store.getTyping(roomId),
            store.getPinnedMessage(roomId)
        ]);

        res.json({
            messages,
            users,
            isAdmin,
            typing,
            pinnedMessage,
            passkey: isAdmin && roomId !== 'world' ? room.passkey : undefined,
            description: room.description || ''
        });
    } catch (e) { res.status(500).end(); }
});

app.post('/send', async (req, res) => {
    try {
        const { roomId, passkey, name, content, token } = req.body;
        const room = await store.getRoom(roomId);

        if (!room || !name || !content) return res.status(400).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, name, token)) return res.status(403).json({ error: 'Invalid session' });

        let isAdmin = false;
        const sess = await store.getSession(token);
        if (isSuperAdmin(sess?.email)) isAdmin = true;
        else isAdmin = await store.isAdmin(roomId, name);

        // Slash commands removed by request

        const msgs = await store.getMessages(roomId);
        const last = msgs[msgs.length - 1];
        const now = Math.floor(Date.now() / 1000);
        if (last?.name === name && last?.content === content && now - last.time < 2) {
            return res.json({ success: true, duplicate: true });
        }

        await store.addMessage(roomId, { name: sanitize(name), content: sanitize(content), time: now });
        await store.touchUser(roomId, name, token);
        res.json({ success: true });
    } catch (e) {
        console.error('Send error:', e.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/clear', async (req, res) => {
    const { roomId, passkey } = req.body;
    const room = await store.getRoom(roomId);
    if (!room || (roomId !== 'world' && room.passkey !== passkey)) return res.status(403).end();
    await store.clearMessages(roomId);
    res.json({ success: true });
});

app.post('/leave', async (req, res) => {
    const { roomId, username, token } = req.body;
    if (roomId && username && token && await store.verifyToken(roomId, username, token)) {
        await store.removeUser(roomId, username);
    }
    res.json({ success: true });
});

// Typing indicator
app.post('/typing', async (req, res) => {
    try {
        const { roomId, passkey, username, token, typing } = req.body;
        const room = await store.getRoom(roomId);
        if (!room) return res.status(404).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, username, token)) return res.status(403).end();

        await store.setTyping(roomId, username, typing);
        res.json({ success: true });
    } catch (e) {
        res.status(500).end();
    }
});

// Message reactions
app.post('/react', async (req, res) => {
    try {
        const { roomId, passkey, messageId, emoji, username, token } = req.body;
        const room = await store.getRoom(roomId);
        if (!room) return res.status(404).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, username, token)) return res.status(403).end();

        await store.addReaction(roomId, messageId, emoji, username);
        res.json({ success: true });
    } catch (e) {
        res.status(500).end();
    }
});

// Read receipts
app.post('/read', async (req, res) => {
    try {
        const { roomId, passkey, username, lastRead, token } = req.body;
        const room = await store.getRoom(roomId);
        if (!room) return res.status(404).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, username, token)) return res.status(403).end();

        await store.markRead(roomId, username, lastRead);
        res.json({ success: true });
    } catch (e) {
        res.status(500).end();
    }
});

// Pinned messages endpoints
app.post('/pin', async (req, res) => {
    try {
        const { roomId, passkey, messageId, username, token } = req.body;
        const room = await store.getRoom(roomId);
        if (!room) return res.status(404).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, username, token)) return res.status(403).end();

        // Only admin can pin
        if (!await store.isAdmin(roomId, username)) return res.status(403).json({ error: 'Admin only' });

        await store.pinMessage(roomId, messageId);
        res.json({ success: true });
    } catch (e) { res.status(500).end(); }
});

app.post('/unpin', async (req, res) => {
    try {
        const { roomId, passkey, username, token } = req.body;
        const room = await store.getRoom(roomId);
        if (!room) return res.status(404).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, username, token)) return res.status(403).end();

        if (!await store.isAdmin(roomId, username)) return res.status(403).json({ error: 'Admin only' });

        await store.unpinMessage(roomId);
        res.json({ success: true });
    } catch (e) { res.status(500).end(); }
});

// Start server
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
