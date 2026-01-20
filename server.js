require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const USER_TIMEOUT = 15000;
const MAX_MESSAGES = 50;

// Health check - MUST be first, before any middleware
app.get('/up', (req, res) => {
    console.log('Health check received');
    res.status(200).send('OK');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "QWERTY";
let worldAdminPassword = ADMIN_PASSWORD;

// --- Storage Abstraction ---

// 1. In-Memory Store (Local Fallback & Safety Net)
class MemoryStore {
    constructor() {
        this.rooms = { world: { passkey: null, messages: [], users: {} } };
    }

    async init() { console.log("💾 Storage: In-Memory (RAM)"); }

    async getRoom(roomId) { return this.rooms[roomId] || null; }

    async createRoom(roomId, passkey) {
        this.rooms[roomId] = { passkey, messages: [], users: {} };
        return true;
    }

    async getMessages(roomId) { return this.rooms[roomId]?.messages || []; }

    async addMessage(roomId, msg) {
        const room = this.rooms[roomId];
        if (!room) return;
        room.messages.push(msg);
        if (room.messages.length > MAX_MESSAGES) room.messages = room.messages.slice(-MAX_MESSAGES);
    }

    async clearMessages(roomId) { if (this.rooms[roomId]) this.rooms[roomId].messages = []; }

    async deleteMessage(roomId, content) {
        if (this.rooms[roomId]) this.rooms[roomId].messages = this.rooms[roomId].messages.filter(m => m.content !== content);
    }

    async getUsers(roomId) {
        const room = this.rooms[roomId];
        if (!room) return [];
        const now = Date.now();
        room.users = Object.fromEntries(Object.entries(room.users).filter(([_, data]) => now - data.lastSeen < USER_TIMEOUT));
        return Object.keys(room.users);
    }

    async touchUser(roomId, username, token) {
        const room = this.rooms[roomId];
        if (!room || !room.users[username]) return false;
        if (token && room.users[username].token !== token) return false;
        room.users[username].lastSeen = Date.now();
        return true;
    }

    async setUser(roomId, username, token, isAdmin = false) {
        if (!this.rooms[roomId]) return;
        this.rooms[roomId].users[username] = { token, lastSeen: Date.now(), isAdmin };
    }

    async setAdmin(roomId, username, isAdmin = true) {
        if (this.rooms[roomId] && this.rooms[roomId].users[username]) {
            this.rooms[roomId].users[username].isAdmin = isAdmin;
        }
    }

    async isAdmin(roomId, username) {
        const room = this.rooms[roomId];
        if (!room || !room.users[username]) return false;
        return !!room.users[username].isAdmin;
    }

    async checkUsername(roomId, username) {
        const room = this.rooms[roomId];
        if (!room) return true;
        const userData = room.users[username];
        if (userData && (Date.now() - userData.lastSeen < USER_TIMEOUT)) return false;
        return true;
    }

    async verifyToken(roomId, username, token) {
        const room = this.rooms[roomId];
        if (!room || !room.users[username]) return false;
        return room.users[username].token === token;
    }

    async removeUser(roomId, username) { if (this.rooms[roomId]) delete this.rooms[roomId].users[username]; }

    // Banning
    async isBanned(roomId, username) {
        if (!this.rooms[roomId] || !this.rooms[roomId].bans) return false;
        return this.rooms[roomId].bans.has(username);
    }

    async banUser(roomId, username) {
        if (!this.rooms[roomId]) return;
        if (!this.rooms[roomId].bans) this.rooms[roomId].bans = new Set();
        this.rooms[roomId].bans.add(username);
    }

    async getBannedUsers(roomId) {
        if (!this.rooms[roomId] || !this.rooms[roomId].bans) return [];
        return Array.from(this.rooms[roomId].bans);
    }

    async unbanUser(roomId, username) {
        if (this.rooms[roomId] && this.rooms[roomId].bans) {
            this.rooms[roomId].bans.delete(username);
        }
    }

    async unbanAll(roomId) {
        if (this.rooms[roomId]) {
            this.rooms[roomId].bans = new Set();
        }
    }
}

// 2. PostgreSQL Store (Network DB)
class PostgresStore {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 20,
            connectionTimeoutMillis: 5000, // Fail fast if DB unavail
            idleTimeoutMillis: 30000
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    async init() {
        console.log("🐘 Storage: PostgreSQL Database");
        // Retry logic for initial connection
        let retries = 5;
        while (retries > 0) {
            try {
                const client = await this.pool.connect();
                try {
                    // Create tables if not exists
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, passkey TEXT);
                        CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, room_id TEXT REFERENCES rooms(id), name TEXT, content TEXT, created_at BIGINT);
                        CREATE TABLE IF NOT EXISTS room_users (room_id TEXT REFERENCES rooms(id), name TEXT, last_seen BIGINT, PRIMARY KEY (room_id, name));
                        CREATE TABLE IF NOT EXISTS bans (room_id TEXT REFERENCES rooms(id), name TEXT, PRIMARY KEY (room_id, name));
                        INSERT INTO rooms (id, passkey) VALUES ('world', NULL) ON CONFLICT (id) DO NOTHING;
                        CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
                        CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
                    `);

                    // Add new columns if they don't exist (for migration)
                    await client.query(`
                        DO $$ 
                        BEGIN 
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='session_token') THEN
                                ALTER TABLE room_users ADD COLUMN session_token TEXT;
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_users' AND column_name='is_admin') THEN
                                ALTER TABLE room_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
                            END IF;
                        END $$;
                    `);
                    console.log("✅ Database initialized successfully");
                    return;
                } finally {
                    client.release();
                }
            } catch (err) {
                console.error(`❌ DB Connection Failed. Retries left: ${retries}`, err.message);
                retries--;
                await new Promise(res => setTimeout(res, 2000));
            }
        }
        throw new Error("Could not connect to database after retries");
    }

    async getRoom(roomId) {
        const res = await this.pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        return res.rows[0] ? { ...res.rows[0], exists: true } : null;
    }

    async createRoom(roomId, passkey) {
        await this.pool.query('INSERT INTO rooms (id, passkey) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomId, passkey]);
        return true;
    }

    async getMessages(roomId) {
        const res = await this.pool.query('SELECT id, name, content, created_at as time FROM messages WHERE room_id = $1 ORDER BY id DESC LIMIT $2', [roomId, MAX_MESSAGES]);
        return res.rows.reverse().map(r => ({ ...r, time: parseInt(r.time) }));
    }

    async addMessage(roomId, msg) {
        await this.pool.query('INSERT INTO messages (room_id, name, content, created_at) VALUES ($1, $2, $3, $4)', [roomId, msg.name, msg.content, msg.time]);
    }

    async clearMessages(roomId) {
        await this.pool.query('DELETE FROM messages WHERE room_id = $1', [roomId]);
    }

    async deleteMessage(roomId, content) {
        await this.pool.query('DELETE FROM messages WHERE room_id = $1 AND content = $2', [roomId, content]);
    }

    async getUsers(roomId) {
        const threshold = Date.now() - USER_TIMEOUT;
        await this.pool.query('DELETE FROM room_users WHERE room_id = $1 AND last_seen < $2', [roomId, threshold]);
        const res = await this.pool.query('SELECT name FROM room_users WHERE room_id = $1', [roomId]);
        return res.rows.map(r => r.name);
    }

    async touchUser(roomId, username, token) {
        const now = Date.now();
        const res = await this.pool.query(
            'UPDATE room_users SET last_seen = $3 WHERE room_id = $1 AND name = $2 AND session_token = $4',
            [roomId, username, now, token]
        );
        return res.rowCount > 0;
    }

    async setUser(roomId, username, token, isAdmin = false) {
        const now = Date.now();
        await this.pool.query(
            'INSERT INTO room_users (room_id, name, last_seen, session_token, is_admin) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (room_id, name) DO UPDATE SET last_seen = $3, session_token = $4, is_admin = $5',
            [roomId, username, now, token, isAdmin]
        );
    }

    async setAdmin(roomId, username, isAdmin = true) {
        await this.pool.query('UPDATE room_users SET is_admin = $3 WHERE room_id = $1 AND name = $2', [roomId, username, isAdmin]);
    }

    async isAdmin(roomId, username) {
        const res = await this.pool.query('SELECT is_admin FROM room_users WHERE room_id = $1 AND name = $2', [roomId, username]);
        return res.rows.length > 0 && res.rows[0].is_admin;
    }

    async checkUsername(roomId, username) {
        const threshold = Date.now() - USER_TIMEOUT;
        const res = await this.pool.query('SELECT last_seen FROM room_users WHERE room_id = $1 AND name = $2', [roomId, username]);
        if (res.rows.length > 0 && Number(res.rows[0].last_seen) > threshold) return false;
        return true;
    }

    async verifyToken(roomId, username, token) {
        const res = await this.pool.query('SELECT session_token FROM room_users WHERE room_id = $1 AND name = $2', [roomId, username]);
        return res.rows.length > 0 && res.rows[0].session_token === token;
    }

    async removeUser(roomId, username) {
        await this.pool.query('DELETE FROM room_users WHERE room_id = $1 AND name = $2', [roomId, username]);
    }

    async isBanned(roomId, username) {
        const res = await this.pool.query('SELECT 1 FROM bans WHERE room_id = $1 AND name = $2', [roomId, username]);
        return res.rows.length > 0;
    }

    async banUser(roomId, username) {
        await this.pool.query('INSERT INTO bans (room_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomId, username]);
        await this.removeUser(roomId, username);
    }

    async getBannedUsers(roomId) {
        const res = await this.pool.query('SELECT name FROM bans WHERE room_id = $1', [roomId]);
        return res.rows.map(r => r.name);
    }

    async unbanUser(roomId, username) {
        await this.pool.query('DELETE FROM bans WHERE room_id = $1 AND name = $2', [roomId, username]);
    }

    async unbanAll(roomId) {
        await this.pool.query('DELETE FROM bans WHERE room_id = $1', [roomId]);
    }
}

// Select Store with fallback
let store;
if (process.env.DATABASE_URL) {
    store = new PostgresStore(process.env.DATABASE_URL);
    // Initialize but don't crash app if DB fails immediately, we want logs
    store.init().catch(err => {
        console.error("⚠️ Critical DB Init Error - falling back to memory for stability", err);
        store = new MemoryStore();
    });
} else {
    store = new MemoryStore();
    store.init();
}

// --- Helpers ---
const sanitize = (text) => sanitizeHtml(text, { allowedTags: [] });

// --- Endpoints ---

app.post('/join', async (req, res) => {
    try {
        const { roomId, passkey } = req.body;
        if (!roomId) return res.status(400).send('Room ID required');

        const cleanRoomId = sanitize(roomId);
        const username = req.body.username ? sanitize(req.body.username) : null;

        if (username && await store.isBanned(cleanRoomId, username)) {
            return res.status(403).json({ success: false, error: 'You are banned from this room' });
        }

        let room = await store.getRoom(cleanRoomId);

        if (room) {
            if (username) {
                const isAvailable = await store.checkUsername(cleanRoomId, username);
                if (!isAvailable) return res.status(409).json({ success: false, error: 'Username already taken' });

                const token = require('crypto').randomUUID();
                await store.setUser(cleanRoomId, username, token, false);

                if (cleanRoomId === 'world') return res.json({ success: true, status: 'joined_world', token });

                if (room.passkey === passkey) {
                    return res.json({ success: true, status: 'joined', token });
                } else {
                    return res.status(403).json({ success: false, error: 'Invalid passkey' });
                }
            }
            return res.status(400).send('Username required');
        }

        if (!passkey) return res.status(403).send('Passkey required');
        await store.createRoom(cleanRoomId, passkey);

        const token = require('crypto').randomUUID();
        // Creator is admin
        if (username) await store.setUser(cleanRoomId, username, token, true);

        res.json({ success: true, status: 'created', token, isAdmin: true });
    } catch (e) {
        console.error("Join Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/poll', async (req, res) => {
    try {
        const { roomId, passkey, username, token } = req.query;
        const room = await store.getRoom(roomId);

        if (!room) return res.status(403).send();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).send();

        if (username) {
            if (await store.isBanned(roomId, username)) return res.status(403).json({ banned: true });
            const ok = await store.touchUser(roomId, username, token);
            if (!ok) return res.status(403).json({ error: 'Invalid session' });
        }

        const messages = await store.getMessages(roomId);
        const users = await store.getUsers(roomId);
        const isAdmin = username ? await store.isAdmin(roomId, username) : false;

        res.json({
            messages,
            users,
            isAdmin,
            passkey: (isAdmin && roomId !== 'world') ? room.passkey : undefined
        });
    } catch (e) {
        res.status(500).end();
    }
});

app.post('/send', async (req, res) => {
    try {
        const { roomId, passkey, name, content, token } = req.body;
        const room = await store.getRoom(roomId);

        if (!room || (!name || !content)) return res.status(400).send();
        if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).send();

        // Verify Session
        const isSessionValid = await store.verifyToken(roomId, name, token);
        if (!isSessionValid) return res.status(403).json({ error: 'Invalid session' });

        const isAdmin = await store.isAdmin(roomId, name);

        // Admin/System Commands
        if (content.startsWith('/')) {
            // Global/Room Admin Auth
            const adminMatch = content.match(/^\/admin\s+(.+)$/);
            if (adminMatch && adminMatch[1] === ADMIN_PASSWORD) {
                await store.setAdmin(roomId, name, true);
                return res.json({ success: true, system: "You are now an administrator" });
            }

            // Commands that require Admin
            if (isAdmin) {
                if (content === '/clearchat') {
                    await store.clearMessages(roomId);
                    return res.json({ success: true, system: "Chat cleared by admin" });
                }

                const deleteMatch = content.match(/^\/delete\s+(.+)$/);
                if (deleteMatch) {
                    let target = deleteMatch[1].replace(/^"(.*)"$/, '$1'); // Support both /delete msg and /delete "msg"
                    await store.deleteMessage(roomId, target);
                    return res.json({ success: true, system: `Message deleted` });
                }

                const banMatch = content.match(/^\/ban\s+(.+)$/);
                if (banMatch) {
                    const banArg = banMatch[1].replace(/^"(.*)"$/, '$1');

                    // /ban users - list banned users
                    if (banArg.toLowerCase() === 'users' || banArg.toLowerCase() === 'list') {
                        const bannedUsers = await store.getBannedUsers(roomId);
                        if (bannedUsers.length === 0) {
                            return res.json({ success: true, system: "No users are banned in this room" });
                        }
                        return res.json({ success: true, system: `Banned users: ${bannedUsers.join(', ')}` });
                    }

                    // /ban "username" - ban a user
                    await store.banUser(roomId, banArg);
                    return res.json({ success: true, system: `User ${banArg} banned` });
                }

                // /unban commands
                const unbanMatch = content.match(/^\/unban\s+(.+)$/);
                if (unbanMatch) {
                    const unbanArg = unbanMatch[1].replace(/^"(.*)"$/, '$1');

                    // /unban all - unban everyone
                    if (unbanArg.toLowerCase() === 'all') {
                        await store.unbanAll(roomId);
                        return res.json({ success: true, system: "All users have been unbanned" });
                    }

                    // /unban "user1,user2" - unban multiple users
                    const usersToUnban = unbanArg.split(',').map(u => u.trim());
                    for (const user of usersToUnban) {
                        await store.unbanUser(roomId, user);
                    }
                    return res.json({ success: true, system: `Unbanned: ${usersToUnban.join(', ')}` });
                }
            }

            // Legacy World Admin Commands (keep for compatibility if needed, but the new system is better)
            if (roomId === 'world') {
                const passChange = content.match(/^\/(\w+)2(\w+)$/);
                if (passChange && passChange[1] === worldAdminPassword) {
                    worldAdminPassword = passChange[2];
                    return res.json({ success: true, system: "World password updated" });
                }
            }
        }

        const msgs = await store.getMessages(roomId);
        const lastMsg = msgs[msgs.length - 1];
        const nowSec = Math.floor(Date.now() / 1000);

        if (lastMsg && lastMsg.name === name && lastMsg.content === content && (nowSec - lastMsg.time) < 2) {
            return res.json({ success: true, duplicate: true });
        }

        await store.addMessage(roomId, {
            name: sanitize(name),
            content: sanitize(content),
            time: nowSec
        });

        await store.touchUser(roomId, name, token);
        res.json({ success: true });
    } catch (e) {
        console.error("Send Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

app.post('/clear', async (req, res) => {
    const { roomId, passkey } = req.body;
    const room = await store.getRoom(roomId);
    if (!room || (roomId !== 'world' && room.passkey !== passkey)) return res.status(403).send();

    await store.clearMessages(roomId);
    res.json({ success: true });
});

app.post('/leave', async (req, res) => {
    const { roomId, username, token } = req.body;
    if (roomId && username && token) {
        const isSessionValid = await store.verifyToken(roomId, username, token);
        if (isSessionValid) await store.removeUser(roomId, username);
    }
    res.json({ success: true });
});

// Explicitly bind to 0.0.0.0 for Railway compatibility
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simple Chat running on port ${PORT}`);
    console.log('Server ready for health checks');
});
