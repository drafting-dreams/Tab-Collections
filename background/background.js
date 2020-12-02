import { connectDB } from './db/connect'
import * as query from './db/transactions'

let db

try {
  connectDB(idb => {
    db = idb
  })
} catch (err) {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'alert',
        payload: "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.",
      })
    }
  )
  throw err
}

// Whether the extension shows on the page, default is false
let pinned = false
// When a new tab registered, push it in
let pin_registry = []
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
    case 'route change': {
      const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
      remainTabs.forEach(id => {
        chrome.tabs.sendMessage(id, {
          type: 'route change',
          payload: {
            route: request.payload.route,
          },
        })
      })
      break
    }
    case 'get tabs info': {
      const options = { currentWindow: true }
      if (request.payload.unpinned) {
        options.pinned = false
      }
      chrome.tabs.query(options, function (tabs) {
        sendResponse(tabs)
      })
      return true
    }
    case 'get unpinned tabs info': {
      chrome.tabs.query({ currentWindow: true }, function (tabs) {
        sendResponse(tabs)
      })
      return true
    }
    case 'add collection': {
      query.add(db, request.payload).then(id => {
        sendResponse(id)
      })
      // return true indicates that this event listener will response asynchronously
      return true
    }
    case 'get collection': {
      query.get(db, request.payload.key).then(record => {
        sendResponse(record)
      })
      return true
    }
    case 'get all': {
      query.list(db).then(records => {
        sendResponse(records)
      })
      return true
    }
    case 'update collection': {
      query.put(db, request.payload).then(result => {
        sendResponse(result)
      })
      return true
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
