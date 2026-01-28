const BEEP_URL = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABSwAHCwsVFRkZHR0hISkpLS0xMTU1OTk9PUFBRUVJSU1NUVFVVVlZWlpeXmJiZmZqam5ucnJ6en5+goKGhpiYmZmdnZ+foaGkpKWlqKiorKywMDMzOTk9PT5+foSEjIyVlZaWnZ2hoaWlqamwsLW1u7vAwMjIzMzQ0NXV2trg4OTk7Ozw8Pb2+vr///8AAAA5TGF2YzU5LjM3AAAAAAAAAAAAAAAAJAAAAAAAAAAAASwAAAAAAAABSvyqfQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQzAABAAAB4AAAAOIABBwAAAEETGF2YzU5LjM3AAAh+gAAASwAAAAAAAAAABF//uQzAAD/8AAAaQAAAAgAAA0gAAAB5B/8HwHwHgPgPAP/8AAf/4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/8AAAAAD/8AAAA";

// Auth state
const authToken = localStorage.getItem('authToken');
const savedDisplayName = localStorage.getItem('displayName');

// Theme state
const THEME_COLORS = {
    default: { accent: '#000080', accentLight: '#0066cc' },
    purple: { accent: '#7c3aed', accentLight: '#a855f7' },
    green: { accent: '#059669', accentLight: '#10b981' },
    red: { accent: '#dc2626', accentLight: '#f87171' },
    orange: { accent: '#ea580c', accentLight: '#fb923c' },
    pink: { accent: '#db2777', accentLight: '#f472b6' }
};

const audioObj = new Audio(BEEP_URL);
let isTabActive = true;
let pollFailCount = 0;
let pollDelay = 2000;
const MAX_POLL_DELAY = 30000;

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);

const els = {
    roomSelection: $('room-selection'), chatInterface: $('chat-interface'),
    setRoomBtn: $('set-room-btn'), initialRoomInput: $('initial-room-input'),
    headerTitle: $('header-title'), form: $('chat-form'),
    nameInput: $$('input[name="name"]'), mainInput: $('main-input'),
    actionBtn: $('action-btn'), messageList: $('messages'),
    roomControls: $('room-controls'), pkVal: $('pk-val'),
    soundToggle: $('sound-toggle'), clearBtn: $('clear-btn'),
    logoutBtn: $('logout-btn'), onlineUsersDiv: $('online-users'),
    formStatus: $('form-status'), typingIndicator: $('typing-indicator'),
    pinnedBar: $('pinned-message-bar'), pinnedContent: $('pinned-message-content'),
    unpinBtn: $('unpin-btn'), msgTemplate: $('msg-template'),
    connectionStatus: $('connection-status')
};

let roomId = new URLSearchParams(window.location.search).get('room');
let passkey = '', myUsername = '', sessionToken = '', isJoined = false, lastMessageId = -1, isPolling = false, isAdmin = false;
let typingTimeout = null, isTyping = false, currentPinnedMessage = null;

// ===== DARK MODE & THEMES =====
const initTheme = () => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const theme = localStorage.getItem('theme') || 'default';
    const notifications = localStorage.getItem('notifications') === 'true';

    if (darkMode) {
        document.documentElement.classList.add('dark');
        $('dark-mode-toggle').checked = true;
    }

    // Notifications check
    $('notifications-toggle').checked = notifications;
    if (notifications && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    applyTheme(theme);

    // Mark active theme
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === theme);
    });
};

const applyTheme = (themeName) => {
    const colors = THEME_COLORS[themeName] || THEME_COLORS.default;
    document.documentElement.style.setProperty('--accent-h1', colors.accent);
    localStorage.setItem('theme', themeName);
};

$('dark-mode-toggle').addEventListener('change', (e) => {
    const isDark = e.target.checked;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark);
});

$('notifications-toggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('notifications', enabled);
    if (enabled && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
});

document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        applyTheme(opt.dataset.theme);
    });
});

