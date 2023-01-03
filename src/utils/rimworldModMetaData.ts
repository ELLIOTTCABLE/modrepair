import {
   entryIsFile,
   entryIsDirectory,
   filePromise,
   entriesOfDirectories,
} from "../utils/directoryReader"

import Verse from "./rimworldVerse"

export type ContentSource =
   | "Undefined"
   | "OfficialModsFolder"
   | "ModsFolder"
   | "SteamWorkshop"

export type ModMetaData = {
   contentSource: ContentSource
   packageId: string
   name: string
   author?: string
   description?: string
}

const parseModAboutXml = async (
   contentSource: ContentSource,
   folderName: string,
   modAboutXml: FileSystemFileEntry,
) => {
   const modAboutXmlContent = await filePromise(modAboutXml)
   const modAboutXmlContentText = await modAboutXmlContent.text()

   const parser = new DOMParser()
   const modAboutXmlDocument = parser.parseFromString(modAboutXmlContentText, "text/xml")

   const mod = Verse.ModMetaData.Init("SteamWorkshop", folderName, modAboutXmlDocument)

   return mod
}

const parseMod = async (
   contentSource: ContentSource,
   modFileSystemEntry: FileSystemDirectoryEntry,
) => {
   const folderName = modFileSystemEntry.name
   const modEntries = await entriesOfDirectories([modFileSystemEntry])

   const altId =
      "SteamWorkshop" === contentSource ? `Workshop mod ${folderName}` : folderName

   const modAboutFolder = modEntries.find((entry) => entry.name === "About")
   if (!modAboutFolder)
      return console.error(`mod metadata error: ${altId}: no About folder found`)

   if (!entryIsDirectory(modAboutFolder))
      return console.error(`mod metadata error: ${altId}: About/ is not a directory`)

   const modAboutEntries = await entriesOfDirectories([modAboutFolder])
   const modAboutXml = modAboutEntries.find((entry) => entry.name === "About.xml")
   if (!modAboutXml)
      return console.error(`mod metadata error: ${altId}: no About/About.xml found`)

   if (!entryIsFile(modAboutXml))
      return console.error(`mod metadata error: ${altId}: About/About.xml is not a file`)
   return parseModAboutXml(contentSource, folderName, modAboutXml)
}

export { parseMod, parseModAboutXml }
