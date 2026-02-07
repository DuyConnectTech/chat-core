// Lấy thông tin user từ HTML
const userInfo = document.getElementById('user-info');
const currentUserId = userInfo.dataset.id;
const currentUserName = userInfo.dataset.name;

// Khởi tạo Socket.io với userId để xác thực
const socket = io({
    auth: { userId: currentUserId }
});

// State quản lý chat hiện tại
let activeConversationId = null;

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

/**
 * Hiển thị tin nhắn lên màn hình
 */
function appendMessage(msg) {
    const isMe = msg.sender_id === currentUserId;
    const isSystem = msg.type === 'system';
    
    let msgHtml = '';
    
    if (isSystem) {
        msgHtml = `<div class="msg-system text-center my-2 small text-muted"><em><strong>${msg.sender?.display_name || 'Hệ thống'}</strong> ${msg.content}</em></div>`;
    } else {
        msgHtml = `
            <div class="msg-bubble ${isMe ? 'msg-right' : 'msg-left'}">
                ${!isMe ? `<div class="msg-info"><strong>${msg.sender?.display_name || 'Người dùng'}</strong></div>` : ''}
                <div>${msg.content}</div>
                <div class="msg-info text-end small opacity-75">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `;
    }
    
    messagesList.insertAdjacentHTML('beforeend', msgHtml);
    messagesList.scrollTop = messagesList.scrollHeight;
}

/**
 * Load tin nhắn của một cuộc hội thoại
 */
async function loadMessages(conversationId) {
    try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        const messages = await response.json();
        
        messagesList.innerHTML = '';
        messages.forEach(msg => appendMessage(msg));
        messagesList.scrollTop = messagesList.scrollHeight;
    } catch (error) {
        console.error('Lỗi khi load tin nhắn:', error);
    }
}

/**
 * Xử lý chọn cuộc hội thoại
 */
if (conversationList) {
    conversationList.addEventListener('click', (e) => {
        const item = e.target.closest('.conv-item');
        if (!item) return;

        // UI Updates
        document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        activeConversationId = item.dataset.id;
        const title = item.querySelector('h6').innerText;
        const avatar = item.querySelector('.user-badge').innerText;

        activeChatTitle.innerText = title;
        activeChatAvatar.innerText = avatar;
        
        noChatSelected.classList.add('d-none');
        chatWindow.classList.remove('d-none');
        chatWindow.classList.add('d-flex');

        // Socket: Join room
        socket.emit('room:join', activeConversationId);

        // Load data
        loadMessages(activeConversationId);
    });
}

/**
 * Gửi tin nhắn
 */
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = msgInput.value.trim();
        if (!content || !activeConversationId) return;

        // Gửi qua socket
        socket.emit('message:send', {
            conversationId: activeConversationId,
            content: content,
            type: 'text'
        });

        msgInput.value = '';
        msgInput.focus();
    });
}

/**
 * Xử lý Gợi ý AI
 */
if (aiSuggestBtn) {
    aiSuggestBtn.addEventListener('click', async () => {
        if (!activeConversationId) return alert('Vui lòng chọn một cuộc hội thoại');

        aiSuggestBtn.disabled = true;
        aiSuggestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`/api/conversations/${activeConversationId}/suggest`);
            const data = await response.json();
            
            if (data.suggestion) {
                msgInput.value = data.suggestion;
                msgInput.focus();
            } else {
                alert('AI không thể đưa ra gợi ý lúc này.');
            }
        } catch (error) {
            console.error('Lỗi lấy gợi ý AI:', error);
            alert('Có lỗi xảy ra khi gọi AI.');
        } finally {
            aiSuggestBtn.disabled = false;
            aiSuggestBtn.innerHTML = '<i class="fas fa-robot"></i>';
        }
    });
}

/**
 * Socket Listeners
 */
socket.on('message:new', (msg) => {
    if (msg.conversation_id === activeConversationId) {
        appendMessage(msg);
    }
});

socket.on('user:status', (data) => {
    console.log('Trạng thái user thay đổi:', data);
    // Có thể cập nhật UI dấu chấm xanh ở đây
});

socket.on('error', (err) => {
    alert(err.message);
});

/**
 * Bắt đầu chat 1-1 từ Modal
 */
document.querySelectorAll('.start-chat-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const targetUserId = btn.dataset.userId;
        try {
            const response = await fetch('/api/conversations/private', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });
            await response.json();
            window.location.reload();
        } catch (error) {
            console.error('Lỗi khi tạo chat mới:', error);
        }
    });
});

/**
 * Xử lý tạo nhóm
 */
const createGroupForm = document.getElementById('create-group-form');
if (createGroupForm) {
    createGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('group-title').value;
        const memberCheckboxes = document.querySelectorAll('.member-checkbox:checked');
        const memberIds = Array.from(memberCheckboxes).map(cb => cb.value);

        if (memberIds.length === 0) {
            return alert('Vui lòng chọn ít nhất một thành viên');
        }

        try {
            const response = await fetch('/api/conversations/group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, memberIds })
            });
            await response.json();
            window.location.reload();
        } catch (error) {
            console.error('Lỗi khi tạo nhóm:', error);
        }
    });
}
