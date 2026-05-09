import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const comment = this.params.comment;
    const formattedTime = this.params.formattedTime;
    // Remove userImage if present
    if (comment.userImage) delete comment.userImage;

    return /* HTML */ `
      <div class="px-3 sm:px-6 md:px-10 py-4 sm:py-6 my-3 sm:my-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xl">
            ${comment.userName.charAt(0).toUpperCase()}
          </div>
          <div class="flex flex-col ml-4 text-sm text-gray-400">
            <div>
              <span class="font-semibold">${comment.userName}</span> •
              <span>${formattedTime}</span>
            </div>
          </div>
        </div>
        <hr class="my-4 border-gray-600" />
        <p class="text-md text-gray-300" style="white-space: pre-line;">${comment.content}</p>
        <!-- Icons -->
        <!-- Like/Dislike removed -->
      </div>
    `;
  }
}
