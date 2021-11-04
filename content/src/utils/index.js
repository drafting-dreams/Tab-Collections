export * from '../../../utils'

export function copy(content) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(content)
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = content
    textArea.textContent = content
    textArea.style.position = 'fixed'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error("Couldn't't copy to clipboard")
      throw err
    }
    document.body.removeChild(textArea)
  }
}
