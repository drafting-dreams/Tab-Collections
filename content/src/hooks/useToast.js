import { useState, useEffect } from 'react'

export default function useToast() {
  const [toast, setToast] = useState('')
  const [displayToast, setDisplayToast] = useState(false)
  const handleToastClose = () => {
    setDisplayToast(false)
    setTimeout(() => {
      setToast('')
    }, 300)
  }
  useEffect(() => {
    if (toast) setDisplayToast(true)
  }, [toast])

  return {
    toast,
    setToast,
    displayToast,
    handleToastClose,
  }
}
