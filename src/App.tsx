import { useState } from "react"
import type { FileWithHandle, FileWithDirectoryAndFileHandle } from "browser-fs-access"

import "@fontsource/fira-code/latin-300.css" // fallback; make sure this matches `--code-weight-sm` in index.css
import "@fontsource/fira-code/variable.css"

import "@fontsource/fira-sans/latin.css"

import "./App.css"
import "dracula-ui/styles/dracula-ui.css" // TODO: post-process to remove Google Fonts -_-
import { Box, Text, Anchor } from "dracula-ui"

import ResourceSelectionButtons, {
   type Props as ResourceSelectionButtonsProps,
} from "./components/ResourceSelectionButtons"
import Editor from "./components/Editor"

import type { ModMap } from "./utils/rimworldModMetaData"

import { plainText as exampleModsConfigContent } from "@virtual:plain-text/exampleModsConfig.xml"

const Header = (props: ResourceSelectionButtonsProps) => {
   return (
      <Box as="header">
         <ResourceSelectionButtons {...props} />
      </Box>
   )
}

const Footer = () => {
   return (
      <Box as="footer" p="xs">
         <Text size="lg">
            Made in the 🏔️ with 💗 by{" "}
            <Anchor href="http://ell.io/tt" color="pinkPurple" hoverColor="cyanGreen">
               ELLIOTTCABLE
            </Anchor>
         </Text>
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
      <>
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
         <Footer />
      </>
   )
}

export default App
