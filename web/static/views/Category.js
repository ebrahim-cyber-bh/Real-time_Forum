import AbstractView from "./AbstractView.js";
import { CATEGORIES } from "../constants.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const category = this.params.category;

    const iconClass = (() => {
      const name = (category?.name || "").toLowerCase();
      if (name.includes("sport")) return "bx-football";
      if (name.includes("gaming")) return "bx-joystick";
      return "bx-dots-horizontal-rounded";
    })();

    return /* HTML */ `
      <a class="block w-full" href="/category/${category.id}" data-link>
        <div
          class="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-all duration-200 h-full flex flex-col"
        >
          <div class="flex items-center mb-3">
            <div class="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
              <i class="bx ${iconClass} text-xl text-white"></i>
            </div>
            <span class="ml-3 text-sm font-semibold text-gray-300">c/${category.name}</span>
          </div>
          <p class="text-xs text-gray-400 line-clamp flex-1">
            ${category.description}
          </p>
        </div>
      </a>
    `;
  }
}
