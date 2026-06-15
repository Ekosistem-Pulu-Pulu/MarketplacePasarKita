import { bindShell, header } from "./shell.js";

export function Navbar() {
  return header();
}

export function bindNavbar(navigate) {
  bindShell(navigate);
}
