import AbstractView from "./AbstractView.js";
import { formatTimeAgo } from "../utils.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const message = this.params.message;
    const sentAt = new Date(message.createdAt);
    const sentAtText = isNaN(sentAt.getTime())
      ? ""
      : sentAt.toLocaleString();

    return /* HTML */ `
      <div class="flex items-center hover:bg-gray-800 px-3 py-1 sm:px-4 sm:py-1.5 transition-all">
        <div class="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0">
          ${message.senderName.charAt(0).toUpperCase()}
        </div>
        <div class="flex min-w-0 items-baseline flex-wrap gap-x-2">
          <p class="text-white font-semibold text-xs">${message.senderName}</p>
          <span class="text-gray-400 text-xs timestamp" data-timestamp="${message.createdAt}">
            ${sentAtText || formatTimeAgo(message.createdAt)}
          </span>
          <p class="text-gray-300 text-sm break-words w-full">${message.content}</p>
        </div>
      </div>
    `;
  }
}
