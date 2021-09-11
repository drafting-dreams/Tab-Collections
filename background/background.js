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

const localStorage = chrome.storage.local

// Initialization on first installation
chrome.runtime.onInstalled.addListener(() => {
  // Whether the extension shows on the page, default is false
  localStorage.set({ pinned: false })
  // When a new tab registered, push it in
  localStorage.set({ pin_registry: '' })
  localStorage.set({ location: '/' })
})

function getLocalStorage(key, cb) {
  localStorage.get([key], re => {
    cb(re[key])
  })
}
function setLocalStorage(key, value) {
  localStorage.set({ [key]: value })
}
function getPinRegistry(cb) {
  getLocalStorage('pin_registry', pin_registry => {
    cb(pin_registry.split(',').map(id => Number(id)))
  })
}
function setPinRegistry(ids) {
  setLocalStorage('pin_registry', ids.join(','))
}

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, {
    type: 'clickIcon',
  })
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    case 'ask if pinned': {
      getLocalStorage('pinned', pinned => {
        sendResponse({ pinned })
      })
      break
    }
    case 'pin': {
      setLocalStorage('pinned', true)
      getPinRegistry(pin_registry => {
        if (sender.tab && !pin_registry.includes(sender.tab.id)) {
          pin_registry.push(sender.tab.id)
          setPinRegistry(pin_registry)
        }
      })
      break
    }
    // To remove the UI on the pinned tabs
    case 'unpin': {
      setLocalStorage('pinned', false)
      getPinRegistry(pin_registry => {
        const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
        remainTabs.forEach(id => {
          chrome.tabs.sendMessage(id, {
            type: 'unpin',
          })
        })
        setPinRegistry([])
      })
      break
    }
    case 'inform route change': {
      const location = request.payload.route
      setLocalStorage('location', location)
      getPinRegistry(pin_registry => {
        const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
        remainTabs.forEach(id => {
          chrome.tabs.sendMessage(id, {
            type: 'route change',
            payload: {
              route: location,
            },
          })
        })
      })

      break
    }
    case 'get current tab info': {
      sendResponse(sender.tab)
      return true
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
        getPinRegistry(pin_registry => {
          const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
          remainTabs.forEach(id => {
            chrome.tabs.sendMessage(id, {
              type: 'reload',
            })
          })
        })
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
        getPinRegistry(pin_registry => {
          const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
          remainTabs.forEach(id => {
            chrome.tabs.sendMessage(id, {
              type: 'reload',
            })
          })
        })
      })
      return true
    }
    case 'delete collection': {
      request.payload.keys.forEach(key => {
        query.remove(db, key)
        getPinRegistry(pin_registry => {
          const remainTabs = pin_registry.filter(id => id !== sender.tab.id)
          remainTabs.forEach(id => {
            chrome.tabs.sendMessage(id, {
              type: 'reload',
            })
          })
        })
      })
      return true
    }

    case 'get group info': {
      chrome.tabGroups.get(request.payload.groupId).then(groupInfo => {
        sendResponse(groupInfo)
      })
      return true
    }
    case 'create collection using a group': {
      const TITLE_PLACEHOLDER = 'New Collections'
      const {
        payload: { groupId },
      } = request
      if (typeof groupId === 'number' && groupId >= 0) {
        const groupInfoPromise = chrome.tabGroups.get(request.payload.groupId)
        const tabsInfoPromise = chrome.tabs.query({ currentWindow: true })
        Promise.all([groupInfoPromise, tabsInfoPromise]).then(([groupInfo, tabsInfo]) => {
          query
            .add(db, {
              title: groupInfo.title.trim() ? groupInfo.title : TITLE_PLACEHOLDER,
              list: tabsInfo
                .filter(tab => tab.groupId === groupId)
                .map(tab => ({ url: tab.url, title: tab.title, favicon: tab.favIconUrl, host: tab.url.split('/')[2] })),
            })
            .then(() => {
              getPinRegistry(pin_registry => {
                pin_registry.forEach(id => {
                  chrome.tabs.sendMessage(id, {
                    type: 'reload',
                  })
                })
              })
            })
        })
      } else {
        const tab = sender.tab
        query
          .add(db, { title: TITLE_PLACEHOLDER, list: [{ url: tab.url, title: tab.title, favicon: tab.favIconUrl, host: tab.url.split('/')[2] }] })
          .then(() => {
            getPinRegistry(pin_registry => {
              pin_registry.forEach(id => {
                chrome.tabs.sendMessage(id, {
                  type: 'reload',
                })
              })
            })
          })
      }
    }
  }
})

// Tell the tab whether the extension has been pinned on the page, when the tab is activated, refreshed or created
function updateHandler(tabId) {
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
chrome.tabs.onActivated.addListener(activeInfo => {
  updateHandler(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener(updateHandler)

chrome.tabs.onCreated.addListener(tab => {
  updateHandler(tab.id)
})
