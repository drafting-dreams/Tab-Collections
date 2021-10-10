export const DB_STORE_NAME = 'Collections'
let db

export function connectDB() {
  // In the following line, you should include the prefixes of implementations you want to test.
  if (!self.indexedDB) {
    self.indexedDB = self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB
  }
  // DON'T use "var indexedDB = ..." if you're not in a function.
  // Moreover, you may need references to some window.IDB* objects:
  // window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: 'readwrite' } // This line should only be needed if it is needed to support the object's constants for older browsers
  // window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
  // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
  if (!self.indexedDB) {
    throw new Error("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
  }

  return new Promise((resolve, reject) => {
    const openRequest = self.indexedDB.open('TabsCollectionIDB', 2)

    openRequest.onsuccess = function (event) {
      const db = openRequest.result
      console.log('Connected to DB.')
      resolve(db)
    }

    openRequest.onerror = function () {
      console.error(openRequest.errorCode)
      reject(openRequest.error)
    }

    openRequest.onupgradeneeded = function (event) {
      const db = event.target.result
      db.createObjectStore(DB_STORE_NAME, { keyPath: 'id', autoIncrement: true })
      console.log('Object store created.')
      resolve(db)
    }
  })
}

export async function getDB() {
  if (!db) {
    db = await connectDB()
  }
  return db
}
