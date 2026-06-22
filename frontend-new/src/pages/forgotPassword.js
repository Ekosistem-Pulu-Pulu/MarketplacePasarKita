import * as auth from "./auth.js";

export function render(route) {
  return auth.render({ ...route, path: "/forgot-password" });
}

export function afterRender(context) {
  return auth.afterRender({ ...context, path: "/forgot-password" });
}
