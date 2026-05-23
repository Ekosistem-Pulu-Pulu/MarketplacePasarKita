import "./styles/style.css";
import { initRouter } from "./router.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <div id="navbar-root"></div>
  <main id="view-root" tabindex="-1"></main>
  <div id="toast-root"></div>
`;

initRouter({
  navbarRoot: document.querySelector("#navbar-root"),
  viewRoot: document.querySelector("#view-root"),
});
