import { renderMarkdown, hasMarkdown } from './markdown.js';

// Lấy thông tin user từ HTML
const userInfo = document.getElementById('user-info');
const currentUserId = userInfo ? userInfo.dataset.id : null;
const currentUserName = userInfo ? userInfo.dataset.name : null;

// Hàm lấy cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Chỉ khởi tạo Socket nếu user đã đăng nhập
let socket = null;
if (currentUserId) {
    socket = io({ 
        auth: { 
            userId: currentUserId,
            token: getCookie('accessToken') 
        } 
    });
}

// State
let activeConversationId = null;
let isLoadingMore = false;
let hasMoreMessages = true;
let mediaRecorder = null;
let audioChunks = [];
let recordInterval = null;

// DOM Elements
const conversationList = document.getElementById('conversation-list');
const messagesList = document.getElementById('messages-list');
const chatWindow = document.getElementById('chat-window');
const noChatSelected = document.getElementById('no-chat-selected');
const activeChatTitle = document.getElementById('active-chat-title');
const activeChatAvatar = document.getElementById('active-chat-avatar');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');
const aiSuggestBtn = document.getElementById('ai-suggest-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const recordBtn = document.getElementById('record-btn');
const recordingStatus = document.getElementById('recording-status');
const recordingTime = document.getElementById('recording-time');

// Dropdown Actions
const leaveGroupBtn = document.getElementById('leave-group-btn');
const deleteGroupBtn = document.getElementById('delete-group-btn');
const botToggleBtn = document.getElementById('bot-toggle-btn');

/**
 * Hàm helper để format thời gian an toàn
 */
function formatTime(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Vừa xong';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Hiển thị tin nhắn
 */
function appendMessage(msg, prepend = false) {
    const deletedFor = msg.deleted_for || [];
    if (deletedFor.includes(currentUserId)) return;

    const isMe = msg.sender_id === currentUserId;
    const isSystem = msg.type === 'system';
    
    const msgTime = formatTime(msg.createdAt || msg.created_at);
    
    let contentHtml = '';
    if (msg.is_recalled) {
        contentHtml = `Tin nhắn đã bị thu hồi`;
    } else {
        if (msg.type === 'image') {
            contentHtml = `<img src="${msg.content}" class="img-fluid rounded mt-2" style="max-height: 300px; cursor: pointer;" onclick="window.open(this.src)">`;
        } else if (msg.type === 'audio') {
            contentHtml = `<audio controls class="mt-2" src="${msg.content}"></audio>`;
        } else {
            // Nếu text có chứa markdown syntax → parse, không thì render plain
            if (hasMarkdown(msg.content)) {
                contentHtml = `<div class="msg-markdown">${renderMarkdown(msg.content)}</div>`;
            } else {
                contentHtml = `<span>${msg.content}</span>`;
            }
        }
    }

    let msgHtml = '';
    if (isSystem) {
        msgHtml = `<div class="msg-system"><em><strong>${msg.sender?.display_name || 'Hệ thống'}</strong> ${msg.content}</em></div>`;
    } else {
        msgHtml = `
            <div class="msg-wrapper ${isMe ? 'msg-right-wrapper' : 'msg-left-wrapper'}" data-msg-id="${msg.id}">
                ${!isMe && !msg.is_recalled ? `<div class="msg-info"><strong>${msg.sender?.display_name || 'Người dùng'}</strong></div>` : ''}
                <div class="msg-bubble ${isMe ? 'msg-right' : 'msg-left'} ${msg.is_recalled ? 'msg-recalled' : ''}">
                    ${contentHtml}
                </div>
                <div class="msg-info opacity-75">${msgTime}</div>
                ${!msg.is_recalled ? `
                    <div class="msg-actions">
                        ${isMe ? `<button onclick="recallMessage('${msg.id}')" title="Thu hồi"><i class="fas fa-undo"></i></button>` : ''}
                        <button onclick="deleteMessageForMe('${msg.id}')" title="Xóa phía tôi"><i class="fas fa-trash"></i></button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    if (prepend) {
        const oldHeight = messagesList.scrollHeight;
        messagesList.insertAdjacentHTML('afterbegin', msgHtml);
        messagesList.scrollTop = messagesList.scrollHeight - oldHeight;
    } else {
        messagesList.insertAdjacentHTML('beforeend', msgHtml);
        messagesList.scrollTop = messagesList.scrollHeight;
    }
}

/**
 * Load tin nhắn
 */
async function loadMessages(conversationId, beforeId = null) {
    if (isLoadingMore) return;
    isLoadingMore = true;

    try {
        const url = `/api/chat/conversations/${conversationId}/messages?limit=20${beforeId ? `&beforeId=${beforeId}` : ''}`;
        const response = await fetch(url);
        const messages = await response.json();
        
        if (messages.length < 20) hasMoreMessages = false;
        else hasMoreMessages = true;

        if (!beforeId) messagesList.innerHTML = '';
        messages.forEach(msg => appendMessage(msg, Boolean(beforeId)));
        if (!beforeId) messagesList.scrollTop = messagesList.scrollHeight;
    } catch (error) { console.error('Lỗi load tin nhắn:', error); } finally {
        isLoadingMore = false;
    }
}

// --- Event Listeners ---

if (messagesList) {
    messagesList.addEventListener('scroll', () => {
        if (messagesList.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
            const firstMsg = messagesList.querySelector('.msg-wrapper, .msg-system');
            const beforeId = firstMsg ? firstMsg.dataset.msgId : null;
            if (beforeId) loadMessages(activeConversationId, beforeId);
        }
    });
}

if (conversationList) {
    conversationList.addEventListener('click', (e) => {
        const item = e.target.closest('.conv-item');
        if (!item) return;

        document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        activeConversationId = item.dataset.id;
        hasMoreMessages = true;
        
        activeChatTitle.innerText = item.querySelector('h6').innerText;
        activeChatAvatar.innerText = item.querySelector('.user-badge').innerText;
        
        noChatSelected.classList.add('d-none');
        chatWindow.classList.remove('d-none');
        chatWindow.classList.add('d-flex');

        if(socket) socket.emit('room:join', activeConversationId);
        loadMessages(activeConversationId);

        const isGroup = item.dataset.type === 'group';
        const isOwner = item.dataset.owner === currentUserId;
        const botActive = item.dataset.bot === 'true';
        updateDropdownUI(isGroup, isOwner, botActive);
    });
}

function updateDropdownUI(isGroup, isOwner, botActive) {
    if(leaveGroupBtn) leaveGroupBtn.style.display = isGroup ? 'block' : 'none';
    if(deleteGroupBtn) deleteGroupBtn.style.display = (isGroup && isOwner) ? 'block' : 'none';
    if(botToggleBtn) {
        botToggleBtn.style.display = 'block';
        botToggleBtn.innerHTML = botActive ? 
            '<i class="fas fa-robot me-2 text-success"></i>Tắt AI Bot' : 
            '<i class="fas fa-robot me-2 text-muted"></i>Bật AI Bot';
        botToggleBtn.dataset.active = botActive;
    }
}

// --- Bot Toggle ---
if (botToggleBtn) {
    botToggleBtn.addEventListener('click', async () => {
        const currentActive = botToggleBtn.dataset.active === 'true';
        const newActive = !currentActive;
        const res = await fetch(`/api/chat/conversations/${activeConversationId}/bot`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: newActive })
        });
        const data = await res.json();
        if (data.success) {
            botToggleBtn.dataset.active = newActive;
            botToggleBtn.innerHTML = newActive ? 
                '<i class="fas fa-robot me-2 text-success"></i>Tắt AI Bot' : 
                '<i class="fas fa-robot me-2 text-muted"></i>Bật AI Bot';
            const convItem = document.querySelector(`.conv-item[data-id="${activeConversationId}"]`);
            if (convItem) convItem.dataset.bot = newActive;
        }
    });
}

