const domParser = new DOMParser()

type ModsConfig = {
   text: string
   dom: XMLDocument
}

const parseModsConfig = (text: string): ModsConfig => {
   const dom = domParser.parseFromString(text, 'application/xml')

   return {
      text,
      dom,
   }
}

export { parseModsConfig }
