const BEEP_URL = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABSwAHCwsVFRkZHR0hISkpLS0xMTU1OTk9PUFBRUVJSU1NUVFVVVlZWlpeXmJiZmZqam5ucnJ6en5+goKGhpiYmZmdnZ+foaGkpKWlqKiorKywMDMzOTk9PT5+foSEjIyVlZaWnZ2hoaWlqamwsLW1u7vAwMjIzMzQ0NXV2trg4OTk7Ozw8Pb2+vr///8AAAA5TGF2YzU5LjM3AAAAAAAAAAAAAAAAJAAAAAAAAAAAASwAAAAAAAABSvyqfQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQzAABAAAB4AAAAOIABBwAAAEETGF2YzU5LjM3AAAh+gAAASwAAAAAAAAAABF//uQzAAD/8AAAaQAAAAgAAA0gAAAB5B/8HwHwHgPgPAP/8AAf/4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/+A//4D//gP/8AAAAAD/8AAAA";

let roomId = new URLSearchParams(window.location.search).get('room');
let passkey = '', myUsername = '', isJoined = false, lastMessageId = -1, isPolling = false;
const audioObj = new Audio(BEEP_URL);

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);

const els = {
    roomSelection: $('room-selection'), chatInterface: $('chat-interface'),
    setRoomBtn: $('set-room-btn'), initialRoomInput: $('initial-room-input'),
    headerTitle: $('header-title'), form: $('chat-form'),
    nameInput: $$('input[name="name"]'), mainInput: $('main-input'),
    actionBtn: $('action-btn'), messageList: $$('ul#messages'),
    roomControls: $('room-controls'), pkVal: $('pk-val'),
    soundToggle: $('sound-toggle'), clearBtn: $('clear-btn'),
    logoutBtn: $('logout-btn'), onlineUsersDiv: $('online-users'),
    formStatus: $('form-status')
};

const showFormStatus = (msg) => {
    els.formStatus.textContent = msg;
    setTimeout(() => els.formStatus.textContent = '', 3000);
};

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
        type: 'password', name: 'passkey', placeholder: 'Room Passkey',
        disabled: false, value: ''
    });

    if (roomId === 'world') {
        els.mainInput.style.display = 'none';
        els.actionBtn.textContent = 'Join World';
    } else {
        els.mainInput.style.display = 'block';
        els.actionBtn.textContent = 'Join';
    }

    els.actionBtn.disabled = false;
    els.roomControls.style.display = 'none';
    els.onlineUsersDiv.style.display = 'none';
    els.messageList.innerHTML = '<li id="status-message">Please join the room...</li><template><li class=pending><small>…</small><span class="msg-content">…</span></li></template>';
    lastMessageId = -1;
    els.nameInput.focus();
};

const switchToChatMode = () => {
    isJoined = true;
    myUsername = els.nameInput.value.trim();
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

const playSound = () => els.soundToggle.checked && audioObj.play().catch(() => { });

const appendMessage = (msg) => {
    const template = els.messageList.querySelector('template');
    if (!template) return;
    const li = template.content.cloneNode(true).querySelector('li');

    if (msg.pending) {
        li.classList.add('pending');
        li.querySelector('small').textContent = msg.name;
        li.querySelector('.msg-content').textContent = msg.content;
    } else {
        li.classList.remove('pending');
        const timeStr = new Date(msg.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        li.querySelector('small').innerHTML = `<b>${msg.name}</b> <span style="opacity:0.8; font-weight:normal;">${timeStr}</span>`;
        li.querySelector('.msg-content').textContent = msg.content;
        li.dataset.id = msg.id;
        li.dataset.user = msg.name;
    }

    els.messageList.append(li);
    els.messageList.scrollTop = els.messageList.scrollHeight;
};

const updateOnlineList = (users) => {
    if (!users) return;
    els.onlineUsersDiv.innerHTML = users.map(u => `<span>● ${u}</span>`).join('');
};

const poll = async () => {
    if (!isJoined || isPolling) return;
    isPolling = true;

    try {
        const url = `/poll?roomId=${encodeURIComponent(roomId)}&passkey=${encodeURIComponent(passkey)}&username=${encodeURIComponent(myUsername)}`;
        const res = await fetch(url);

        if (res.status === 403) {
            isJoined = false;
            alert('Session expired or invalid passkey.');
            window.location.reload();
            return;
        }

        if (res.ok) {
            const { messages = [], users = [] } = await res.json();
            updateOnlineList(users);
            els.messageList.querySelectorAll('li.pending').forEach(el => el.remove());

            const shouldScroll = (els.messageList.scrollHeight - els.messageList.scrollTop - els.messageList.clientHeight) < 50;
            let hasNew = false;

            if (messages.length === 0 && lastMessageId > 0 ||
                messages.length > 0 && messages[messages.length - 1].id < lastMessageId) {
                els.messageList.querySelectorAll('li:not(template)').forEach(el => el.remove());
                lastMessageId = -1;
            }

            messages.forEach(msg => {
                if (msg.id > lastMessageId) {
                    appendMessage(msg);
                    lastMessageId = msg.id;
                    hasNew = true;
                }
            });

            if (hasNew && messages[messages.length - 1].name !== myUsername) playSound();

            const items = Array.from(els.messageList.querySelectorAll('li:not(template)'));
            if (items.length > 100) items.slice(0, items.length - 100).forEach(el => el.remove());

            if (shouldScroll && hasNew) els.messageList.scrollTop = els.messageList.scrollHeight;
        }
    } catch (e) {
        console.log('Poll error (ignored)', e);
    } finally {
        isPolling = false;
    }
};

const startPolling = () => {
    poll();
    setInterval(poll, 2000);
};

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
    if (!isJoined && roomId !== 'world' && !mainVal) return;

    els.actionBtn.disabled = true;

    try {
        if (!isJoined) {
            const res = await fetch('/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, passkey: mainVal, username: nameVal })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) { passkey = mainVal; switchToChatMode(); }
                else { els.mainInput.value = ''; showFormStatus('Invalid passkey'); }
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
            appendMessage({ name: nameVal, content: mainVal, pending: true, time: Date.now() / 1000 });
            els.mainInput.value = '';
            await fetch('/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, passkey, name: nameVal, content: mainVal })
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
                body: JSON.stringify({ roomId, passkey, username: myUsername }),
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
        els.messageList.innerHTML = '<template><li class=pending><small>…</small><span class="msg-content">…</span></li></template>';
        lastMessageId = -1;
    } catch (e) {
        console.error(e);
    }
});

roomId ? showChatInterface() : showRoomSelection();