// --- Group Actions ---
if (leaveGroupBtn) {
    leaveGroupBtn.addEventListener('click', async () => {
        if (!confirm('Bạn muốn rời nhóm?')) return;
        await fetch(`/api/chat/conversations/${activeConversationId}/leave`, { method: 'POST' });
        window.location.reload();
    });
}

if (deleteGroupBtn) {
    deleteGroupBtn.addEventListener('click', async () => {
        if (!confirm('Giải tán nhóm?')) return;
        await fetch(`/api/chat/conversations/${activeConversationId}`, { method: 'DELETE' });
        window.location.reload();
    });
}

// --- Recall / Delete ---
window.recallMessage = async function(messageId) {
    if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) return;
    const res = await fetch(`/api/chat/messages/${messageId}/recall`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success && socket) socket.emit('message:recall', { conversationId: activeConversationId, messageId });
    else alert(data.error || 'Lỗi thu hồi');
}

window.deleteMessageForMe = async function(messageId) {
    if (!confirm('Xóa tin nhắn này phía bạn?')) return;
    await fetch(`/api/chat/messages/${messageId}/me`, { method: 'DELETE' });
    const el = document.querySelector(`[data-msg-id="${messageId}"]`);
    if (el) el.remove();
}

// --- Form Submit ---
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = msgInput.value.trim();
        if (!content || !activeConversationId || !socket) return;
        socket.emit('message:send', { conversationId: activeConversationId, content, type: 'text' });
        msgInput.value = '';
        msgInput.focus();
    });
}

