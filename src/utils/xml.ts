export const childNodesByTagName = (parent: Element, tagName: string) =>
   Array.from(parent.getElementsByTagName(tagName)).filter(
      node => node.parentNode === parent,
   )
