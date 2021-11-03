const CHROME_VERSION = /Chrome\/(\d+)/.exec(navigator.userAgent) ? Number(/Chrome\/(\d+)/.exec(navigator.userAgent)[1]) : 0

// Edge Browser also has this chrome info in its useragent,
// So here I only use the Chrome version.
// Note: chrome.tabGroups API is only available with Chrome89+ and Manifest V3+
export const ENABLE_GROUP_TAB_FEATURE = CHROME_VERSION >= 89

// Edge doesn't support chrome.identity API
export const ENABLE_ARCHIVE = !navigator.userAgent.includes('Edg')
