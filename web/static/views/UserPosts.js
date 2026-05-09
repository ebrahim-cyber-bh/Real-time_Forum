import AbstractView from "./AbstractView.js";
import Post from "./Post.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    let posts;
    try {
      const res = await fetch("http://localhost:8080/api/current_user", {
        method: "GET",
        headers: { "Content-type": "application/json", "Cache-Control": "no-cache" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        posts = data?.posts;
      }
    } catch (e) {
      console.error("Failed to fetch user posts:", e);
    }

    if (!posts || posts.length === 0) {
      return `<div class="w-full max-w-screen-xl mx-auto"><h2 class="text-white text-lg font-semibold px-3 sm:px-4 pt-4 pb-2">My Posts</h2><div class="text-gray-400 text-center text-base mt-6 px-4">You haven't created any posts yet.</div></div>`;
    }

    const postsHTML = await Promise.all(
      posts.map(async (post) => {
        const postView = new Post({ post });
        return await postView.getHtml();
      })
    ).then((htmlArray) => htmlArray.join(""));

    return /* HTML */ `
      <div class="w-full max-w-screen-xl mx-auto">
        <h2 class="text-white text-lg font-semibold px-3 sm:px-4 pt-4 pb-2">My Posts</h2>
        <div
          class="grid gap-3 px-3 sm:px-4 pb-6"
          style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));"
          id="posts"
        >
          ${postsHTML}
        </div>
      </div>
    `;
  }
}
