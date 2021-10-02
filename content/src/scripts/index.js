import React from 'react'
import { render } from 'react-dom'
import App from '../components/App.jsx'

import '../content.scss'

const HTML_CLASS = 'tab-collections-pinned'

function pin() {
  const html = document.querySelector('html')
  const container = document.querySelector('.tab-collections')
  if (!html.className.includes(HTML_CLASS)) {
    html.classList.add(HTML_CLASS)
  }
  container.style.display = 'block'
  chrome.runtime.sendMessage({
    type: 'pin',
  })
}
export function unpin(sendMessage = true) {
  const html = document.querySelector('html')
  const container = document.querySelector('.tab-collections')
  if (html.className.includes(HTML_CLASS)) {
    html.className = html.className.replace(HTML_CLASS, '')
  }
  container.style.display = 'none'
  sendMessage &&
    chrome.runtime.sendMessage({
      type: 'unpin',
    })
}

// Toggle UI
chrome.runtime.onMessage.addListener(function (request) {
  switch (request.type) {
    case 'alert': {
      alert(request.payload)
      break
    }
    case 'clickIcon': {
      const html = document.querySelector('html')
      if (html.className.includes(HTML_CLASS)) {
        unpin()
      } else {
        pin()
      }
      break
    }
    case 'activeInfo': {
      if (request.payload.pinned) {
        pin()
      } else {
        unpin()
      }
      break
    }
    case 'unpin': {
      unpin(false)
    }
  }
})

// Create react-dom render container
const CONTAINER_CLASSNAME = 'tab-collections-react-root'
const outdatedExtension = document.getElementsByClassName(CONTAINER_CLASSNAME)
if (outdatedExtension && outdatedExtension.length) outdatedExtension[0].remove()
const container = document.querySelector('body').appendChild(document.createElement('div'))
container.className = CONTAINER_CLASSNAME

render(
  <div className="tab-collections" style={{ display: 'none' }}>
    <App />
  </div>,
  container,
  function () {
    chrome.runtime.sendMessage({
      type: 'ask if pinned',
      function(res) {
        if (res && res.pinned) {
          pin()
        } else {
          unpin()
        }
      },
    })
  }
)