// Settings modal
$('settings-btn').addEventListener('click', () => {
    $('settings-modal').classList.add('show');
});

$('close-settings').addEventListener('click', () => {
    $('settings-modal').classList.remove('show');
});

$('settings-modal').addEventListener('click', (e) => {
    if (e.target === $('settings-modal')) {
        $('settings-modal').classList.remove('show');
    }
});

// ===== NOTIFICATIONS =====
const sendNotification = (title, body) => {
    // Only send if hidden or not focused, AND notifications enabled
    if (document.hidden && localStorage.getItem('notifications') === 'true' && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

// ===== USER BAR =====
const showFormStatus = (msg) => {
    els.formStatus.textContent = msg;
    setTimeout(() => els.formStatus.textContent = '', 3000);
};

const setupUserBar = () => {
    const userDisplayName = $('user-display-name');
    const guestBadge = $('guest-badge');
    const loggedInBadge = $('logged-in-badge');
    const signoutBtn = $('signout-btn');

    const guestName = localStorage.getItem('guestName');

    if (savedDisplayName && authToken) {
        userDisplayName.textContent = savedDisplayName;
        guestBadge.style.display = 'none';
        loggedInBadge.style.display = 'inline';
        if (els.nameInput) els.nameInput.value = savedDisplayName;
    } else if (guestName) {
        userDisplayName.textContent = guestName;
        guestBadge.textContent = 'Returned Guest';
        guestBadge.style.display = 'inline';
        loggedInBadge.style.display = 'none';
        if (els.nameInput) els.nameInput.value = guestName;
    } else {
        userDisplayName.textContent = 'Guest';
        guestBadge.textContent = 'Guest';
        guestBadge.style.display = 'inline';
        loggedInBadge.style.display = 'none';
    }

    signoutBtn.addEventListener('click', async () => {
        if (authToken) {
            await fetch('/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken })
            });
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('displayName');
        window.location.href = '/login.html';
    });
};

// ===== ROOM SELECTION =====
const showRoomSelection = () => {
    els.roomSelection.style.display = 'flex';
    els.chatInterface.style.display = 'none';
    els.initialRoomInput.focus();
};

const showChatInterface = () => {
    els.roomSelection.style.display = 'none';
    els.chatInterface.style.display = 'flex';
    els.headerTitle.textContent = roomId === 'world' ? '🌎 World Chat' : `Room: ${roomId}`;
    initJoinMode();
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', roomId);
    window.history.pushState({}, '', newUrl);
};

const initJoinMode = () => {
    isJoined = isPolling = false;
    Object.assign(els.mainInput, {
        type: 'password', name: 'passkey', placeholder: 'Room Passkey (Leave empty for Open Room)',
        disabled: false, value: ''
    });

    if (roomId === 'world') {
        els.mainInput.style.display = 'none';
        els.actionBtn.textContent = 'Join World';

        // Auto-join World Chat if name exists
        const nameVal = els.nameInput.value.trim();
        if (nameVal && (authToken || localStorage.getItem('guestName'))) {
            setTimeout(() => {
                if (!isJoined) els.form.dispatchEvent(new Event('submit'));
            }, 100);
        }
    } else {
        els.mainInput.style.display = 'block';
        els.actionBtn.textContent = 'Join';
    }

    els.actionBtn.disabled = false;
    els.roomControls.style.display = 'none';
    els.onlineUsersDiv.style.display = 'none';
    els.messageList.innerHTML = '<li id="status-message">Please join the room...</li>';
    lastMessageId = -1;
    els.nameInput.focus();
};

const switchToChatMode = () => {
    isJoined = true;
    myUsername = els.nameInput.value.trim();
    if (!authToken) {
        localStorage.setItem('guestName', myUsername);
        setupUserBar(); // Refresh badges
    }
    Object.assign(els.mainInput, {
        style: { display: 'block' }, type: 'text', name: 'content',
        placeholder: 'Message', value: ''
    });
    els.mainInput.focus();
    els.actionBtn.textContent = 'Send';
    els.roomControls.style.display = 'flex';
    els.onlineUsersDiv.style.display = 'flex';
    els.pkVal.textContent = passkey || 'Public';

    if (roomId === 'world') {
        els.clearBtn.style.display = 'none';
        els.pkVal.parentElement.style.display = 'none';
    } else {
        els.clearBtn.style.display = 'inline-block';
        els.pkVal.parentElement.style.display = 'block';
    }

    $('status-message')?.remove();
    startPolling();
};

// ===== TYPING INDICATOR =====
const sendTypingStatus = async (typing) => {
    if (!isJoined) return;
    try {
        await fetch('/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, passkey, username: myUsername, token: sessionToken, typing })
        });
    } catch (e) { }
};

els.mainInput.addEventListener('input', () => {
    if (!isJoined) return;

    if (!isTyping) {
        isTyping = true;
        sendTypingStatus(true);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        sendTypingStatus(false);
    }, 2000);
});

