import { useState, useEffect } from 'react'

export default function useToast() {
  const [toast, setToast] = useState('')
  const [severity, setSeverity] = useState('warning')
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
    severity,
    setToast: (message, severity = 'warning') => {
      setToast(message)
      setSeverity(severity)
    },
    displayToast,
    handleToastClose,
  }
}
