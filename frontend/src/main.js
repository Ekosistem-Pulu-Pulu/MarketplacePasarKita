import "./styles/style.css";
import "./styles/main.css";
import { initRouter } from "./router.js";


document.querySelector("#app").innerHTML = `
  <div id="header-root"></div>
  <main id="view-root" tabindex="-1"></main>
  <div id="footer-root"></div>
  <div id="toast-root" aria-live="polite" aria-atomic="true"></div>
`;

initRouter({
  headerRoot: document.querySelector("#header-root"),
  viewRoot: document.querySelector("#view-root"),
  footerRoot: document.querySelector("#footer-root"),
});
