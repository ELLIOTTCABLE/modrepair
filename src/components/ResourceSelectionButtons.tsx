import { useCallback } from "react"
import type { Dispatch, SetStateAction, MouseEventHandler } from "react"

import { Button } from "dracula-ui"

import { fileOpen, directoryOpen } from "browser-fs-access"
import type { FileWithHandle, FileWithDirectoryAndFileHandle } from "browser-fs-access"

export interface Props {
   fileIsSelected: boolean
   setFileIsSelected: Dispatch<SetStateAction<boolean>>
   modsConfigFile: FileWithHandle
   setModsConfigFile: Dispatch<SetStateAction<FileWithHandle>>
   workshopDirectory: FileWithDirectoryAndFileHandle | undefined
   setWorkshopDirectory: Dispatch<
      SetStateAction<FileWithDirectoryAndFileHandle | undefined>
   >
}

const ResourceSelectionButtons = (props: Props) => {
   return (
      <>
         <SelectFileButton {...props} />
         <SelectWorkshopDirectoryButton {...props} />
      </>
   )
}

const SelectWorkshopDirectoryButton = (props: Props) => {
   const handleWorkshopDirectorySelect: MouseEventHandler = useCallback(
      async (e) => {
         e.preventDefault()
         console.log("handleWorkshopDirectorySelect:", e)

         const workshopDirectories = await directoryOpen({
            recursive: true,
            startIn: "documents",
            id: "rimworld-workshop-mods-directory",
         })

         console.log("workshopDirectories:", workshopDirectories)

         if (workshopDirectories.length !== 1)
            throw new Error("too many directories selected")

         props.setWorkshopDirectory(workshopDirectories[0])
      },
      [props.setWorkshopDirectory],
   )

   let isNextStep = !props.workshopDirectory && props.fileIsSelected

   return (
      <Button
         variant={props.workshopDirectory ? "outline" : undefined}
         color={isNextStep ? "animated" : "cyan"}
         onClick={handleWorkshopDirectorySelect}>
         Select Workshop Directory
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
