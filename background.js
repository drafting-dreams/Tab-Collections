// Whether the extension shows on the page, default is false
let pinned = false
// When a new tab registered, push it in
let pin_registry = []
/* eslint no-undef: "off" */
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, {
    type: 'clickIcon',
  })
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    case 'ask if pinned': {
      sendResponse({ pinned })
      break
    }
    case 'pin': {
      pinned = true
      if (sender.tab && !pin_registry.includes(sender.tab.id)) {
        pin_registry.push(sender.tab.id)
      }
      break
    }
    // To remove the UI on the pinned tabs
    case 'unpin': {
      pinned = false
      const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
      remainTabs.forEach(id => {
        chrome.tabs.sendMessage(id, {
          type: 'unpin',
        })
      })
      pin_registry = []
      break
    }
  }
})

// Tell the tab whether the extension has been pinned on the page, when the tab is activated, refreshed or created
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.sendMessage(activeInfo.tabId, {
    type: 'activeInfo',
    payload: { pinned },
  })
})

chrome.tabs.onUpdated.addListener(function (tabId) {
  chrome.tabs.sendMessage(tabId, {
    type: 'activeInfo',
    payload: { pinned },
  })
})

chrome.tabs.onCreated.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, {
    type: 'activeInfo',
    payload: { pinned },
  })
})
