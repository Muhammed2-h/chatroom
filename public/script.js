// Premium Chat Logic
const BEEP_URL = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

// Auth state
const authToken = localStorage.getItem('authToken');
const savedDisplayName = localStorage.getItem('displayName');

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);

const els = {
    roomSelection: $('room-selection'),
    chatInterface: $('chat-interface'),
    roomInput: $('room-input'),
    nameInput: $('name-input'),
    joinBtn: $('join-room-btn'),
    headerTitle: $('header-title'),
    mainInput: $('main-input'),
    actionBtn: $('action-btn'),
    messageList: $('messages'),
    pkVal: $('pk-val'),
    clearBtn: $('clear-btn'),
    onlineUsersDiv: $('online-users'),
    formStatus: $('form-status'),
    typingIndicator: $('typing-indicator'),
    pinnedBar: $('pinned-message-bar'),
    pinnedContent: $('pinned-message-content'),
    unpinBtn: $('unpin-btn'),
    connectionStatus: $('connection-status'),
    settingsBtn: $('settings-btn'),
    settingsModal: $('settings-modal'),
    closeSettings: $('close-settings'),
    darkModeToggle: $('dark-mode-toggle'),
    notifToggle: $('notifications-toggle')
};

let roomId = new URLSearchParams(window.location.search).get('room');
let passkey = '', myUsername = '', sessionToken = '', isJoined = false, lastMessageId = -1, isPolling = false, isAdmin = false;
let typingTimeout = null, isTyping = false, currentPinnedMessage = null;
let pollFailCount = 0, pollDelay = 2000, isTabActive = true;

// ===== THEME & INIT =====
const init = () => {
    // Dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
        els.darkModeToggle.checked = true;
    }

    // Auto-fill identity
    if (savedDisplayName && authToken) {
        els.nameInput.value = savedDisplayName;
        $('user-display-name').textContent = savedDisplayName;
        $('logged-in-badge').style.display = 'inline-block';
        $('guest-badge').style.display = 'none';
    } else {
        const guestName = localStorage.getItem('guestName');
        if (guestName) els.nameInput.value = guestName;
    }

    // Initial view
    if (roomId) {
        els.roomInput.value = roomId;
        showChatInterface();
    } else {
        els.roomSelection.style.display = 'flex';
        els.chatInterface.style.display = 'none';
    }

    setupEventListeners();
    setupUserBar();
};

const setupEventListeners = () => {
    els.joinBtn.addEventListener('click', joinRoom);
    els.actionBtn.addEventListener('click', sendMessage);
    els.mainInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

    // Settings
    els.settingsBtn.addEventListener('click', () => els.settingsModal.style.display = 'flex');
    els.closeSettings.addEventListener('click', () => els.settingsModal.style.display = 'none');
    els.darkModeToggle.addEventListener('change', (e) => {
        document.documentElement.classList.toggle('dark', e.target.checked);
        localStorage.setItem('darkMode', e.target.checked);
    });

    els.clearBtn.addEventListener('click', clearHistory);
    els.unpinBtn.addEventListener('click', unpinMessage);

    window.addEventListener('focus', () => { isTabActive = true; pollDelay = 2000; });
    window.addEventListener('blur', () => { isTabActive = false; pollDelay = 5000; });

    els.mainInput.addEventListener('input', handleTyping);
};

// ===== ROOM LOGIC =====
const showChatInterface = () => {
    roomId = els.roomInput.value.trim() || 'world';
    els.roomSelection.style.display = 'none';
    els.chatInterface.style.display = 'flex';
    els.headerTitle.textContent = roomId === 'world' ? '🌍 World Chat' : `Room: ${roomId}`;

    // Auto Join logic for World
    if (roomId === 'world' && els.nameInput.value.trim()) {
        if (authToken || localStorage.getItem('guestName')) {
            joinRoom();
        }
    }

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('room', roomId);
    window.history.pushState({}, '', url);
};

const joinRoom = async () => {
    myUsername = els.nameInput.value.trim();
    roomId = els.roomInput.value.trim() || 'world';

    if (!myUsername) return showStatus('Please enter a name');

    try {
        const res = await fetch('/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, username: myUsername, authToken, passkey })
        });
        const data = await res.json();

        if (res.ok) {
            sessionToken = data.token;
            isJoined = true;
            isAdmin = data.isAdmin;
            if (!authToken) localStorage.setItem('guestName', myUsername);

            switchToChatMode();
            startPolling();
        } else {
            showStatus(data.error);
            if (data.error.includes('passkey')) {
                const pk = prompt('Enter Room Passkey:');
                if (pk !== null) { passkey = pk; joinRoom(); }
            }
        }
    } catch (e) {
        showStatus('Connection failed');
    }
};

