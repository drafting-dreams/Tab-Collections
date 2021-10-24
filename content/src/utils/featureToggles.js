// Edge Browser also has this chrome info in its useragent,
// So here I only use the Chrome version.
// Note: chrome.tabGroups API is only available with Chrome89+ and Manifest V3+
let enableGroupTab
export const ENABLE_GROUP_TAB_FEATURE = (function () {
  if (typeof enableGroupTab !== 'boolean') {
    const CHROME_VERSION = /Chrome\/(\d+)/.exec(navigator.userAgent) ? Number(/Chrome\/(\d+)/.exec(navigator.userAgent)[1]) : 0
    enableGroupTab = CHROME_VERSION >= 89
  }
  return enableGroupTab
})()
