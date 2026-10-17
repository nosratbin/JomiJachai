export function go(route) {
  window.location.hash = route;
  window.scrollTo({ top: 0 });
}

export function appBaseUrl() {
  return window.location.origin + window.location.pathname;
}

export function verifyLink(deed) {
  return `${appBaseUrl()}#v-${deed.no}-${deed.fingerprint}`;
}
