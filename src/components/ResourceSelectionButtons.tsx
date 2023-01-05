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

const WorkshopDirectoryDropZone = (props: Props) => {
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

         props.setWorkshopDir(droppedItem)

         const workshopItemEntries = await entriesOfDirectories([droppedItem])
         const modMap = await modMapOfFileSystemEntries(workshopItemEntries)

         props.setModMap(modMap)

         // @ts-ignore
         console.groupEnd('handleWorkshopDirectoryDrop')
      },
      [props.setWorkshopDir],
   )

   const isNextStep = !props.workshopDir && props.fileIsSelected
   const isProcessing = props.workshopDir && !props.modMap
   function whileNotProcessing<T>(v: T): T | undefined {
      return isProcessing ? undefined : v
   }

   return (
      <Button
         variant={isProcessing ? 'ghost' : props.workshopDir ? 'outline' : undefined}
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

const SelectFileButton = (props: Props) => {
   const handleModsConfigFileSelect: MouseEventHandler = useCallback(
      async e => {
         e.preventDefault()

         const modsConfigFile = await fileOpen({
            startIn: 'documents',
            mimeTypes: ['application/xml'],
            description: 'ModsConfig.xml', // unintuitively, this shows up as a 'filetype' to user
            id: 'rimworld-modsconfig-xml',
         })

         props.setModsConfigFile(modsConfigFile)
         props.setFileIsSelected(true)
      },
      [props.setModsConfigFile, props.setFileIsSelected],
   )

   return (
      <Button
         variant={props.fileIsSelected ? 'outline' : undefined}
         color={props.fileIsSelected ? 'pink' : 'animated'}
         onClick={handleModsConfigFileSelect}>
         1. Select ModsConfig.xml
      </Button>
   )
}

export default ResourceSelectionButtons
