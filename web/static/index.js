import Navbar from "./views/Navbar.js";
import Home from "./views/Home.js";
import PostView from "./views/PostView.js";
import PostCreate from "./views/PostCreate.js";
import Signup from "./views/Signup.js";
import Signin from "./views/Signin.js";
import CategoriesList from "./views/CategoriesList.js";
import ChatView from "./views/ChatView.js";
import UserList from "./views/UserList.js";
import { customFetch, getCurrentUser } from "./utils.js";
import UserPosts from "./views/UserPosts.js";
import Toast from "./Toast.js";

// Global instances
window.ws = null;
window.currentUser = null;
window.toast = new Toast();
window.currentChatUserId = null;
window.allUsers = [];

// Allow multiple modules/views to listen to WebSocket messages
window.wsListeners = new Set();
window.addWsListener = (listener) => {
  window.wsListeners.add(listener);
  return () => window.wsListeners.delete(listener);
};

function connectWebSocket() {
  if (window.ws && window.ws.readyState === WebSocket.OPEN) return;

  window.ws = new WebSocket("ws://localhost:8080/ws");

  window.ws.onopen = () => {
    console.log("WebSocket connection established");
  };

  window.ws.onclose = () => {
    console.log("WebSocket connection closed");
    if (window.isLoggedIn) {
      setTimeout(connectWebSocket, 3000);
    }
  };

  window.ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  window.ws.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (e) {
      console.error("Invalid WS message:", event.data);
      return;
    }

    console.log("Message received:", message);

    if (message.type === "update_user_list") {
      window.renderUserList?.();
    } else if (message.type === "error") {
      window.toast.show(message.content || "An error occurred", "error", 3000);
    } else if (message.type === "private_message") {
      window.renderUserList?.();
      // Only show toast if not currently viewing this chat
      const isInChat = window.currentChatUserId === message.senderId;
      const isSelf = window.currentUser && message.senderId === window.currentUser.id;
      if (!isInChat && !isSelf) {
        window.toast.show(
          `New message from ${message.senderName}`,
          "info",
          3000
        );
      }
    }

    // Fan out to view-specific listeners
    for (const listener of window.wsListeners) {
      try {
        listener(message);
      } catch (e) {
        console.error("WS listener error:", e);
      }
    }
  };
}

window.connectWebSocket = connectWebSocket;

const pathToRegex = (path) =>
  new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = (match) => {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
    (result) => result[1]
  );

  return Object.fromEntries(
    keys.map((key, i) => {
      return [key, values[i]];
    })
  );
};

const renderNavbar = async () => {
  const navbarView = new Navbar();
  document.getElementById("navbar").innerHTML = await navbarView.getHtml();
  if (typeof navbarView.onMounted === "function") {
    await navbarView.onMounted();
  }
};

const renderUserList = async () => {
  const currentPath = window.location.pathname;
  const userlistElement = document.getElementById("userlist");
  const rootElement = document.getElementById("root");
  
  // Hide userlist on signin/signup pages
  if (currentPath === "/signin" || currentPath === "/signup") {
    userlistElement.style.display = "none";
    // Remove flex-1 and add full width when no sidebar
    rootElement.className = "w-full flex justify-center";
    return;
  }
  
  // Show userlist on other pages (always visible per requirements)
  userlistElement.style.display = "block";
  rootElement.className = "flex-1 w-full flex justify-center min-w-0";
  
  let users;
  try {
    users = await customFetch("/api/online_users", "GET", null, null, (error) => {
      // Suppress toast for unauthorized or no users online
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("Failed to fetch users") ||
        error.message.includes("Could not get users")
      ) {
        // Do nothing (no toast)
      } else {
        window.toast.show(error.message || "Request failed", "error");
      }
    });
  } catch (error) {
    users = [];
  }
  if (!users || users.error) {
    users = [];
  }
  const filteredUsers = window.currentUser
    ? users.filter((user) => user.id !== window.currentUser.id)
    : users;

  window.allUsers = filteredUsers;

  const userlistView = new UserList({ users: filteredUsers });
  userlistElement.innerHTML = await userlistView.getHtml();
};

window.renderUserList = renderUserList;

const renderPage = async () => {
  // Clear active chat tracking on any page navigation
  window.currentChatUserId = null;
  const match = await router();
  const pageView = new match.route.view(getParams(match));
  document.getElementById("root").innerHTML = await pageView.getHtml();
  
  // Update userlist visibility after page render
  await renderUserList();

  if (typeof pageView.onMounted === "function") {
    await pageView.onMounted();
  }
};

const navigateTo = (url) => {
  history.pushState(null, null, url);
  renderPage();

  if (window.isLoggedIn) {
    renderNavbar();
  }
};

const router = async () => {
  const routes = [
    { path: "/", view: Home },
    { path: "/post/:id", view: PostView },
    { path: "/create-post", view: PostCreate },
    { path: "/signup", view: Signup },
    { path: "/signin", view: Signin },
    { path: "/category", view: CategoriesList },
    { path: "/chat/:id", view: ChatView },
    { path: "/my-posts", view: UserPosts },
  ];

  const potentialMatches = routes.map((route) => {
    return {
      route: route,
      result: location.pathname.match(pathToRegex(route.path)),
    };
  });

  let match = potentialMatches.find(
    (potentialMatch) => potentialMatch.result !== null
  );

  if (!match) {
    match = {
      route: routes[0],
      result: [location.pathname],
    };
  }

  return match;
};

window.addEventListener("popstate", renderPage);

document.addEventListener("DOMContentLoaded", async () => {
  const [isLoggedIn, response] = await getCurrentUser();
  if (response) {
    window.currentUser = response.user;
    window.currentUserPosts = response.posts;
  }
  window.isLoggedIn = isLoggedIn;

  const currentPath = window.location.pathname;

  if (isLoggedIn) {
    connectWebSocket();
    await renderPage();
    await renderNavbar();
  } else if (currentPath !== "/signup") {
    navigateTo("/signin");
  } else {
    await renderPage();
  }

  document.body.addEventListener("click", function (e) {
    const anchor = e.target.closest("a[data-link]");
    if (anchor) {
      e.preventDefault();
      navigateTo(anchor.href);
    }
  });
});
