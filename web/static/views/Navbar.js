import AbstractView from "./AbstractView.js";
import SigninCard from "./SigninCard.js";
import { USERS, NavLinks } from "../constants.js";
import UserDropDown from "./UserDropDown.js";

export default class extends AbstractView {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    const isLoggedIn = window.isLoggedIn;
    const user = window.currentUser;
    const currentPath = window.location.pathname;

    const navItems = NavLinks.map(
      (link) => /* HTML */ ` <a
        href="${link.href}"
        class="inline-flex items-center rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${currentPath === link.href
          ? "bg-indigo-600 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"}"
        data-link
      >
        ${link.icon
          ? `<i class="bx ${link.icon} mr-1 text-xl"></i>`
          : ""}${link.name}
      </a>`
    ).join("");

    return /* HTML */ `
      <header class="bg-gray-800">
        <div
          class="w-full px-2 sm:px-4 lg:divide-y lg:divide-gray-700 lg:px-8"
        >
          <div class="relative flex h-16 justify-between">
            <div class="relative z-10 flex px-2 lg:px-0">
              <div class="flex flex-shrink-0 items-center">
                <a href="/" data-link>
                  <img
                    class="h-12 w-12 rounded-full"
                    src="/static/assets/logo.PNG"
                    alt="Your Company"
                  />
                </a>
                <h1 class="text-white text-xl pl-1 font-bold">FORUM</h1>
              </div>
            </div>
            <div class="relative z-10 ml-2 sm:ml-4 flex items-center">
              <!-- Profile dropdown -->
              <div class="relative ml-4 flex-shrink-0">
                <div class="flex items-center justify-between">
                  <button
                    id="user-menu-button"
                    type="button"
                    class="relative flex rounded-full bg-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span class="sr-only">Open user menu</span>

                    <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xl">
                      ${(isLoggedIn ? user.username : "G").charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <p class="ml-3 text-sm sm:text-xl font-medium text-white max-w-[8rem] sm:max-w-none truncate">
                    ${isLoggedIn ? user.username : "Guest"}
                  </p>
                </div>

                <div id="signin-container" class="hidden"></div>
              </div>
            </div>
          </div>

          <nav
            class="flex flex-wrap justify-center gap-1 sm:gap-2 py-2"
            aria-label="Global"
          >
            ${navItems}
          </nav>
        </div>
      </header>
    `;
  }

  async onMounted() {
    const isLoggedIn = window.isLoggedIn;
    const user = window.currentUser;

    const userMenuButton = document.getElementById("user-menu-button");
    const signinContainer = document.getElementById("signin-container");

    if (isLoggedIn) {
      const userDropDownCard = new UserDropDown({ user });
      signinContainer.innerHTML = await userDropDownCard.getHtml();

      if (typeof userDropDownCard.onMounted === "function") {
        await userDropDownCard.onMounted();
      }
    } else {
      const signinCard = new SigninCard();
      signinContainer.innerHTML = await signinCard.getHtml();

      if (typeof signinCard.onMounted === "function") {
        await signinCard.onMounted();
      }
    }

    userMenuButton.addEventListener("click", async () => {
      signinContainer.classList.toggle("hidden");
    });
  }
}
