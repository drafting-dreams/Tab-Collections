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
      console.error('无法复制到剪切板')
    }
    document.body.removeChild(textArea)
  }
}
