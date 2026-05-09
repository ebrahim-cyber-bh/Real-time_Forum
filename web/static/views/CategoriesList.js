import AbstractView from "./AbstractView.js";
import Category from "./Category.js";
import { CATEGORIES } from "../constants.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const categoriesHTML = await Promise.all(
      CATEGORIES.map(async (category) => {
        const categoryView = new Category({ category });
        return await categoryView.getHtml();
      })
    ).then((htmlArray) => htmlArray.join(""));

    return /* HTML */ `
      <div class="w-full max-w-screen-xl mx-auto">
        <h2 class="text-white text-lg font-semibold px-3 sm:px-4 pt-4 pb-2">Categories</h2>
        <div
          class="grid gap-3 px-3 sm:px-4 pb-6"
          style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));"
          id="categories"
        >
          ${categoriesHTML}
        </div>
      </div>
    `;
  }
}
