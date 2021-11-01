export function mapTabToCollection(tab) {
  return { url: tab.url, title: tab.title, favicon: tab.favIconUrl, host: tab.url.split('/')[2] }
}
