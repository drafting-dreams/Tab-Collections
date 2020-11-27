import React from 'react'
import { render } from 'react-dom'
import App from '../components/App.jsx'

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
function unpin(sendMessage = true) {
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

/* eslint no-undef: "off" */
// Toggle UI
chrome.runtime.onMessage.addListener(function (request) {
  switch (request.type) {
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
const container = document.querySelector('body').appendChild(document.createElement('div'))
container.className = 'tab-collections-react-root'

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
