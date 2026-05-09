import AbstractView from "./AbstractView.js";
import Message from "./Message.js";
import { customFetch, handleFormSubmit } from "../utils.js";

// Throttle utility (leading + trailing)
function throttle(fn, interval) {
  let lastRun = 0;
  let timeout;

  return function (...args) {
    const now = Date.now();
    const remaining = interval - (now - lastRun);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastRun = now;
      fn.apply(this, args);
      return;
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        lastRun = Date.now();
        timeout = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

function debounce(fn, delay) {
  let timeout;

  return function (...args) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

const CHAT_PAGE_SIZE = 10;
const CHAT_SCROLL_TOP_THRESHOLD_PX = 40;
const CHAT_SCROLL_THROTTLE_MS = 300;
const CHAT_SCROLL_DEBOUNCE_MS = 120;

export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.chatterId = null;
    this.user = null;
    this.currentPage = 1;
    this.totalPages = 1;
    this.isLoading = false;
    this.typingTimeout = null;
  }

  async getHtml() {
    // const [isUserLoggedIn, res] = await getCurrentUser();
    this.user = window.currentUser;
    this.chatterId = this.params.id;

    const { messages, currentPage, totalMessages, totalPages } =
      await customFetch(
        `/api/get_messages?user_id=${this.chatterId}&limit=${CHAT_PAGE_SIZE}&page=${this.currentPage}`
      );

    this.totalPages = totalPages;
    this.currentPage = currentPage;

    console.log(`[Chat] Loaded ${messages.length} messages (page ${currentPage}/${totalPages}, total: ${totalMessages})`);

    // WS handling is registered in onMounted via window.addWsListener

    let chatsHTML;
    if (messages.length > 0) {
      chatsHTML = await Promise.all(
        messages.map(async (message) => {
          const messageView = new Message({ message });
          return await messageView.getHtml();
        })
      ).then((htmlArray) => htmlArray.join(""));
    } else {
      const chatter = window.allUsers?.find((user) => user.id === this.chatterId);
      const chatterName = chatter ? chatter.username : "this user";

      chatsHTML = /* HTML */ `
        <div
          class="flex flex-col items-center justify-center h-full text-gray-400"
        >
          <i class="bx bx-message-rounded-dots text-6xl mb-4"></i>
          <p class="text-lg">Start chatting with ${chatterName}</p>
          <p class="text-sm">
            Send your first message to begin the conversation
          </p>
        </div>
      `;
    }

    // Check if chatter is online
    const chatterData = window.allUsers?.find((user) => user.id === this.chatterId);
    const isOnline = chatterData?.status === "online";
    const chatterName = chatterData ? chatterData.username : "this user";

    return /* HTML */ `
      <div class="flex flex-col w-full bg-gray-900" style="height: calc(100vh - 7rem);">
          <!-- Chat header -->
          <div class="flex items-center px-3 py-1.5 bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <div class="relative">
              <div class="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs">
                ${chatterName.charAt(0).toUpperCase()}
              </div>
              <div class="absolute w-2.5 h-2.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full border-2 border-gray-800 bottom-0 right-0"></div>
            </div>
            <div class="ml-2">
              <p class="text-white font-semibold text-sm">${chatterName}</p>
              <p class="text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}">${isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>

          <div
            class="flex flex-col overflow-y-auto flex-1 min-h-0"
            id="chat-messages"
          >
            ${chatsHTML}
          </div>

          <!-- Typing indicator -->
          <div id="typing-indicator" class="hidden px-4 py-2 flex-shrink-0">
            <div class="flex items-center space-x-2 text-gray-400">
              <div class="flex space-x-1">
                <div
                  class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                ></div>
                <div
                  class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style="animation-delay: 0.2s"
                ></div>
                <div
                  class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style="animation-delay: 0.4s"
                ></div>
              </div>
              <span></span>
            </div>
          </div>

          ${isOnline ? /* HTML */ `
          <form
            id="chat-form"
            class="m-2 sm:m-4 flex items-center gap-2 sm:gap-3 py-2 flex-shrink-0"
          >
            <input
              type="text"
              id="chat-input"
              class="w-full px-3 sm:px-4 h-10 sm:h-12 rounded-full bg-gray-800 text-white text-sm sm:text-base border border-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              class="bx bxs-send text-3xl text-white hover:bg-gray-700 rounded-full cursor-pointer p-2"
            ></button>
          </form>
          ` : /* HTML */ `
          <div class="m-2 sm:m-4 flex items-center justify-center py-3 bg-gray-800 rounded-full border border-gray-700 flex-shrink-0">
            <p class="text-gray-400 text-sm">This user is offline — messages cannot be sent</p>
          </div>
          `}
        </div>
    `;
  }

  sendMessage(content) {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(
        JSON.stringify({
          type: "private_message",
          content: content,
          receiverId: this.chatterId,
          senderId: this.user.id,
          senderName: this.user.username
        })
      );
      console.log("Message sent:", {
        content,
        ReceiverID: this.chatterId,
        SenderID: this.user.id,
        SenderName: this.user.username
      });
    } else {
      console.error("WebSocket is not open");
    }
  }

  async onMounted() {
    console.log("ChatView mounted");
    console.log(window.currentUser);

    // Track active chat so global WS handler can suppress duplicate toasts
    window.currentChatUserId = this.chatterId;

    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");

    // Ensure only one active chat listener at a time
    if (window.activeChatWsUnsub) {
      window.activeChatWsUnsub();
      window.activeChatWsUnsub = null;
    }

    window.activeChatWsUnsub = window.addWsListener?.((message) => {
      if (
        message.type === "typing_start" &&
        message.senderId === this.chatterId
      ) {
        this.showTypingIndicator(message.senderName);
        return;
      }
      if (message.type === "typing_end" && message.senderId === this.chatterId) {
        this.hideTypingIndicator();
        return;
      }

      if (message.type !== "private_message") return;

      // Update sidebar ordering/preview
      window.renderUserList?.();

      // Only append if this message belongs to the currently opened chat
      if (
        message.senderId === this.chatterId ||
        message.senderId === this.user.id
      ) {
        const messageView = new Message({ message });
        messageView.getHtml().then((html) => {
          const chatMessagesEl = document.getElementById("chat-messages");
          if (!chatMessagesEl) return;

          const emptyState = chatMessagesEl.querySelector(
            ".flex.flex-col.items-center.justify-center"
          );
          if (emptyState) {
            chatMessagesEl.removeChild(emptyState);
          }

          chatMessagesEl.insertAdjacentHTML("beforeend", html);
          chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        });
      }
    });

    // Typing indicator and form handling only when user is online (form exists)
    if (chatForm && chatInput) {
    // Typing indicator (no WS spam):
    // - Send typing_start once when typing begins
    // - Debounce typing_end after inactivity
    this.isTyping = false;
    const sendTypingStart = () => {
      if (!window.ws || window.ws.readyState !== WebSocket.OPEN) return;
      window.ws.send(
        JSON.stringify({
          type: "typing_start",
          receiverId: this.chatterId,
          senderId: this.user.id,
          senderName: this.user.username,
        })
      );
    };

    const sendTypingEnd = () => {
      if (!window.ws || window.ws.readyState !== WebSocket.OPEN) return;
      window.ws.send(
        JSON.stringify({
          type: "typing_end",
          receiverId: this.chatterId,
          senderId: this.user.id,
        })
      );
    };

    const scheduleTypingEnd = () => {
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        if (!this.isTyping) return;
        this.isTyping = false;
        sendTypingEnd();
      }, 1200);
    };

    chatInput.addEventListener("input", () => {
      const hasText = !!chatInput.value.trim();
      if (!hasText) {
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        if (this.isTyping) {
          this.isTyping = false;
          sendTypingEnd();
        }
        return;
      }

      if (!this.isTyping) {
        this.isTyping = true;
        sendTypingStart();
      }
      scheduleTypingEnd();
    });

    // Stop typing and clear timeout when input loses focus
    chatInput.addEventListener("blur", () => {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      if (this.isTyping) {
        this.isTyping = false;
        sendTypingEnd();
      }
    });

    // Stop typing and clear timeout when Enter is pressed
    chatInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        if (this.isTyping) {
          this.isTyping = false;
          sendTypingEnd();
        }
      }
    });

    // Handle form submission
    handleFormSubmit("chat-form", (data) => {
      const message = chatInput.value.trim();
      if (message) {
        this.sendMessage(message);
        chatInput.value = "";
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        if (this.isTyping) {
          this.isTyping = false;
          sendTypingEnd();
        }
      }
    });
    } // end if (chatForm && chatInput)

    // Infinite scroll: load older messages when scrolled to top
    const loadOlderMessages = async () => {
      if (this.isLoading || this.currentPage >= this.totalPages) return;
      if (chatMessages.scrollTop > CHAT_SCROLL_TOP_THRESHOLD_PX) return;

      this.isLoading = true;
      const oldScrollHeight = chatMessages.scrollHeight;

      try {
        const nextPage = this.currentPage + 1;
        const { messages: olderMessages } = await customFetch(
          `/api/get_messages?user_id=${this.chatterId}&limit=${CHAT_PAGE_SIZE}&page=${nextPage}`
        );

        if (olderMessages && olderMessages.length > 0) {
          this.currentPage = nextPage;
          const olderMessagesHTML = await Promise.all(
            olderMessages.map(async (msg) => {
              const messageView = new Message({ message: msg });
              return await messageView.getHtml();
            })
          ).then((arr) => arr.join(""));

          chatMessages.insertAdjacentHTML("afterbegin", olderMessagesHTML);
          // Restore scroll so the view doesn't jump
          chatMessages.scrollTop = chatMessages.scrollHeight - oldScrollHeight;
        }
      } catch (error) {
        console.error("Error loading older messages:", error);
      } finally {
        this.isLoading = false;
        // If content still doesn't overflow and more pages exist, keep loading
        if (
          chatMessages.scrollHeight <= chatMessages.clientHeight &&
          this.currentPage < this.totalPages
        ) {
          loadOlderMessages();
        }
      }
    };

    chatMessages.addEventListener("scroll", () => {
      if (chatMessages.scrollTop <= CHAT_SCROLL_TOP_THRESHOLD_PX) {
        loadOlderMessages();
      }
    });

    // Auto-scroll to bottom on new messages
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // If content fits without a scrollbar, proactively load older messages
    if (
      chatMessages.scrollHeight <= chatMessages.clientHeight &&
      this.currentPage < this.totalPages
    ) {
      loadOlderMessages();
    }
  }

  showTypingIndicator(username) {
    const indicator = document.getElementById("typing-indicator");
    indicator.querySelector("span").innerText = `${username} is typing...`;
    indicator.classList.remove("hidden");
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    indicator.classList.add("hidden");
  }
}