const updateTypingIndicator = (typingUsers) => {
    if (!typingUsers || typingUsers.length === 0) {
        els.typingIndicator.textContent = '';
        return;
    }

    const others = typingUsers.filter(u => u !== myUsername);
    if (others.length === 0) {
        els.typingIndicator.textContent = '';
    } else if (others.length === 1) {
        els.typingIndicator.textContent = `${others[0]} is typing...`;
    } else if (others.length === 2) {
        els.typingIndicator.textContent = `${others[0]} and ${others[1]} are typing...`;
    } else {
        els.typingIndicator.textContent = `${others.length} people are typing...`;
    }
};

// ===== PINNED MESSAGES =====
const updatePinnedMessage = (msg) => {
    if (!msg) {
        els.pinnedBar.style.display = 'none';
        currentPinnedMessage = null;
        return;
    }

    // Don't redraw if same
    if (currentPinnedMessage && currentPinnedMessage.id === msg.id) return;

    currentPinnedMessage = msg;
    els.pinnedBar.style.display = 'flex';
    els.pinnedContent.textContent = `${msg.name}: ${msg.content}`;

    // Show/hide unpin button for admin logic handled in polling
    els.unpinBtn.style.display = isAdmin ? 'block' : 'none';
};

const pinMessage = async (msgId) => {
    try {
        await fetch('/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, passkey, messageId: msgId, username: myUsername, token: sessionToken })
        });
    } catch (e) { console.error(e); }
};

const unpinMessage = async () => {
    try {
        await fetch('/unpin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, passkey, username: myUsername, token: sessionToken })
        });
    } catch (e) { console.error(e); }
};

