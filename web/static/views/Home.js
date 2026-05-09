import AbstractView from "./AbstractView.js";
import Post from "./Post.js";
import { customFetch } from "../utils.js";
import { CATEGORIES } from "../constants.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.activeCategory = "";
  }

  async getHtml() {
    const posts = await customFetch("http://localhost:8080/api/posts", "GET");
    let postsHTML = "";
    if (posts) {
      postsHTML = await Promise.all(
        posts.map(async (post) => {
          const postView = new Post({ post });
          return await postView.getHtml();
        })
      ).then((htmlArray) => htmlArray.join(""));
    }

    const categoryButtons = CATEGORIES.map(
      (cat) =>
        `<button class="category-filter-btn px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" data-category="${cat.name}">${cat.name}</button>`
    ).join("");

    return /* HTML */ `
      <div class="w-full max-w-screen-xl mx-auto">
        <div class="px-3 sm:px-4 pt-3 pb-1">
          <div class="flex flex-wrap gap-2 items-center" id="category-filter">
            <button class="category-filter-btn px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap bg-indigo-600 text-white" data-category="">All</button>
            ${categoryButtons}
          </div>
        </div>

        <div
          class="grid gap-3 px-3 sm:px-4 pt-2 pb-6"
          style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));"
          id="posts"
        >
          ${posts
            ? postsHTML
            : `<div class="col-span-full text-white text-center text-lg mt-6">No posts available</div>`}
        </div>
      </div>
    `;
  }

  async onMounted() {
    const filterContainer = document.getElementById("category-filter");
    if (!filterContainer) return;

    filterContainer.addEventListener("click", async (e) => {
      const btn = e.target.closest(".category-filter-btn");
      if (!btn) return;

      const category = btn.dataset.category;
      this.activeCategory = category;

      // Update active styles
      filterContainer.querySelectorAll(".category-filter-btn").forEach((b) => {
        b.classList.remove("bg-indigo-600", "text-white");
        b.classList.add("bg-gray-800", "text-gray-300", "hover:bg-gray-700", "hover:text-white");
      });
      btn.classList.remove("bg-gray-800", "text-gray-300", "hover:bg-gray-700", "hover:text-white");
      btn.classList.add("bg-indigo-600", "text-white");

      // Fetch filtered posts
      const url = category
        ? `http://localhost:8080/api/posts?category=${encodeURIComponent(category)}`
        : "http://localhost:8080/api/posts";

      const posts = await customFetch(url, "GET");
      const postsContainer = document.getElementById("posts");
      if (!postsContainer) return;

      if (posts && posts.length > 0) {
        const postsHTML = await Promise.all(
          posts.map(async (post) => {
            const postView = new Post({ post });
            return await postView.getHtml();
          })
        ).then((htmlArray) => htmlArray.join(""));
        postsContainer.innerHTML = postsHTML;
      } else {
        postsContainer.innerHTML = `<div class="col-span-full text-white text-center text-2xl mt-8">No posts available</div>`;
      }
    });
  }
}
