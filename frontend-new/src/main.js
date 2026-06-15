import "./styles/main.css";
import "./styles/components.css";
import "./styles/responsive.css";
import "toastify-js/src/toastify.css";
import "tabulator-tables/dist/css/tabulator.min.css";
import { initRouter } from "./utils/router.js";

document.querySelector("#app").innerHTML = `
  <div id="header-root"></div>
  <main id="view-root"></main>
  <div id="footer-root"></div>
`;

initRouter({
  headerRoot: document.querySelector("#header-root"),
  viewRoot: document.querySelector("#view-root"),
  footerRoot: document.querySelector("#footer-root"),
});