els.unpinBtn.addEventListener('click', unpinMessage);
els.pinnedBar.addEventListener('click', (e) => {
    if (e.target !== els.unpinBtn && currentPinnedMessage) {
        const el = document.querySelector(`li[data-id="${currentPinnedMessage.id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

// ===== MESSAGE REACTIONS =====
const addReaction = async (messageId, emoji) => {
    try {
        await fetch('/react', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, passkey, messageId, emoji, username: myUsername, token: sessionToken })
        });
    } catch (e) { console.error(e); }
};

const renderReactions = (li, reactions) => {
    const container = li.querySelector('.msg-reactions');
    if (!container) return;

    container.innerHTML = '';

    if (reactions && Object.keys(reactions).length > 0) {
        for (const [emoji, users] of Object.entries(reactions)) {
            const btn = document.createElement('button');
            btn.className = 'reaction-btn' + (users.includes(myUsername) ? ' active' : '');
            btn.innerHTML = `${emoji} <span>${users.length}</span>`;
            btn.title = users.join(', ');
            btn.onclick = () => addReaction(li.dataset.id, emoji);
            container.appendChild(btn);
        }
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'add-reaction-btn';
    addBtn.textContent = '+';
    addBtn.onclick = (e) => {
        e.stopPropagation();
        // Hide all other pickers
        document.querySelectorAll('.reaction-picker.show').forEach(p => p.classList.remove('show'));

        const picker = li.querySelector('.reaction-picker');
        picker.classList.toggle('show');
    };
    container.appendChild(addBtn);
};

// Close pickers on click elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.reaction-picker') && !e.target.classList.contains('add-reaction-btn')) {
        document.querySelectorAll('.reaction-picker.show').forEach(p => p.classList.remove('show'));
    }
});

// ===== MESSAGES & FORMATTING =====
const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateHeader = (ts) => {
    const date = new Date(ts * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
};

const processMentions = (content) => {
    return content.replace(/@(\w+)/g, (match, username) => {
        return `<span class="mention">@${username}</span>`;
    });
};

const playSound = () => els.soundToggle.checked && audioObj.play().catch(() => { });

const insertDateHeaderIfNeeded = (ts) => {
    const dateStr = formatDateHeader(ts);
    const lastDateHeader = els.messageList.lastElementChild?.classList.contains('date-header')
        ? els.messageList.lastElementChild.textContent
        : null;

    // Check previous message time if exists
    const lastMsgLi = els.messageList.querySelector('li:not(.date-header):last-child');
    if (lastMsgLi && !lastMsgLi.classList.contains('pending')) {
        // We need to compare timestamps, but simpler is to check if we need a header
        // For new messages, likely we do if it's a new day or list is empty
    }

    // Simplification: logic is tricky to append perfectly without date on every message
    // Instead we'll check the last header in the list
    const headers = document.querySelectorAll('.date-header');
    const lastHeader = headers.length > 0 ? headers[headers.length - 1].textContent : '';

    if (lastHeader !== dateStr) {
        const li = document.createElement('li');
        li.className = 'date-header';
        li.innerHTML = `<span>${dateStr}</span>`;
        els.messageList.append(li);
    }
};

const appendMessage = (msg) => {
    const template = els.msgTemplate;
    if (!template) return;

    // Check date header
    // We only add date header if this message is significantly newer or first
    // For simplicity in this append-only model, we check if the date changed from last received message
    if (!msg.pending) {
        insertDateHeaderIfNeeded(msg.time);
    }

    const li = template.content.cloneNode(true).querySelector('li');
    const isMine = msg.name === myUsername;
    li.classList.add(isMine ? 'message-mine' : 'message-other');

    if (msg.pending) {
        li.classList.add('pending');
        li.querySelector('small').textContent = msg.name;
        li.querySelector('.msg-content').textContent = msg.content;
    } else {
        li.classList.remove('pending');
        const timeStr = formatTime(msg.time);

        // Read receipt
        const readReceipt = isMine ?
            `<span class="read-receipt ${msg.readBy?.length > 1 ? 'read' : ''}">✓${msg.readBy?.length > 1 ? '✓' : ''}</span>` : '';

        li.querySelector('small').innerHTML = `<b>${msg.name}</b> • ${timeStr} ${readReceipt}`;

        // Content with mentions
        // We trust the server sanitized logic, but let's be safe and escape HTML first then add mentions
        const safeContent = msg.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        li.querySelector('.msg-content').innerHTML = processMentions(safeContent);

        li.dataset.id = msg.id;
        li.dataset.user = msg.name;

        // Render reactions
        renderReactions(li, msg.reactions);

        // Reaction picker buttons
        li.querySelectorAll('.reaction-picker button:not(.admin-actions button)').forEach(btn => {
            btn.onclick = () => {
                addReaction(msg.id, btn.dataset.emoji);
                li.querySelector('.reaction-picker').classList.remove('show');
            };
        });

        // Admin actions
        if (isAdmin) {
            const actions = li.querySelector('.admin-actions');
            actions.style.display = 'block';
            actions.querySelector('.pin-msg-btn').onclick = () => {
                pinMessage(msg.id);
                li.querySelector('.reaction-picker').classList.remove('show');
            };
        }

        // Highlight pinned
        if (currentPinnedMessage && currentPinnedMessage.id === msg.id) {
            li.classList.add('pinned');
        }
    }

    els.messageList.append(li);
    els.messageList.scrollTop = els.messageList.scrollHeight;
};

const updateOnlineList = (users) => {
    if (!users) return;
    els.onlineUsersDiv.innerHTML = users.map(u => {
        const name = typeof u === 'string' ? u : u.name;
        const status = u.status || 'online';
        return `<span title="${u.bio || ''}">● ${name}</span>`;
    }).join('');
};

// ===== POLLING =====
const poll = async () => {
    if (isPolling || !isJoined) return;
    isPolling = true;

    try {
        const res = await fetch(`/poll?roomId=${roomId}&passkey=${passkey}&username=${myUsername}&token=${sessionToken}`);

        if (res.status === 429) {
            updateStatusUI('Too many requests. Waiting...', 'error');
            pollDelay = Math.min(pollDelay * 1.5, MAX_POLL_DELAY);
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            pollFailCount++;
            if (pollFailCount > 3) {
                updateStatusUI('Connection lost. Retrying...', 'error');
                pollDelay = Math.min(pollDelay * 1.2, MAX_POLL_DELAY);
            }
            if (res.status === 403) {
                if (data.banned) alert('You have been banned from this room.');
                else alert('Session expired. Please join again.');
                window.location.reload();
            }
            return;
        }

        const data = await res.json();
        pollFailCount = 0;
        pollDelay = isTabActive ? 2000 : 10000;
        updateStatusUI(null);

        updateOnlineList(data.users);
        updateTypingIndicator(data.typing);
        updatePinnedMessage(data.pinnedMessage);
        isAdmin = data.isAdmin;

        if (isAdmin) {
            els.headerTitle.textContent = (roomId === 'world' ? '🌎 World Chat' : `Room: ${roomId}`) + ' [ADMIN]';
            if (data.passkey) {
                els.pkVal.textContent = data.passkey;
            }
            els.unpinBtn.style.display = currentPinnedMessage ? 'block' : 'none';
        }

        els.messageList.querySelectorAll('li.pending').forEach(el => el.remove());

        const shouldScroll = (els.messageList.scrollHeight - els.messageList.scrollTop - els.messageList.clientHeight) < 50;
        let hasNew = false;
        const messages = data.messages || [];

        if (messages.length === 0 && lastMessageId > 0 ||
            messages.length > 0 && messages[messages.length - 1].id < lastMessageId) {
            els.messageList.querySelectorAll('li:not(template)').forEach(el => el.remove());
            lastMessageId = -1;
        }

        messages.forEach(msg => {
            const existing = els.messageList.querySelector(`li[data-id="${msg.id}"]`);
            if (existing) {
                renderReactions(existing, msg.reactions);
                const readReceipt = msg.name === myUsername ?
                    `<span class="read-receipt ${msg.readBy?.length > 1 ? 'read' : ''}">✓${msg.readBy?.length > 1 ? '✓' : ''}</span>` : '';
                if (existing.querySelector('.read-receipt')) {
                    existing.querySelector('.read-receipt').className = `read-receipt ${msg.readBy?.length > 1 ? 'read' : ''}`;
                    existing.querySelector('.read-receipt').innerHTML = `✓${msg.readBy?.length > 1 ? '✓' : ''}`;
                }
                if (currentPinnedMessage && currentPinnedMessage.id === msg.id) existing.classList.add('pinned');
                else existing.classList.remove('pinned');
            } else if (msg.id > lastMessageId) {
                appendMessage(msg);
                lastMessageId = msg.id;
                hasNew = true;
                if (msg.content.includes(`@${myUsername}`)) {
                    sendNotification(`New mention in ${roomId}`, `${msg.name}: ${msg.content}`);
                    playSound();
                } else if (msg.name !== myUsername) {
                    sendNotification(`New message in ${roomId}`, `${msg.name}: ${msg.content}`);
                }
            }
        });

        if (hasNew && messages[messages.length - 1].name !== myUsername) playSound();
        const items = Array.from(els.messageList.querySelectorAll('li:not(template)'));
        if (items.length > 100) items.slice(0, items.length - 100).forEach(el => el.remove());
        if (shouldScroll && hasNew) els.messageList.scrollTop = els.messageList.scrollHeight;

        if (messages.length > 0) {
            fetch('/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, passkey, username: myUsername, lastRead: messages[messages.length - 1].id, token: sessionToken })
            }).catch(() => { });
        }
    } catch (e) {
        pollFailCount++;
        pollDelay = Math.min(pollDelay * 1.2, MAX_POLL_DELAY);
        if (pollFailCount > 3) updateStatusUI('Network error. Reconnecting...', 'error');
    } finally {
        isPolling = false;
    }
};

const updateStatusUI = (message, type = '') => {
    if (!message) {
        els.connectionStatus.style.display = 'none';
        return;
    }
    els.connectionStatus.textContent = message;
    els.connectionStatus.className = type;
    els.connectionStatus.style.display = 'block';
};

document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
    if (isTabActive && isJoined) poll();
});

const startPolling = () => {
    if (intervalId) clearTimeout(intervalId);
    const runPoll = async () => {
        await poll();
        intervalId = setTimeout(runPoll, pollDelay);
    };
    runPoll();
};

// ===== EVENT LISTENERS =====
els.setRoomBtn.addEventListener('click', () => {
    const val = els.initialRoomInput.value.trim();
    if (val) { roomId = val; showChatInterface(); }
});

els.initialRoomInput.addEventListener('keypress', (e) => e.key === 'Enter' && els.setRoomBtn.click());
$('world-chat-btn').addEventListener('click', () => { roomId = 'world'; showChatInterface(); });

els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameVal = els.nameInput.value.trim();
    const mainVal = els.mainInput.value.trim();

    if (!nameVal) return;
    if (isJoined && !mainVal) return;

    els.actionBtn.disabled = true;

    try {
        if (!isJoined) {
            const res = await fetch('/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, passkey: mainVal, username: nameVal, authToken })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    passkey = mainVal;
                    sessionToken = data.token;
                    isAdmin = !!data.isAdmin;
                    switchToChatMode();
                } else {
                    els.mainInput.value = '';
                    showFormStatus('Invalid passkey');
                }
            } else if (res.status === 403) {
                const data = await res.json();
                showFormStatus(data.error || 'Access denied');
                els.actionBtn.disabled = false;
                return;
            } else if (res.status === 409) {
                showFormStatus('Username already taken. Choose another.');
                els.actionBtn.disabled = false;
                els.nameInput.focus();
                return;
            } else {
                showFormStatus((await res.text()) || 'Join failed');
                els.mainInput.value = '';
            }
        } else {
            isTyping = false;
            clearTimeout(typingTimeout);
            sendTypingStatus(false);

            appendMessage({ name: nameVal, content: mainVal, pending: true, time: Date.now() / 1000 });
            els.mainInput.value = '';
            await fetch('/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, passkey, name: nameVal, content: mainVal, token: sessionToken })
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        els.actionBtn.disabled = false;
        els.mainInput.focus();
    }
});

els.logoutBtn.addEventListener('click', async () => {
    try {
        if (isJoined && myUsername) {
            await fetch('/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, passkey, username: myUsername, token: sessionToken }),
                keepalive: true
            });
        }
    } catch (e) { console.error(e); }
    window.location.href = window.location.pathname;
});

els.clearBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear the chat for everyone?')) return;
    try {
        await fetch('/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, passkey })
        });
        els.messageList.innerHTML = '';
        lastMessageId = -1;
    } catch (e) {
        console.error(e);
    }
});

// ===== INIT =====
roomId ? showChatInterface() : showRoomSelection();
setupUserBar();
initTheme();
