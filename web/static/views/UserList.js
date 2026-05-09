import AbstractView from "./AbstractView.js";
import { formatTimeAgo } from "../utils.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const users = [...this.params.users];
    
    // Sort like Discord:
    // 1) Users with chat history: most recent message first
    // 2) Users without history: alphabetical by username
    users.sort((a, b) => {
      // If both have messages, sort by most recent first
      if (a.lastMessage && b.lastMessage) {
        return (
          new Date(b.lastMessage.created_at) -
          new Date(a.lastMessage.created_at)
        );
      }
      
      // If only one has a message, that one goes first
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;

      // No chat history: alphabetical
      return a.username.localeCompare(b.username);
    });

    const usersHTML = users
      .map(
        (user, index) => /* HTML */ ` <a
          class="flex items-center justify-between px-4 py-3 hover:bg-gray-700 cursor-pointer transition-all"
          href="/chat/${user.id}"
          data-link
        >
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xl">
              ${user.username.charAt(0).toUpperCase()}
            </div>
            ${user.status === "online"
              ? /* HTML */ `
                  <div
                    class="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 bottom-0 right-0"
                  ></div>
                `
              : /* HTML */ `
                  <div
                    class="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800 bottom-0 right-0"
                  ></div>
                `}
          </div>
          <div class="flex flex-1 min-w-0">
            <div class="ml-4 flex-1 min-w-0">
              <p class="text-white text-base sm:text-xl font-semibold truncate">${user.username}</p>
              ${user.lastMessage
                ? `<div class="flex mt-1 text-gray-400 min-w-0">
                      <p class="text-sm truncate min-w-0 flex-1">
                        ${
                          user.lastMessage.sender_name === user.username
                            ? user.lastMessage.content
                            : `You: ${user.lastMessage.content}`
                        }
                      </p>
                      <p class="text-xs ml-2 whitespace-nowrap">
                        · ${formatTimeAgo(user.lastMessage.created_at)}
                      </p>
                    </div>`
                : ""}
            </div>
          </div>
        </a>`
      )
      .join("");

    return /* HTML */ `
      <div class="flex flex-col w-full bg-gray-800">
        <h2 class="text-white text-lg sm:text-xl font-bold py-3 sm:py-5 text-left px-4">Chats</h2>
        <div class="flex flex-col overflow-y-auto h-full" id="chat-users">
          ${usersHTML}
        </div>
      </div>
    `;
  }
}
