import { useCallback } from "react"
import type { Dispatch, SetStateAction, DragEventHandler, MouseEventHandler } from "react"

import { Button } from "dracula-ui"

import { fileOpen } from "browser-fs-access"
import type { FileWithHandle } from "browser-fs-access"

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

const WorkshopDirectoryDropZone = (props: Props) => {
   const handleMisClick: MouseEventHandler = useCallback((e) => {
      e.preventDefault()
      console.log("handleClick:", e)
      throw new Error("you can't click here")
   }, [])

   const handleWorkshopDirectoryDrop: DragEventHandler = useCallback(
      async (e) => {
         e.preventDefault()
         console.log("handleWorkshopDirectorySelect:", e)

         const droppedItems = e.dataTransfer.items
         if (droppedItems.length !== 1) throw new Error("too many directories selected")

         const workshopDirectory = droppedItems[0].webkitGetAsEntry()
         console.log("workshopDirectory:", workshopDirectory)

         if (!workshopDirectory) throw new Error("no directory selected")

         props.setWorkshopDirectory(workshopDirectory)
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
         console.log("handleModsConfigFileSelect:", e)

         const modsConfigFile = await fileOpen({
            startIn: "documents",
            mimeTypes: ["application/xml"],
            description: "ModsConfig.xml", // unintuitively, this shows up as a 'filetype' to user
            id: "rimworld-modsconfig-xml",
         })

         console.log("modsConfigFile:", modsConfigFile)

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
