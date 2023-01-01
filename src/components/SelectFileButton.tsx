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
            id: "modsconfig-xml",
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

export default SelectFileButton
