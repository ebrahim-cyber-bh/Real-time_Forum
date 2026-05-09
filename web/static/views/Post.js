import AbstractView from "./AbstractView.js";
import { formatTimeAgo } from "../utils.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const post = this.params.post;

    if (!post) {
      return `<div class="text-white text-center text-2xl mt-8">Post not found</div>`;
    }

    // Remove userImage if present
    if (post.userImage) delete post.userImage;
    const formattedTime = formatTimeAgo(post.createdAt);

    // Show real comment count if available (from backend)
    const commentCount =
      typeof post.commentCount === "number"
        ? post.commentCount
        : post.comments
        ? post.comments.length
        : 0;
    return /* HTML */ `
      <a class="block w-full" href="/post/${post.id}" data-link>
        <div
          class="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-all duration-200 h-full flex flex-col"
        >
          <div class="flex items-center mb-2">
            <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              ${post.userName.charAt(0).toUpperCase()}
            </div>
            <div class="ml-2 text-xs text-gray-400 truncate">
              <span class="font-semibold text-gray-300">u/${post.userName}</span>
              <span class="mx-1">·</span>
              <span>${formattedTime}</span>
              <span class="mx-1">·</span>
              <span class="text-indigo-400">c/${post.category}</span>
            </div>
          </div>
          <h2 class="text-sm font-semibold text-white mb-1 line-clamp-title">${post.title}</h2>
          <p class="text-xs text-gray-400 line-clamp flex-1" style="white-space: pre-line;">${post.content}</p>
          <div class="flex items-center mt-3 pt-2 border-t border-gray-700">
            <i class="bx bx-comment text-sm text-gray-400"></i>
            <span class="ml-1 text-xs text-gray-400">${commentCount} comments</span>
          </div>
        </div>
      </a>
    `;
  }
}