// --- Socket Listeners ---
if (socket) {
    socket.on('message:new', (msg) => {
        if (msg.conversation_id === activeConversationId) appendMessage(msg);
    });

    socket.on('message:recalled', ({ messageId }) => {
        const wrapper = document.querySelector(`[data-msg-id="${messageId}"]`);
        if (wrapper) {
            const bubble = wrapper.querySelector('.msg-bubble');
            bubble.classList.add('msg-recalled');
            bubble.innerHTML = 'Tin nhắn đã bị thu hồi';
            const actions = wrapper.querySelector('.msg-actions');
            if (actions) actions.remove();
        }
    });
}

// --- Multimedia ---
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !activeConversationId) return;
        const formData = new FormData();
        formData.append('file', file);
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if(socket) socket.emit('message:send', { conversationId: activeConversationId, content: data.url, type: 'image' });
        } catch(err) { alert('Lỗi upload'); }
        finally {
            uploadBtn.innerHTML = '<i class="fas fa-image"></i>';
            fileInput.value = '';
        }
    });
}

// --- Recording ---
if (recordBtn) {
    recordBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording();
        else startRecording();
    });
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if(socket) socket.emit('message:send', { conversationId: activeConversationId, content: data.url, type: 'audio' });
        };
        mediaRecorder.start();
        recordBtn.classList.replace('btn-outline-secondary', 'btn-danger');
        recordingStatus.classList.remove('d-none');
        let sec = 0;
        recordInterval = setInterval(() => {
            sec++;
            recordingTime.innerText = `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`;
        }, 1000);
    } catch (err) { alert('Không thể truy cập Microphone'); }
}

function stopRecording() {
    if(mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    clearInterval(recordInterval);
    if(recordBtn) recordBtn.classList.replace('btn-danger', 'btn-outline-secondary');
    if(recordingStatus) recordingStatus.classList.add('d-none');
}

// --- AI Suggest ---
if (aiSuggestBtn) {
    aiSuggestBtn.addEventListener('click', async () => {
        if (!activeConversationId) return;
        aiSuggestBtn.disabled = true;
        aiSuggestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        const response = await fetch(`/api/chat/conversations/${activeConversationId}/suggest`);
        const data = await response.json();
        if (data.suggestion) { msgInput.value = data.suggestion; msgInput.focus(); }
        aiSuggestBtn.disabled = false; aiSuggestBtn.innerHTML = '<i class="fas fa-magic"></i>';
    });
}

// --- New Chat/Group Init ---
document.querySelectorAll('.start-chat-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        await fetch('/api/chat/conversations/private', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: btn.dataset.userId })
        });
        window.location.reload();
    });
});

const createGroupForm = document.getElementById('create-group-form');
if (createGroupForm) {
    createGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('group-title').value;
        const memberIds = Array.from(document.querySelectorAll('.member-checkbox:checked')).map(cb => cb.value);
        if (memberIds.length === 0) return alert('Chọn thành viên');
        await fetch('/api/chat/conversations/group', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, memberIds })
        });
        window.location.reload();
    });
}