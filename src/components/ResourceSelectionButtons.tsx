import { useCallback } from 'react'
import type { Dispatch, SetStateAction, DragEventHandler, MouseEventHandler } from 'react'

import { Button } from 'dracula-ui'

import { fileOpen } from 'browser-fs-access'

import { entryIsDirectory, entriesOfDirectories } from '../utils/directoryReader'
import type { ModsConfigFile } from '../App'

import { parseMod } from '../utils/rimworld/modMetaData'
import type { ModMap } from '../utils/rimworld/modMetaData'

declare global {
   interface Console {
      groupEnd(label: string): void
   }
}

export interface Props {
   modsConfigFile: ModsConfigFile
   setModsConfigFile: Dispatch<SetStateAction<ModsConfigFile>>
   workshopDir?: FileSystemEntry
   setWorkshopDir: Dispatch<SetStateAction<FileSystemEntry | undefined>>
   modMap?: ModMap
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
         modMap.set(modMetaData.packageId.toLowerCase(), modMetaData)
   }
   console.timeEnd('modMapOfFileSystemEntries')
   return modMap
}

const WorkshopDirectoryDropZone = ({
   modsConfigFile: { isUserSelected },
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

         console.groupEnd('handleWorkshopDirectoryDrop')
      },
      [setWorkshopDir, setModMap],
   )

   const isNextStep = !workshopDir && isUserSelected
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
   modsConfigFile: { isUserSelected },
   setModsConfigFile,
}: Props) => {
   const handleModsConfigFileSelect: MouseEventHandler = useCallback(
      async e => {
         e.preventDefault()
         console.log('handleModsConfigFileSelect:', e)

         const modsConfigFile = await fileOpen({
            startIn: 'documents',
            mimeTypes: ['application/xml'],
            description: 'ModsConfig.xml', // unintuitively, this shows up as a 'filetype' to user
            id: 'rimworld-modsconfig-xml',
         })

         setModsConfigFile({ file: modsConfigFile, isUserSelected: true })
      },
      [setModsConfigFile],
   )

   return (
      <Button
         variant={isUserSelected ? 'outline' : undefined}
         color={isUserSelected ? 'pink' : 'animated'}
         onClick={handleModsConfigFileSelect}>
         1. Select ModsConfig.xml
      </Button>
   )
}

export default ResourceSelectionButtons
