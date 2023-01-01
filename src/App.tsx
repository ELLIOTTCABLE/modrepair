import { useState } from "react"
import type { FileWithHandle } from "browser-fs-access"

import "./App.css"
import "dracula-ui/styles/dracula-ui.css"
import { Box } from "dracula-ui"

import SelectFileButton, {
   type Props as SelectFileButtonProps,
} from "./components/SelectFileButton"
import Editor from "./components/Editor"

import { plainText as exampleModsConfigContent } from "@virtual:plain-text/exampleModsConfig.xml"

const Header = (props: SelectFileButtonProps) => {
   return (
      <Box m="sm">
         <SelectFileButton {...props} />
      </Box>
   )
}

function App() {
   const exampleModsConfig = new File([exampleModsConfigContent], "ModsConfig.xml", {
      type: "text/plain",
   })

   const [modsConfigFile, setModsConfigFile] = useState<FileWithHandle>(exampleModsConfig)
   const [fileIsSelected, setFileIsSelected] = useState(false)

   return (
      <Box px="md" id="flex-wrapper">
         <Header
            fileIsSelected={fileIsSelected}
            setFileIsSelected={setFileIsSelected}
            modsConfigFile={modsConfigFile}
            setModsConfigFile={setModsConfigFile}
         />
         <Editor modsConfigFile={modsConfigFile} />
      </Box>
   )
}

export default App
