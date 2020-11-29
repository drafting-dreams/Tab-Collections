import React, { useEffect } from 'react'

function Collection() {
  useEffect(() => {
    console.log('use effect')
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'add collection',
        payload: { name: 'me', age: 19 },
      })
    }, 8000)
  }, [])
  return <div> hello collections </div>
}

export default Collection
