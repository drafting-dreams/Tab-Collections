export function filterChromeProtocol(tab) {
  return !tab.url.startsWith('chrome://')
}
