const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const USER_TIMEOUT = 15000;
const MAX_MESSAGES = 50;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let worldAdminPassword = "QWERTY";

// --- Storage Abstraction ---

// 1. In-Memory Store (Local Fallback)
class MemoryStore {
    constructor() {
        this.rooms = { world: { passkey: null, messages: [], users: {} } };
    }

    async init() { console.log("💾 Storage: In-Memory (RAM)"); }

    async getRoom(roomId) {
        return this.rooms[roomId] || null;
    }

    async createRoom(roomId, passkey) {
        this.rooms[roomId] = { passkey, messages: [], users: {} };
        return true;
    }

    async getMessages(roomId) {
        return this.rooms[roomId]?.messages || [];
    }

    async addMessage(roomId, msg) {
        const room = this.rooms[roomId];
        if (!room) return;
        room.messages.push(msg);
        if (room.messages.length > MAX_MESSAGES) {
            room.messages = room.messages.slice(-MAX_MESSAGES);
        }
    }

    async clearMessages(roomId) {
        if (this.rooms[roomId]) this.rooms[roomId].messages = [];
    }

    async deleteMessage(roomId, content) {
        if (this.rooms[roomId]) {
            this.rooms[roomId].messages = this.rooms[roomId].messages.filter(m => m.content !== content);
        }
    }

    async getUsers(roomId) {
        const room = this.rooms[roomId];
        if (!room) return [];
        const now = Date.now();
        // Prune and list
        room.users = Object.fromEntries(Object.entries(room.users).filter(([_, time]) => now - time < USER_TIMEOUT));
        return Object.keys(room.users);
    }

    async touchUser(roomId, username) {
        if (this.rooms[roomId]) this.rooms[roomId].users[username] = Date.now();
    }

    async checkUsername(roomId, username) {
        const room = this.rooms[roomId];
        if (!room) return true;
        const lastSeen = room.users[username];
        if (lastSeen && (Date.now() - lastSeen < USER_TIMEOUT)) return false; // Taken
        return true;
    }

    async removeUser(roomId, username) {
        if (this.rooms[roomId]) delete this.rooms[roomId].users[username];
    }
}

