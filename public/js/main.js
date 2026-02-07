(() => {
  // src/js/main.js
  var userInfo = document.getElementById("user-info");
  var currentUserId = userInfo.dataset.id;
  var currentUserName = userInfo.dataset.name;
  var socket = io({
    auth: { userId: currentUserId }
  });
  var activeConversationId = null;
  var conversationList = document.getElementById("conversation-list");
  var messagesList = document.getElementById("messages-list");
  var chatWindow = document.getElementById("chat-window");
  var noChatSelected = document.getElementById("no-chat-selected");
  var activeChatTitle = document.getElementById("active-chat-title");
  var activeChatAvatar = document.getElementById("active-chat-avatar");
  var chatForm = document.getElementById("chat-form");
  var msgInput = document.getElementById("msg-input");
  var aiSuggestBtn = document.getElementById("ai-suggest-btn");
  function appendMessage(msg) {
    const isMe = msg.sender_id === currentUserId;
    const isSystem = msg.type === "system";
    let msgHtml = "";
    if (isSystem) {
      msgHtml = `<div class="msg-system text-center my-2 small text-muted"><em><strong>${msg.sender?.display_name || "H\u1EC7 th\u1ED1ng"}</strong> ${msg.content}</em></div>`;
    } else {
      msgHtml = `
            <div class="msg-bubble ${isMe ? "msg-right" : "msg-left"}">
                ${!isMe ? `<div class="msg-info"><strong>${msg.sender?.display_name || "Ng\u01B0\u1EDDi d\xF9ng"}</strong></div>` : ""}
                <div>${msg.content}</div>
                <div class="msg-info text-end small opacity-75">${new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
        `;
    }
    messagesList.insertAdjacentHTML("beforeend", msgHtml);
    messagesList.scrollTop = messagesList.scrollHeight;
  }
  async function loadMessages(conversationId) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const messages = await response.json();
      messagesList.innerHTML = "";
      messages.forEach((msg) => appendMessage(msg));
      messagesList.scrollTop = messagesList.scrollHeight;
    } catch (error) {
      console.error("L\u1ED7i khi load tin nh\u1EAFn:", error);
    }
  }
  if (conversationList) {
    conversationList.addEventListener("click", (e) => {
      const item = e.target.closest(".conv-item");
      if (!item) return;
      document.querySelectorAll(".conv-item").forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
      activeConversationId = item.dataset.id;
      const title = item.querySelector("h6").innerText;
      const avatar = item.querySelector(".user-badge").innerText;
      activeChatTitle.innerText = title;
      activeChatAvatar.innerText = avatar;
      noChatSelected.classList.add("d-none");
      chatWindow.classList.remove("d-none");
      chatWindow.classList.add("d-flex");
      socket.emit("room:join", activeConversationId);
      loadMessages(activeConversationId);
    });
  }
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const content = msgInput.value.trim();
      if (!content || !activeConversationId) return;
      socket.emit("message:send", {
        conversationId: activeConversationId,
        content,
        type: "text"
      });
      msgInput.value = "";
      msgInput.focus();
    });
  }
  if (aiSuggestBtn) {
    aiSuggestBtn.addEventListener("click", async () => {
      if (!activeConversationId) return alert("Vui l\xF2ng ch\u1ECDn m\u1ED9t cu\u1ED9c h\u1ED9i tho\u1EA1i");
      aiSuggestBtn.disabled = true;
      aiSuggestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      try {
        const response = await fetch(`/api/conversations/${activeConversationId}/suggest`);
        const data = await response.json();
        if (data.suggestion) {
          msgInput.value = data.suggestion;
          msgInput.focus();
        } else {
          alert("AI kh\xF4ng th\u1EC3 \u0111\u01B0a ra g\u1EE3i \xFD l\xFAc n\xE0y.");
        }
      } catch (error) {
        console.error("L\u1ED7i l\u1EA5y g\u1EE3i \xFD AI:", error);
        alert("C\xF3 l\u1ED7i x\u1EA3y ra khi g\u1ECDi AI.");
      } finally {
        aiSuggestBtn.disabled = false;
        aiSuggestBtn.innerHTML = '<i class="fas fa-robot"></i>';
      }
    });
  }
  socket.on("message:new", (msg) => {
    if (msg.conversation_id === activeConversationId) {
      appendMessage(msg);
    }
  });
  socket.on("user:status", (data) => {
    console.log("Tr\u1EA1ng th\xE1i user thay \u0111\u1ED5i:", data);
  });
  socket.on("error", (err) => {
    alert(err.message);
  });
  document.querySelectorAll(".start-chat-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetUserId = btn.dataset.userId;
      try {
        const response = await fetch("/api/conversations/private", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId })
        });
        await response.json();
        window.location.reload();
      } catch (error) {
        console.error("L\u1ED7i khi t\u1EA1o chat m\u1EDBi:", error);
      }
    });
  });
  var createGroupForm = document.getElementById("create-group-form");
  if (createGroupForm) {
    createGroupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("group-title").value;
      const memberCheckboxes = document.querySelectorAll(".member-checkbox:checked");
      const memberIds = Array.from(memberCheckboxes).map((cb) => cb.value);
      if (memberIds.length === 0) {
        return alert("Vui l\xF2ng ch\u1ECDn \xEDt nh\u1EA5t m\u1ED9t th\xE0nh vi\xEAn");
      }
      try {
        const response = await fetch("/api/conversations/group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, memberIds })
        });
        await response.json();
        window.location.reload();
      } catch (error) {
        console.error("L\u1ED7i khi t\u1EA1o nh\xF3m:", error);
      }
    });
  }
})();
//# sourceMappingURL=main.js.map
