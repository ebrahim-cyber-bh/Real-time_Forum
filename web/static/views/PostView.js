import AbstractView from "./AbstractView.js";
import Comment from "./Comment.js";
import { customFetch, formatTimeAgo, handleFormSubmit } from "../utils.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const postId = this.params.id;

    const response = await customFetch(
      `http://localhost:8080/api/post/${postId}`,
      "GET"
    );

    const post = response.post;

    if (!post) {
      return /* HTML */ `<div class="text-white">Post not found</div>`;
    }

    // Remove userImage if present
    if (post.userImage) delete post.userImage;
    const formattedTime = formatTimeAgo(post.createdAt);

    const commentsResponse = await customFetch(
      `http://localhost:8080/api/comments?post_id=${postId}`,
      "GET"
    );

    const comments = (commentsResponse || []).map(c => {
      if (c.userImage) delete c.userImage;
      return c;
    });

    const commentsHTML = await Promise.all(
      comments.map(async (comment) => {
        const formattedTime = formatTimeAgo(comment.createdAt);

        const commentView = new Comment({ comment, formattedTime });
        return await commentView.getHtml();
      })
    ).then((htmlArray) => htmlArray.join(""));

    return /* HTML */ `
      <div class="w-full max-w-screen-md mx-auto my-4 sm:my-6 px-2 sm:px-4">
        <div class="text-white w-full rounded-lg p-4 sm:p-6 md:p-8 bg-gray-900 border border-gray-700" style="overflow-wrap: break-word; word-break: break-word;">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xl">
              ${post.userName.charAt(0).toUpperCase()}
            </div>
            <div class="flex flex-col ml-4 text-sm text-gray-400">
              <div>
                <span class="font-semibold">u/${post.userName}</span> •
                <span>${formattedTime}</span>
              </div>
              <span class="font-semibold">c/${post.category}</span>
            </div>
          </div>

          <hr class="my-4 border-gray-600" />

          <h1 class="text-lg font-semibold text-white mb-2" style="overflow-wrap: break-word; word-break: break-word;">${post.title}</h1>
          <p class="text-md text-gray-300" style="white-space: pre-line; overflow-wrap: break-word; word-break: break-word;">${post.content}</p>
          <!-- Icons -->
          <div class="flex mt-6">
            <div class="flex items-center text-gray-400 mr-6">
              <i class="bx bxs-message-rounded-dots text-xl"></i>
              <span class="ml-2">${comments.length}</span>
            </div>
          </div>

          <!-- Comments -->
          <div id="comments-container">${commentsHTML}</div>

          <!-- Comment Form -->
          <div class="mt-8 sm:mt-16">
            <form id="comment-form">
              <label
                for="comment"
                class="block text-sm font-medium text-gray-400"
                >Add a comment:</label
              >
              <textarea
                id="comment"
                name="comment"
                rows="4"
                maxlength="250"
                class="block resize-none overflow-y-auto h-32 w-full mt-2 p-2.5 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Write your comment here..."
              ></textarea>
              <div class="flex justify-end mt-1">
                <span id="comment-counter" class="text-xs text-gray-400">0 / 250</span>
              </div>
              <button
                type="submit"
                class="w-full mt-8 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  async onMounted() {
    const postId = this.params.id;

    const commentEl = document.getElementById("comment");
    const commentCounterEl = document.getElementById("comment-counter");
    if (commentEl && commentCounterEl) {
      commentEl.addEventListener("input", () => {
        const len = commentEl.value.length;
        commentCounterEl.textContent = `${len} / 250`;
        commentCounterEl.className = len > 250 ? "text-xs text-red-400" : "text-xs text-gray-400";
      });
    }

    handleFormSubmit("comment-form", async (data) => {
      if (data.comment.length > 250) {
        window.toast.show("Comment cannot exceed 250 characters", "error");
        return;
      }

      const response = await customFetch(
        `http://localhost:8080/api/create_comment?post_id=${postId}`,
        "POST",
        {
          content: data.comment,
        },
        async () => {
          // Reload comments dynamically after adding a comment
          const commentsResponse = await customFetch(
            `http://localhost:8080/api/comments?post_id=${postId}`,
            "GET"
          );

          const comments = (commentsResponse || []).map((c) => {
            if (c.userImage) delete c.userImage;
            return c;
          });

          const commentsHTML = await Promise.all(
            comments.map(async (comment) => {
              const formattedTime = formatTimeAgo(comment.createdAt);
              const commentView = new Comment({ comment, formattedTime });
              return await commentView.getHtml();
            })
          ).then((htmlArray) => htmlArray.join(""));

          const commentsContainer = document.getElementById("comments-container");
          if (commentsContainer) {
            commentsContainer.innerHTML = commentsHTML;
          }

          // Update comment count
          const countEl = document.querySelector(".bxs-message-rounded-dots")?.nextElementSibling;
          if (countEl) {
            countEl.textContent = comments.length;
          }
          // Optionally clear textarea
          document.getElementById("comment").value = "";
          if (commentCounterEl) commentCounterEl.textContent = "0 / 250";
        }
      );
    });
  }
}
