const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');

const app = express();
const PORT = 3000;
const USER_TIMEOUT = 15000;
const MAX_MESSAGES = 50;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let rooms = { world: { passkey: null, messages: [], users: {} } };
let worldAdminPassword = "QWERTY";

const isValid = (roomId, passkey) => roomId === 'world' || (rooms[roomId]?.passkey === passkey);

const getOnlineUsers = (room) => {
    const now = Date.now();
    return Object.entries(room.users).filter(([user, lastSeen]) => {
        if (now - lastSeen < USER_TIMEOUT) return true;
        delete room.users[user];
        return false;
    }).map(([user]) => user);
};

const sanitize = (text) => sanitizeHtml(text, { allowedTags: [] });

app.post('/join', (req, res) => {
    const { roomId, passkey } = req.body;
    if (!roomId) return res.status(400).send('Room ID required');

    const cleanRoomId = sanitize(roomId);
    const username = req.body.username ? sanitize(req.body.username) : null;

    if (rooms[cleanRoomId]) {
        if (username) {
            const now = Date.now();
            if (rooms[cleanRoomId].users[username] && (now - rooms[cleanRoomId].users[username] < USER_TIMEOUT)) {
                return res.status(409).json({ success: false, error: 'Username already taken' });
            }
            rooms[cleanRoomId].users[username] = now;
        }

        if (cleanRoomId === 'world') return res.json({ success: true, status: 'joined_world' });

        return rooms[cleanRoomId].passkey === passkey
            ? res.json({ success: true, status: 'joined' })
            : res.status(403).json({ success: false, error: 'Invalid passkey' });
    }

    if (!passkey) return res.status(403).send('Passkey required');
    rooms[cleanRoomId] = { passkey, messages: [], users: {} };
    res.json({ success: true, status: 'created' });
});

app.get('/poll', (req, res) => {
    const { roomId, passkey, username } = req.query;
    if (!isValid(roomId, passkey)) return res.status(403).send();

    const room = rooms[roomId];
    if (username) room.users[username] = Date.now();

    res.json({ messages: room.messages, users: getOnlineUsers(room) });
});

app.post('/send', (req, res) => {
    const { roomId, passkey, name, content } = req.body;
    if (!isValid(roomId, passkey) || !name || !content) return res.status(400).send();

    const room = rooms[roomId];

    // World Admin Commands
    if (roomId === 'world' && content.startsWith('/')) {
        const passChange = content.match(/^\/(\w+)2(\w+)$/);
        if (passChange && passChange[1] === worldAdminPassword) {
            worldAdminPassword = passChange[2];
            return res.json({ success: true, system: "Password updated" });
        }

        if (content === `/${worldAdminPassword}clearchat`) {
            room.messages = [];
            return res.json({ success: true, system: "Chat cleared" });
        }

        const deleteMatch = content.match(new RegExp(`^\\/${worldAdminPassword}delete"(.+)"$`));
        if (deleteMatch) {
            const before = room.messages.length;
            room.messages = room.messages.filter(m => m.content !== deleteMatch[1]);
            return res.json({ success: true, system: `Deleted ${before - room.messages.length} messages` });
        }
    }

    // Duplicate check
    const lastMsg = room.messages[room.messages.length - 1];
    const nowSec = Math.floor(Date.now() / 1000);
    if (lastMsg?.name === name && lastMsg?.content === content && (nowSec - lastMsg.time) < 2) {
        return res.json({ success: true, duplicate: true });
    }

    room.messages.push({
        id: room.messages.length > 0 ? room.messages[room.messages.length - 1].id + 1 : 0,
        time: nowSec,
        name: sanitize(name),
        content: sanitize(content)
    });

    if (room.messages.length > MAX_MESSAGES) {
        room.messages = room.messages.slice(-MAX_MESSAGES);
    }

    room.users[name] = Date.now();
    res.json({ success: true });
});

app.post('/clear', (req, res) => {
    const { roomId, passkey } = req.body;
    if (!isValid(roomId, passkey)) return res.status(403).send();
    rooms[roomId].messages = [];
    res.json({ success: true });
});

app.post('/leave', (req, res) => {
    const { roomId, passkey, username } = req.body;
    if (!isValid(roomId, passkey) || !username) return res.status(400).send();
    delete rooms[roomId]?.users[username];
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Simple Chat running at http://localhost:${PORT}`));