// 2. PostgreSQL Store (Network DB)
class PostgresStore {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 20 // Optimize limit for Railway starter tier
        });
    }

    async init() {
        console.log("🐘 Storage: PostgreSQL Database");
        const client = await this.pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, passkey TEXT);
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    room_id TEXT REFERENCES rooms(id),
                    name TEXT, content TEXT, created_at BIGINT
                );
                CREATE TABLE IF NOT EXISTS room_users (
                    room_id TEXT REFERENCES rooms(id),
                    name TEXT, last_seen BIGINT,
                    PRIMARY KEY (room_id, name)
                );
                INSERT INTO rooms (id, passkey) VALUES ('world', NULL) ON CONFLICT (id) DO NOTHING;
                
                -- Performance Indexes
                CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
                CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
            `);
        } finally {
            client.release();
        }
    }

    async getRoom(roomId) {
        const res = await this.pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        return res.rows[0] ? { ...res.rows[0], exists: true } : null; // Normalize
    }

    async createRoom(roomId, passkey) {
        await this.pool.query('INSERT INTO rooms (id, passkey) VALUES ($1, $2) ON CONFLICT DO NOTHING', [roomId, passkey]);
        return true;
    }

    async getMessages(roomId) {
        const res = await this.pool.query('SELECT id, name, content, created_at as time FROM messages WHERE room_id = $1 ORDER BY id DESC LIMIT $2', [roomId, MAX_MESSAGES]);
        return res.rows.reverse().map(r => ({ ...r, time: parseInt(r.time) })); // JS handles BigInt poorly sometimes, ensures logic works
    }

    async addMessage(roomId, msg) {
        await this.pool.query('INSERT INTO messages (room_id, name, content, created_at) VALUES ($1, $2, $3, $4)',
            [roomId, msg.name, msg.content, msg.time]);
    }

    async clearMessages(roomId) {
        await this.pool.query('DELETE FROM messages WHERE room_id = $1', [roomId]);
    }

    async deleteMessage(roomId, content) {
        await this.pool.query('DELETE FROM messages WHERE room_id = $1 AND content = $2', [roomId, content]);
    }

    async getUsers(roomId) {
        const threshold = Date.now() - USER_TIMEOUT;
        // Clean old
        await this.pool.query('DELETE FROM room_users WHERE room_id = $1 AND last_seen < $2', [roomId, threshold]);
        // Get active
        const res = await this.pool.query('SELECT name FROM room_users WHERE room_id = $1', [roomId]);
        return res.rows.map(r => r.name);
    }

    async touchUser(roomId, username) {
        const now = Date.now();
        await this.pool.query(`
            INSERT INTO room_users (room_id, name, last_seen) VALUES ($1, $2, $3)
            ON CONFLICT (room_id, name) DO UPDATE SET last_seen = $3
        `, [roomId, username, now]);
    }

    async checkUsername(roomId, username) {
        const threshold = Date.now() - USER_TIMEOUT;
        const res = await this.pool.query('SELECT last_seen FROM room_users WHERE room_id = $1 AND name = $2', [roomId, username]);
        if (res.rows.length > 0 && Number(res.rows[0].last_seen) > threshold) return false;
        return true;
    }

    async removeUser(roomId, username) {
        await this.pool.query('DELETE FROM room_users WHERE room_id = $1 AND name = $2', [roomId, username]);
    }
}

// Select Store
const store = process.env.DATABASE_URL ? new PostgresStore(process.env.DATABASE_URL) : new MemoryStore();
store.init().catch(console.error);

// --- Helpers ---
const sanitize = (text) => sanitizeHtml(text, { allowedTags: [] });

// --- Endpoints ---

app.post('/join', async (req, res) => {
    const { roomId, passkey } = req.body;
    if (!roomId) return res.status(400).send('Room ID required');

    const cleanRoomId = sanitize(roomId);
    const username = req.body.username ? sanitize(req.body.username) : null;

    let room = await store.getRoom(cleanRoomId);

    if (room) {
        if (username) {
            const isAvailable = await store.checkUsername(cleanRoomId, username);
            if (!isAvailable) return res.status(409).json({ success: false, error: 'Username already taken' });
            await store.touchUser(cleanRoomId, username);
        }

        if (cleanRoomId === 'world') return res.json({ success: true, status: 'joined_world' });

        return room.passkey === passkey
            ? res.json({ success: true, status: 'joined' })
            : res.status(403).json({ success: false, error: 'Invalid passkey' });
    }

    if (!passkey) return res.status(403).send('Passkey required');
    await store.createRoom(cleanRoomId, passkey);
    res.json({ success: true, status: 'created' });
});

app.get('/poll', async (req, res) => {
    const { roomId, passkey, username } = req.query;
    const room = await store.getRoom(roomId);

    // Validate
    if (!room) return res.status(403).send();
    if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).send();

    if (username) await store.touchUser(roomId, username);

    const messages = await store.getMessages(roomId);
    const users = await store.getUsers(roomId);

    res.json({ messages, users });
});

app.post('/send', async (req, res) => {
    const { roomId, passkey, name, content } = req.body;
    const room = await store.getRoom(roomId);

    if (!room || (!name || !content)) return res.status(400).send();
    if (roomId !== 'world' && room.passkey !== passkey) return res.status(403).send();

    // World Admin Commands
    if (roomId === 'world' && content.startsWith('/')) {
        const passChange = content.match(/^\/(\w+)2(\w+)$/);
        if (passChange && passChange[1] === worldAdminPassword) {
            worldAdminPassword = passChange[2];
            return res.json({ success: true, system: "Password updated" });
        }

        if (content === `/${worldAdminPassword}clearchat`) {
            await store.clearMessages(roomId);
            return res.json({ success: true, system: "Chat cleared" });
        }

        const deleteMatch = content.match(new RegExp(`^\\/${worldAdminPassword}delete"(.+)"$`));
        if (deleteMatch) {
            await store.deleteMessage(roomId, deleteMatch[1]);
            return res.json({ success: true, system: `Messages deleted` });
        }
    }

    // Duplicate check logic (simplified for DB: just skip if exact match in last msg)
    const msgs = await store.getMessages(roomId);
    const lastMsg = msgs[msgs.length - 1];
    const nowSec = Math.floor(Date.now() / 1000); // Store seconds for consistency

    if (lastMsg && lastMsg.name === name && lastMsg.content === content && (nowSec - lastMsg.time) < 2) {
        return res.json({ success: true, duplicate: true });
    }

    await store.addMessage(roomId, {
        name: sanitize(name),
        content: sanitize(content),
        time: nowSec
    });

    await store.touchUser(roomId, name);
    res.json({ success: true });
});

app.post('/clear', async (req, res) => {
    const { roomId, passkey } = req.body;
    const room = await store.getRoom(roomId);
    if (!room || (roomId !== 'world' && room.passkey !== passkey)) return res.status(403).send();

    await store.clearMessages(roomId);
    res.json({ success: true });
});

app.post('/leave', async (req, res) => {
    const { roomId, username } = req.body;
    if (roomId && username) {
        await store.removeUser(roomId, username);
    }
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Simple Chat running on port ${PORT}`));