const switchToChatMode = () => {
    els.messageList.innerHTML = '';
    els.mainInput.placeholder = `Message as ${myUsername}...`;
    els.mainInput.focus();
    if (isAdmin) els.clearBtn.style.display = 'block';
    else els.clearBtn.style.display = 'none';

    if (roomId === 'world') {
        els.clearBtn.style.display = 'none';
        $('passkey-display').style.display = 'none';
    } else {
        $('passkey-display').style.display = 'flex';
    }
};

// ===== MESSAGING =====
const sendMessage = async () => {
    const content = els.mainInput.value.trim();
    if (!content || !isJoined) return;

    els.mainInput.value = '';

    // Optimistic UI
    const tempId = Date.now();
    appendMessage({ name: myUsername, content, time: tempId, id: tempId, pending: true });

    try {
        await fetch('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, passkey, username: myUsername, content, token: sessionToken })
        });
    } catch (e) {
        showStatus('Failed to send');
    }
};

const appendMessage = (msg) => {
    const isMine = msg.name === myUsername;
    const li = document.createElement('li');
    li.className = isMine ? 'message-mine' : 'message-other';
    if (msg.pending) li.classList.add('pending');
    li.dataset.id = msg.id;

    const timeStr = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    li.innerHTML = `
        <b>${msg.name}</b>
        <div class="msg-content">${msg.content}</div>
        <div style="font-size: 0.65em; opacity: 0.5; margin-top: 4px; text-align: right;">${timeStr}</div>
    `;

    els.messageList.appendChild(li);
    els.messageList.scrollTop = els.messageList.scrollHeight;
};

// ===== POLLING =====
const poll = async () => {
    if (!isJoined || isPolling) return;
    isPolling = true;

    try {
        const res = await fetch(`/poll?roomId=${roomId}&passkey=${passkey}&username=${myUsername}&token=${sessionToken}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        pollFailCount = 0;
        updateUI(data);
    } catch (e) {
        pollFailCount++;
        if (pollFailCount > 3) updateConnectionStatus('Reconnecting...', true);
    } finally {
        isPolling = false;
        setTimeout(poll, pollDelay);
    }
};

const updateUI = (data) => {
    updateOnlineList(data.users);
    updateTyping(data.typing);
    updatePinned(data.pinnedMessage);

    const newMessages = (data.messages || []).filter(m => m.id > lastMessageId);
    if (newMessages.length > 0) {
        // Clear pending optimistic messages
        els.messageList.querySelectorAll('li.pending').forEach(el => el.remove());

        newMessages.forEach(msg => {
            appendMessage(msg);
            lastMessageId = Math.max(lastMessageId, msg.id);
        });

        if (newMessages[newMessages.length - 1].name !== myUsername) playSound();
    }
};

const updateOnlineList = (users) => {
    els.onlineUsersDiv.innerHTML = (users || []).map(u => `
        <div class="user-tag">${u.name}</div>
    `).join('');
};

const updateTyping = (typing) => {
    const others = (typing || []).filter(u => u !== myUsername);
    els.typingIndicator.textContent = others.length > 0 ? `${others.join(', ')} is typing...` : '';
};

const updatePinned = (pinned) => {
    if (pinned) {
        els.pinnedBar.style.display = 'flex';
        els.pinnedContent.textContent = pinned.content;
    } else {
        els.pinnedBar.style.display = 'none';
    }
};

// ===== HELPERS =====
const showStatus = (msg) => {
    els.formStatus.textContent = msg;
    setTimeout(() => els.formStatus.textContent = '', 3000);
};

const updateConnectionStatus = (msg, isError) => {
    els.connectionStatus.textContent = msg;
    els.connectionStatus.style.display = msg ? 'block' : 'none';
    els.connectionStatus.className = isError ? 'error' : '';
};

const handleTyping = () => {
    if (!isTyping) {
        isTyping = true;
        sendTypingStatus(true);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        sendTypingStatus(false);
    }, 2000);
};

const sendTypingStatus = (typing) => {
    fetch('/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, passkey, username: myUsername, token: sessionToken, typing })
    });
};

const playSound = () => {
    new Audio(BEEP_URL).play().catch(() => { });
};

const setupUserBar = () => {
    $('signout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('displayName');
        window.location.href = '/login.html';
    });
};

const clearHistory = async () => {
    if (!confirm('Clear all messages in this room?')) return;
    await fetch('/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, passkey, username: myUsername, token: sessionToken })
    });
};

const unpinMessage = async () => {
    await fetch('/unpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, passkey, username: myUsername, token: sessionToken })
    });
};

const startPolling = () => {
    poll();
};

init();
