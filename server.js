require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sanitizeHtml = require('sanitize-html');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'QWERTY';
const USER_TIMEOUT = 15000;
const MAX_MESSAGES = 50;
const SALT_ROUNDS = 10;

// Health check endpoint (must be first)
app.get('/up', (_, res) => res.send('OK'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Helper
const sanitize = text => sanitizeHtml(text, { allowedTags: [] });

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
        this.accounts[email] = { password: hashedPassword, displayName, createdAt: Date.now() };
        return { email, displayName };
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

    async createRoom(id, passkey) {
        this.rooms[id] = { passkey, messages: [], users: {}, bans: new Set() };
    }

    async getMessages(id) { return this.rooms[id]?.messages || []; }

    async addMessage(id, msg) {
        const room = this.rooms[id];
        if (!room) return;
        room.messages.push(msg);
        if (room.messages.length > MAX_MESSAGES) room.messages = room.messages.slice(-MAX_MESSAGES);
    }

    async clearMessages(id) { if (this.rooms[id]) this.rooms[id].messages = []; }

    async deleteMessage(id, content) {
        if (this.rooms[id]) this.rooms[id].messages = this.rooms[id].messages.filter(m => m.content !== content);
    }

    async getUsers(id) {
        const room = this.rooms[id];
        if (!room) return [];
        const now = Date.now();
        room.users = Object.fromEntries(Object.entries(room.users).filter(([_, d]) => now - d.lastSeen < USER_TIMEOUT));
        return Object.keys(room.users);
    }

    async touchUser(id, name, token) {
        const room = this.rooms[id];
        if (!room?.users[name] || room.users[name].token !== token) return false;
        room.users[name].lastSeen = Date.now();
        return true;
    }

    async setUser(id, name, token, isAdmin = false) {
        if (this.rooms[id]) this.rooms[id].users[name] = { token, lastSeen: Date.now(), isAdmin };
    }

    async setAdmin(id, name, isAdmin = true) {
        if (this.rooms[id]?.users[name]) this.rooms[id].users[name].isAdmin = isAdmin;
    }

    async isAdmin(id, name) { return !!this.rooms[id]?.users[name]?.isAdmin; }

    async checkUsername(id, name) {
        const user = this.rooms[id]?.users[name];
        return !user || (Date.now() - user.lastSeen >= USER_TIMEOUT);
    }

    async verifyToken(id, name, token) { return this.rooms[id]?.users[name]?.token === token; }

    async removeUser(id, name) { if (this.rooms[id]) delete this.rooms[id].users[name]; }

    async isBanned(id, name) { return this.rooms[id]?.bans?.has(name) || false; }

    async banUser(id, name) { this.rooms[id]?.bans?.add(name); }

    async getBannedUsers(id) { return Array.from(this.rooms[id]?.bans || []); }

    async unbanUser(id, name) { this.rooms[id]?.bans?.delete(name); }

    async unbanAll(id) { if (this.rooms[id]) this.rooms[id].bans = new Set(); }
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
                        CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, passkey TEXT);
                        CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, room_id TEXT REFERENCES rooms(id), name TEXT, content TEXT, created_at BIGINT);
                        CREATE TABLE IF NOT EXISTS room_users (room_id TEXT REFERENCES rooms(id), name TEXT, last_seen BIGINT, PRIMARY KEY (room_id, name));
                        CREATE TABLE IF NOT EXISTS bans (room_id TEXT REFERENCES rooms(id), name TEXT, PRIMARY KEY (room_id, name));
                        CREATE TABLE IF NOT EXISTS accounts (email TEXT PRIMARY KEY, password TEXT NOT NULL, display_name TEXT NOT NULL, created_at BIGINT);
                        CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT REFERENCES accounts(email), display_name TEXT, expires_at BIGINT);
                        INSERT INTO rooms (id, passkey) VALUES ('world', NULL) ON CONFLICT DO NOTHING;
                        CREATE INDEX IF NOT EXISTS idx_msg_room ON messages(room_id);
                        CREATE INDEX IF NOT EXISTS idx_users_room ON room_users(room_id);
                        CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
                    `);
                    await client.query(`
                        DO $$ BEGIN
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='session_token') THEN
                                ALTER TABLE room_users ADD COLUMN session_token TEXT;
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='is_admin') THEN
                                ALTER TABLE room_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
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
                'INSERT INTO accounts (email, password, display_name, created_at) VALUES ($1, $2, $3, $4)',
                [email, hashedPassword, displayName, Date.now()]
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

    async createRoom(id, passkey) {
        await this.pool.query('INSERT INTO rooms (id,passkey) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, passkey]);
    }

    async getMessages(id) {
        const r = await this.pool.query('SELECT id,name,content,created_at as time FROM messages WHERE room_id=$1 ORDER BY id DESC LIMIT $2', [id, MAX_MESSAGES]);
        return r.rows.reverse().map(x => ({ ...x, time: +x.time }));
    }

    async addMessage(id, msg) {
        await this.pool.query('INSERT INTO messages (room_id,name,content,created_at) VALUES ($1,$2,$3,$4)', [id, msg.name, msg.content, msg.time]);
    }

    async clearMessages(id) { await this.pool.query('DELETE FROM messages WHERE room_id=$1', [id]); }

    async deleteMessage(id, content) { await this.pool.query('DELETE FROM messages WHERE room_id=$1 AND content=$2', [id, content]); }

    async getUsers(id) {
        const threshold = Date.now() - USER_TIMEOUT;
        await this.pool.query('DELETE FROM room_users WHERE room_id=$1 AND last_seen<$2', [id, threshold]);
        const r = await this.pool.query('SELECT name FROM room_users WHERE room_id=$1', [id]);
        return r.rows.map(x => x.name);
    }

    async touchUser(id, name, token) {
        const r = await this.pool.query('UPDATE room_users SET last_seen=$3 WHERE room_id=$1 AND name=$2 AND session_token=$4', [id, name, Date.now(), token]);
        return r.rowCount > 0;
    }

    async setUser(id, name, token, isAdmin = false) {
        await this.pool.query(
            'INSERT INTO room_users (room_id,name,last_seen,session_token,is_admin) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (room_id,name) DO UPDATE SET last_seen=$3,session_token=$4,is_admin=$5',
            [id, name, Date.now(), token, isAdmin]
        );
    }

    async setAdmin(id, name, isAdmin = true) {
        await this.pool.query('UPDATE room_users SET is_admin=$3 WHERE room_id=$1 AND name=$2', [id, name, isAdmin]);
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

    async banUser(id, name) {
        await this.pool.query('INSERT INTO bans (room_id,name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, name]);
        await this.removeUser(id, name);
    }

    async getBannedUsers(id) {
        const r = await this.pool.query('SELECT name FROM bans WHERE room_id=$1', [id]);
        return r.rows.map(x => x.name);
    }

    async unbanUser(id, name) { await this.pool.query('DELETE FROM bans WHERE room_id=$1 AND name=$2', [id, name]); }

    async unbanAll(id) { await this.pool.query('DELETE FROM bans WHERE room_id=$1', [id]); }
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

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const account = await store.createAccount(email.toLowerCase(), hashedPassword, sanitize(displayName));

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

        const account = await store.getAccount(email.toLowerCase());
        if (!account) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, account.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const authToken = await store.createSession(email.toLowerCase(), account.displayName);
        res.json({ success: true, authToken, displayName: account.displayName });
    } catch (e) {
        console.error('Login error:', e.message);
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

    res.json({ email: session.email, displayName: session.displayName });
});

// --- Chat Routes ---

app.post('/join', async (req, res) => {
    try {
        const { passkey } = req.body;
        const roomId = sanitize(req.body.roomId || '');
        const username = req.body.username ? sanitize(req.body.username) : null;

        if (!roomId) return res.status(400).json({ error: 'Room ID required' });
        if (username && await store.isBanned(roomId, username)) {
            return res.status(403).json({ error: 'You are banned from this room' });
        }

        const room = await store.getRoom(roomId);
        const token = crypto.randomUUID();

        if (room) {
            if (!username) return res.status(400).json({ error: 'Username required' });
            if (!await store.checkUsername(roomId, username)) {
                return res.status(409).json({ error: 'Username taken' });
            }
            await store.setUser(roomId, username, token, false);
            if (roomId === 'world') return res.json({ success: true, status: 'joined', token });
            if (room.passkey !== passkey) return res.status(403).json({ error: 'Invalid passkey' });
            return res.json({ success: true, status: 'joined', token });
        }

        if (!passkey) return res.status(403).json({ error: 'Passkey required' });
        await store.createRoom(roomId, passkey);
        if (username) await store.setUser(roomId, username, token, true);
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

        const [messages, users, isAdmin] = await Promise.all([
            store.getMessages(roomId),
            store.getUsers(roomId),
            username ? store.isAdmin(roomId, username) : false
        ]);

        res.json({ messages, users, isAdmin, passkey: isAdmin && roomId !== 'world' ? room.passkey : undefined });
    } catch (e) { res.status(500).end(); }
});

app.post('/send', async (req, res) => {
    try {
        const { roomId, passkey, name, content, token } = req.body;
        const room = await store.getRoom(roomId);

        if (!room || !name || !content) return res.status(400).end();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).end();
        if (!await store.verifyToken(roomId, name, token)) return res.status(403).json({ error: 'Invalid session' });

        const isAdmin = await store.isAdmin(roomId, name);

        // Handle commands
        if (content.startsWith('/')) {
            if (content.match(/^\/admin\s+(.+)$/)?.[1] === ADMIN_PASSWORD) {
                await store.setAdmin(roomId, name, true);
                return res.json({ success: true, system: 'You are now an admin' });
            }

            if (isAdmin) {
                if (content === '/clearchat') {
                    await store.clearMessages(roomId);
                    return res.json({ success: true, system: 'Chat cleared' });
                }

                const delMatch = content.match(/^\/delete\s+(.+)$/);
                if (delMatch) {
                    await store.deleteMessage(roomId, delMatch[1].replace(/^"(.*)"$/, '$1'));
                    return res.json({ success: true, system: 'Message deleted' });
                }

                const banMatch = content.match(/^\/ban\s+(.+)$/);
                if (banMatch) {
                    const arg = banMatch[1].replace(/^"(.*)"$/, '$1').toLowerCase();
                    if (arg === 'users' || arg === 'list') {
                        const banned = await store.getBannedUsers(roomId);
                        return res.json({ success: true, system: banned.length ? `Banned: ${banned.join(', ')}` : 'No bans' });
                    }
                    await store.banUser(roomId, banMatch[1].replace(/^"(.*)"$/, '$1'));
                    return res.json({ success: true, system: 'User banned' });
                }

                const unbanMatch = content.match(/^\/unban\s+(.+)$/);
                if (unbanMatch) {
                    const arg = unbanMatch[1].replace(/^"(.*)"$/, '$1');
                    if (arg.toLowerCase() === 'all') {
                        await store.unbanAll(roomId);
                        return res.json({ success: true, system: 'All unbanned' });
                    }
                    for (const u of arg.split(',').map(s => s.trim())) await store.unbanUser(roomId, u);
                    return res.json({ success: true, system: 'Users unbanned' });
                }
            }
        }

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

// Start server
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
