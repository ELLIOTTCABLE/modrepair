import {
   getModDependenciesByVersion,
   ModMap,
   modMetaDataOfString,
   modMetaDataToString,
} from './modMetaData'
import type { PackageId } from './modMetaData'

const domParser = new DOMParser()
const domSerializer = new XMLSerializer()

export type ModsConfig = {
   text: string
   dom: XMLDocument
}

const helpers = (modsConfig: ModsConfig) => {
   const descriptor = `ModsConfig error:`
   return {
      expectMaxOne: (node: Element, tagName: string) => {
         const resultElements = node.getElementsByTagName(tagName)
         if (resultElements.length > 1)
            console.error(
               `${descriptor}: more than one <${tagName}/> found in <${node.tagName}/>`,
               modsConfig,
               node,
            )
         return resultElements
      },
   }
}

const nextCommentSibling = (node: ChildNode): ChildNode | undefined => {
   const next = node.nextSibling
   if (!next) return

   switch (next.nodeType) {
      case Node.TEXT_NODE:
         return nextCommentSibling(next)

      case Node.COMMENT_NODE:
         return next

      default:
         return undefined
   }
}

const parseModsConfig = (text: string): ModsConfig => {
   const dom = domParser.parseFromString(text, 'application/xml')

   return {
      text,
      dom,
   }
}

const activeModsLis = (modsConfig: ModsConfig): HTMLLIElement[] | void => {
   const root = modsConfig.dom.documentElement

   const h = helpers(modsConfig)

   if (root?.tagName.toLowerCase() !== 'modsconfigdata') {
      console.error(`ModsConfig error: no <ModsConfigData/> found`, root)
   }

   const activeMods = h.expectMaxOne(root, 'activeMods')
   if (null == activeMods || activeMods.length === 0) {
      return console.error(`ModsConfig error: no <activeMods/> found`, root)
   }

   return Array.from(activeMods[0].getElementsByTagName('li'))
}

// TODO: Clone the XML document before changing it, just incase old references
// TODO: User-facing error during incompatible changes
const updateModsConfigWithModMap = (modsConfig: ModsConfig, modMap: ModMap) => {
   let madeChanges = false
   activeModsLis(modsConfig)?.forEach(li => {
      const packageId = li.textContent?.toLowerCase() as PackageId | null
      if (!packageId) return

      const modMetaData = modMap.get(packageId)
      if (!modMetaData) return
      const modDeps = getModDependenciesByVersion(modMetaData, '1.4')
      if (!modDeps || modDeps.length === 0) return

      const newTextContent = modMetaDataToString(modMetaData)

      let comment = nextCommentSibling(li)
      const commentText = comment?.textContent
      const encodedModMetaData = modMetaDataOfString(commentText || '')
      const normalized = modMetaDataToString(encodedModMetaData)?.toLowerCase()

      if (!comment || !commentText || !normalized || normalized.length === 0) {
         if (!newTextContent) return

         madeChanges = true
         if (!comment) {
            const space = modsConfig.dom.createTextNode(' ')
            li.after(space)
            comment = modsConfig.dom.createComment(newTextContent)
            space.after(comment)
         } else {
            if (newTextContent) comment.textContent = newTextContent
            else comment.remove()
         }
      }

      if (newTextContent?.toLowerCase() === normalized) return

      madeChanges = true

      if (newTextContent) comment.textContent = newTextContent
      else comment.remove()
   })

   if (!madeChanges) return

   return domSerializer.serializeToString(modsConfig.dom)
}

export { parseModsConfig, updateModsConfigWithModMap }
