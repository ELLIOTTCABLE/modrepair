import { useCallback } from "react"
import type { Dispatch, SetStateAction, DragEventHandler, MouseEventHandler } from "react"

import { Button } from "dracula-ui"

import { fileOpen } from "browser-fs-access"
import type { FileWithHandle } from "browser-fs-access"

import {
   filePromise,
   entriesOfDroppedItems,
   entriesOfDirectories,
} from "../utils/directoryReader"

export type ModInfo = {
   id: string
}

export interface Props {
   fileIsSelected: boolean
   setFileIsSelected: Dispatch<SetStateAction<boolean>>
   modsConfigFile: FileWithHandle
   setModsConfigFile: Dispatch<SetStateAction<FileWithHandle>>
   workshopDirectory: FileSystemEntry | undefined
   setWorkshopDirectory: Dispatch<SetStateAction<FileSystemEntry | undefined>>
}

const ResourceSelectionButtons = (props: Props) => {
   return (
      <>
         <SelectFileButton {...props} />
         <WorkshopDirectoryDropZone {...props} />
      </>
   )
}

const entryIsDirectory = (entry: FileSystemEntry): entry is FileSystemDirectoryEntry => {
   return entry.isDirectory
}

const entryIsFile = (entry: FileSystemEntry): entry is FileSystemFileEntry => {
   return entry.isFile
}

const parseModAboutXml = async (
   alternativeId: string,
   modAboutXml: FileSystemFileEntry,
) => {
   const modAboutXmlContent = await filePromise(modAboutXml)
   const modAboutXmlContentText = await modAboutXmlContent.text()

   const parser = new DOMParser()
   const modAboutXmlDocument = parser.parseFromString(modAboutXmlContentText, "text/xml")
   const root = modAboutXmlDocument.documentElement

   if (root?.tagName !== "ModMetaData") {
      console.error(`mod ${alternativeId}: no <ModMetaData/> found`, root)
   }

   const packageId = root.getElementsByTagName("packageId")[0]?.textContent
   const name = root.getElementsByTagName("name")[0]?.textContent
   const errorId = `${alternativeId}, ${packageId || name}`
   if (!packageId) console.error(`mod ${errorId}: no <packageId/> found`, root)
   if (!name) console.error(`mod ${errorId}: no <name/> found`, root)

   return {
      id: packageId,
      name,
   }
}

const parseMod = async (modFileSystemEntry: FileSystemDirectoryEntry) => {
   const alternativeId = modFileSystemEntry.name
   const modEntries = await entriesOfDirectories([modFileSystemEntry])

   const modAboutFolder = modEntries.find((entry) => entry.name === "About")
   if (!modAboutFolder)
      return console.error(`workshop item ${alternativeId}: no About folder found`)

   if (!entryIsDirectory(modAboutFolder))
      return console.error(`workshop item ${alternativeId}: About/ is not a directory`)

   const modAboutEntries = await entriesOfDirectories([modAboutFolder])
   const modAboutXml = modAboutEntries.find((entry) => entry.name === "About.xml")
   if (!modAboutXml)
      return console.error(`workshop item ${alternativeId}: no About/About.xml found`)

   if (!entryIsFile(modAboutXml))
      return console.error(
         `workshop item ${alternativeId}: About/About.xml is not a file`,
      )
   return parseModAboutXml(alternativeId, modAboutXml)
}

const modMapOfFileSystemEntries = async (entries: FileSystemEntry[]) => {
   const modMap = new Map<string, FileSystemEntry>()
   for (const entry of entries) {
      if (!entryIsDirectory(entry)) continue

      const details = await parseMod(entry)
      if (details && details.id) modMap.set(details.id, entry)
   }
   return modMap
}

const WorkshopDirectoryDropZone = (props: Props) => {
   const handleMisClick: MouseEventHandler = useCallback((e) => {
      e.preventDefault()
      throw new Error("you can't click here")
   }, [])

   const handleWorkshopDirectoryDrop: DragEventHandler = useCallback(
      async (e) => {
         e.preventDefault()

         const droppedItems = e.dataTransfer.items
         if (droppedItems.length !== 1) throw new Error("too many directories selected")

         const workshopItemEntries = await entriesOfDroppedItems(droppedItems)

         const workshopItems = await modMapOfFileSystemEntries(workshopItemEntries)

         props.setWorkshopDirectory(workshopItems)
      },
      [props.setWorkshopDirectory],
   )

   let isNextStep = !props.workshopDirectory && props.fileIsSelected

   return (
      <Button
         variant={props.workshopDirectory ? "outline" : undefined}
         color={isNextStep ? "animated" : "cyan"}
         onClick={handleMisClick}
         onDragOver={(e) => {
            e.preventDefault()
         }}
         onDrop={handleWorkshopDirectoryDrop}>
         Drag & drop Workshop "294100" directory here
      </Button>
   )
}

const SelectFileButton = (props: Props) => {
   const handleModsConfigFileSelect: MouseEventHandler = useCallback(
      async (e) => {
         e.preventDefault()

         const modsConfigFile = await fileOpen({
            startIn: "documents",
            mimeTypes: ["application/xml"],
            description: "ModsConfig.xml", // unintuitively, this shows up as a 'filetype' to user
            id: "rimworld-modsconfig-xml",
         })

         props.setModsConfigFile(modsConfigFile)
         props.setFileIsSelected(true)
      },
      [props.setModsConfigFile, props.setFileIsSelected],
   )

   return (
      <Button
         variant={props.fileIsSelected ? "outline" : undefined}
         color={props.fileIsSelected ? "cyan" : "animated"}
         onClick={handleModsConfigFileSelect}>
         Select ModsConfig.xml
      </Button>
   )
}

export default ResourceSelectionButtons
