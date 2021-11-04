import { localStorage, getPinRegistry } from './webStore'

export * from '../../utils'
export * from './utils'

export function initOnInstalled() {
  // Initialization on first installation
  chrome.runtime.onInstalled.addListener(() => {
    // Whether the extension shows on the page, default is false
    localStorage.set({ pinned: false })
    // When a new tab registered, push it in
    localStorage.set({ pin_registry: '' })
    localStorage.set({ location: '/' })

    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          })
          .catch(err => {
            console.log(err) // Usually, caused by an unloaded page, or a chrome internal url to which the extension doesn't have access
          })
      })
    })
  })
}

// Tell the tab whether the extension has been pinned on the page, when the tab is activated, refreshed or created
function _updateHandler(tabId) {
  localStorage.get(['pinned', 'location'], ({ pinned, location }) => {
    chrome.tabs.sendMessage(tabId, {
      type: 'activeInfo',
      payload: { pinned },
    })
    chrome.tabs.sendMessage(tabId, {
      type: 'route change',
      payload: { route: location },
    })
  })
}
export function registerTabUpdateEvent() {
  chrome.tabs.onActivated.addListener(activeInfo => {
    _updateHandler(activeInfo.tabId)
  })

  chrome.tabs.onUpdated.addListener(_updateHandler)

  chrome.tabs.onCreated.addListener(tab => {
    _updateHandler(tab.id)
  })
}

export function reloadExtensionContent({ selfId, excludeSelf = true }) {
  getPinRegistry().then(pin_registry => {
    if (excludeSelf) pin_registry = pin_registry.filter(id => id !== selfId)
    pin_registry.forEach(id => {
      chrome.tabs.sendMessage(id, {
        type: 'reload',
      })
    })
  })
}
