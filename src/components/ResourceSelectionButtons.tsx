import { useCallback } from 'react'
import type { Dispatch, SetStateAction, DragEventHandler, MouseEventHandler } from 'react'

import { Button } from 'dracula-ui'

import { fileOpen } from 'browser-fs-access'
import type { FileWithHandle } from 'browser-fs-access'

import { entryIsDirectory, entriesOfDirectories } from '../utils/directoryReader'

import { ModMap, parseMod } from '../utils/rimworldModMetaData'

export interface Props {
   fileIsSelected: boolean
   setFileIsSelected: Dispatch<SetStateAction<boolean>>
   modsConfigFile: FileWithHandle
   setModsConfigFile: Dispatch<SetStateAction<FileWithHandle>>
   workshopDir: FileSystemEntry | undefined
   setWorkshopDir: Dispatch<SetStateAction<FileSystemEntry | undefined>>
   modMap: ModMap | undefined
   setModMap: Dispatch<SetStateAction<ModMap | undefined>>
}

const ResourceSelectionButtons = (props: Props) => {
   return (
      <>
         <SelectFileButton {...props} />
         <WorkshopDirectoryDropZone {...props} />
      </>
   )
}

const modMapOfFileSystemEntries = async (entries: FileSystemEntry[]) => {
   console.time('modMapOfFileSystemEntries')
   const modMap: ModMap = new Map()
   for (const entry of entries) {
      if (!entryIsDirectory(entry)) continue

      const modMetaData = await parseMod('SteamWorkshop', entry)
      if (modMetaData && modMetaData.packageId)
         modMap.set(modMetaData.packageId, modMetaData)
   }
   console.timeEnd('modMapOfFileSystemEntries')
   return modMap
}

const WorkshopDirectoryDropZone = ({
   fileIsSelected,
   workshopDir,
   setWorkshopDir,
   modMap,
   setModMap,
}: Props) => {
   const handleMisClick: MouseEventHandler = useCallback(e => {
      e.preventDefault()
      throw new Error("you can't click here")
   }, [])

   const handleWorkshopDirectoryDrop: DragEventHandler = useCallback(
      async e => {
         e.preventDefault()
         console.groupCollapsed('handleWorkshopDirectoryDrop')

         const droppedItems = e.dataTransfer.items
         const droppedItem = droppedItems[0].webkitGetAsEntry()
         if (droppedItems.length !== 1) throw new Error('too many directories selected')
         if (!droppedItem) throw new Error('no directory selected')

         setWorkshopDir(droppedItem)

         const workshopItemEntries = await entriesOfDirectories([droppedItem])
         const modMap = await modMapOfFileSystemEntries(workshopItemEntries)

         setModMap(modMap)

         // @ts-ignore
         console.groupEnd('handleWorkshopDirectoryDrop')
      },
      [setWorkshopDir, setModMap],
   )

   const isNextStep = !workshopDir && fileIsSelected
   const isProcessing = workshopDir && !modMap
   function whileNotProcessing<T>(v: T): T | undefined {
      return isProcessing ? undefined : v
   }

   return (
      <Button
         variant={isProcessing ? 'ghost' : workshopDir ? 'outline' : undefined}
         color={isNextStep ? 'animated' : 'pink'}
         onClick={whileNotProcessing(handleMisClick)}
         onDragOver={whileNotProcessing(e => {
            e.preventDefault()
         })}
         onDrop={whileNotProcessing(handleWorkshopDirectoryDrop)}>
         {isProcessing ? 'Processing mods…' : '2. Drop "294100" directory'}
      </Button>
   )
}

const SelectFileButton = ({
   setModsConfigFile,
   fileIsSelected,
   setFileIsSelected,
}: Props) => {
   const handleModsConfigFileSelect: MouseEventHandler = useCallback(
      async e => {
         e.preventDefault()

         const modsConfigFile = await fileOpen({
            startIn: 'documents',
            mimeTypes: ['application/xml'],
            description: 'ModsConfig.xml', // unintuitively, this shows up as a 'filetype' to user
            id: 'rimworld-modsconfig-xml',
         })

         setModsConfigFile(modsConfigFile)
         setFileIsSelected(true)
      },
      [setModsConfigFile, setFileIsSelected],
   )

   return (
      <Button
         variant={fileIsSelected ? 'outline' : undefined}
         color={fileIsSelected ? 'pink' : 'animated'}
         onClick={handleModsConfigFileSelect}>
         1. Select ModsConfig.xml
      </Button>
   )
}

export default ResourceSelectionButtons
