const domParser = new DOMParser()

const parseModsConfig = (str: string): XMLDocument => {
   return domParser.parseFromString(str, 'text/xml')
}

export { parseModsConfig }
