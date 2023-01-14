import {
   entryIsFile,
   entryIsDirectory,
   filePromise,
   entriesOfDirectories,
} from '../directoryReader'
import { childNodesByTagName } from '../xml'

import Verse from './verse'

export const knownVersions = ['1.4', '1.3', '1.2', '1.1', '1.0'] as const

type RimworldVersion = typeof knownVersions[number]

export type ContentSource =
   | 'Undefined'
   | 'OfficialModsFolder'
   | 'ModsFolder'
   | 'SteamWorkshop'

export type PackageId = string & { __packageId: never }

export type ModMap = Map<PackageId, CommonModMetaData>

type ModDependency = {
   packageId: PackageId
   displayName?: string
   steamWorkshopUrl?: string
   downloadUrl?: string
}

type StringyModMetaData = {
   name?: string
   unversionedModDependencies?: ModDependency[]
   modDependenciesByVersion?: Partial<Record<RimworldVersion, ModDependency[]>>
}

type CommonModMetaData = StringyModMetaData & {
   contentSource: ContentSource
   packageId: PackageId
   author?: string
   description?: string
   loadAfter?: PackageId[]
   loadBefore?: PackageId[]
}

export type WorkshopModMetaData = {
   contentSource: 'SteamWorkshop'
   name: string
   workshopId: string
} & CommonModMetaData

export type ModMetaData = WorkshopModMetaData

export const getModDependenciesByVersion = (
   mod: StringyModMetaData,
   version: RimworldVersion,
) => mod.modDependenciesByVersion?.[version] || mod.unversionedModDependencies

// constructs some error-helpers
const helpers = (mod: ModMetaData) => {
   const descriptor = `mod metadata error: ${mod.packageId}`
   return {
      expectMaxOne: (node: Element, tagName: string) => {
         const resultElements = childNodesByTagName(node, tagName)
         if (resultElements.length > 1)
            console.error(
               `${descriptor}: more than one <${tagName}/> found in <${node.tagName}/>`,
               mod,
               node,
            )
         return resultElements
      },
   }
}

// TODO: Handle empty string, etc
export const modMetaDataOfString = (commentText: string): StringyModMetaData => {
   const idx = commentText.lastIndexOf(':')
   const name = commentText.substring(0, idx).trim()
   const depIds = commentText
      .substring(idx + 1)
      .split(',')
      .map(s => s.trim() as PackageId)

   return {
      name,
      unversionedModDependencies: depIds.map(
         (packageId): ModDependency => ({ packageId }),
      ),
   } as const
}

export const modMetaDataToString = (modMetaData: StringyModMetaData) => {
   const name = modMetaData.name
   const deps = getModDependenciesByVersion(modMetaData, '1.4')

   if (!deps || deps.length === 0) return name
   const depIds = deps?.map(({ packageId }) => packageId).join(', ')

   if (!name) return depIds
   return `${name}: ${depIds}`
}

const parseModDependencies = (mod: ModMetaData, modDependenciesElement: Element) => {
   const dependencies: (ModDependency | void)[] = childNodesByTagName(
      modDependenciesElement,
      'li',
   ).map((dependencyLi, i) => {
      const packageId =
         childNodesByTagName(dependencyLi, 'packageId')[0]?.textContent || undefined
      const displayName =
         childNodesByTagName(dependencyLi, 'displayName')[0]?.textContent || undefined

      if (!packageId)
         return console.error(
            `mod metadata error: ${mod.packageId}: dependency '${
               displayName || '№.' + i
            }' has no <packageId/>`,
            dependencyLi,
         )

      if (!displayName)
         console.warn(
            `mod metadata error: ${mod.packageId}: dependency '${
               packageId || '№.' + i
            }' has no <displayName/>`,
            dependencyLi,
         )

      const steamWorkshopUrl =
         childNodesByTagName(dependencyLi, 'steamWorkshopUrl')[0]?.textContent ||
         undefined
      const downloadUrl =
         childNodesByTagName(dependencyLi, 'downloadUrl')[0]?.textContent || undefined

      return {
         packageId: packageId as PackageId,
         displayName,
         steamWorkshopUrl,
         downloadUrl,
      }
   }) // dependencies = childNodesByTagName(modDependencies, "li").map

   const result = dependencies.filter(Boolean)

   return result as ModDependency[]
}

const parseModAboutXml = async (
   contentSource: ContentSource,
   folderName: string,
   modAboutXml: FileSystemFileEntry,
) => {
   const modAboutXmlContent = await filePromise(modAboutXml)
   const modAboutXmlContentText = await modAboutXmlContent.text()

   const parser = new DOMParser()
   const root = parser.parseFromString(modAboutXmlContentText, 'text/xml').documentElement

   const mod = Verse.ModMetaData.Init(contentSource, folderName, root)

   const h = helpers(mod)

   const modDependencies = h.expectMaxOne(root, 'modDependencies')
   if (modDependencies.length !== 0) {
      const dependencies = parseModDependencies(mod, modDependencies[0])
      mod.unversionedModDependencies = dependencies
   }

   const modDependenciesByVersion = h.expectMaxOne(root, 'modDependenciesByVersion')
   if (modDependenciesByVersion.length !== 0) {
      mod.modDependenciesByVersion = {}

      for (const version of knownVersions) {
         const versionElement = h.expectMaxOne(modDependenciesByVersion[0], 'v' + version)
         if (versionElement.length === 0) continue

         const dependencies = parseModDependencies(mod, versionElement[0])
         mod.modDependenciesByVersion[version] = dependencies
      }
   }

   const loadAfter = h.expectMaxOne(root, 'loadAfter')
   if (loadAfter.length !== 0) {
      const loadAfters = childNodesByTagName(loadAfter[0], 'li')
      const packageIds = loadAfters.map(
         loadAfterLi => loadAfterLi.textContent as PackageId | null,
      )

      mod.loadAfter = packageIds.filter(Boolean) as PackageId[]
   }

   const loadBefore = h.expectMaxOne(root, 'loadBefore')
   if (loadBefore.length !== 0) {
      const loadBefores = childNodesByTagName(loadBefore[0], 'li')
      const packageIds = loadBefores.map(
         loadBeforeLi => loadBeforeLi.textContent as PackageId | null,
      )

      mod.loadBefore = packageIds.filter(Boolean) as PackageId[]
   }

   return mod
}

const parseMod = async (
   contentSource: ContentSource,
   modFileSystemEntry: FileSystemDirectoryEntry,
) => {
   const folderName = modFileSystemEntry.name
   const modEntries = await entriesOfDirectories([modFileSystemEntry])

   const altId =
      'SteamWorkshop' === contentSource ? `Workshop mod ${folderName}` : folderName

   const modAboutFolder = modEntries.find(entry => entry.name === 'About')
   if (!modAboutFolder)
      return console.error(`mod metadata error: ${altId}: no About folder found`)

   if (!entryIsDirectory(modAboutFolder))
      return console.error(`mod metadata error: ${altId}: About/ is not a directory`)

   const modAboutEntries = await entriesOfDirectories([modAboutFolder])
   const modAboutXml = modAboutEntries.find(entry => entry.name === 'About.xml')
   if (!modAboutXml)
      return console.error(`mod metadata error: ${altId}: no About/About.xml found`)

   if (!entryIsFile(modAboutXml))
      return console.error(`mod metadata error: ${altId}: About/About.xml is not a file`)
   return parseModAboutXml(contentSource, folderName, modAboutXml)
}

export { parseMod, parseModAboutXml }
