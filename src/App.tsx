import { useState } from "react"
import type { FileWithHandle, FileWithDirectoryAndFileHandle } from "browser-fs-access"

import "./App.css"
import "dracula-ui/styles/dracula-ui.css"
import { Box } from "dracula-ui"

import ResourceSelectionButtons, {
   type Props as ResourceSelectionButtonsProps,
} from "./components/ResourceSelectionButtons"
import Editor from "./components/Editor"

import type { ModMap } from "./utils/rimworldModMetaData"

import { plainText as exampleModsConfigContent } from "@virtual:plain-text/exampleModsConfig.xml"

const Header = (props: ResourceSelectionButtonsProps) => {
   return (
      <Box m="sm">
         <ResourceSelectionButtons {...props} />
      </Box>
   )
}

function App() {
   const exampleModsConfig = new File([exampleModsConfigContent], "ModsConfig.xml", {
      type: "text/plain",
   })

   const [modsConfigFile, setModsConfigFile] = useState<FileWithHandle>(exampleModsConfig)
   const [fileIsSelected, setFileIsSelected] = useState(false)
   const [workshopDir, setWorkshopDir] = useState<FileSystemEntry | undefined>()
   const [modMap, setModMap] = useState<ModMap | undefined>()

   return (
      <Box px="md" id="flex-wrapper">
         <Header
            fileIsSelected={fileIsSelected}
            setFileIsSelected={setFileIsSelected}
            modsConfigFile={modsConfigFile}
            setModsConfigFile={setModsConfigFile}
            workshopDir={workshopDir}
            setWorkshopDir={setWorkshopDir}
            modMap={modMap}
            setModMap={setModMap}
         />
         <Editor modsConfigFile={modsConfigFile} />
      </Box>
   )
}

export default App
