import { localStorage, getPinRegistry } from './webStore'

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
