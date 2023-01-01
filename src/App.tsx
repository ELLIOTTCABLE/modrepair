import { useState } from "react"
import "./App.css"

import "dracula-ui/styles/dracula-ui.css"
import { Box, Button } from "dracula-ui"

import Editor from "./Editor"

function SelectFileButton() {
   return <Button color="cyan">Select ModsConfig.xml</Button>
}

function Header() {
   return (
      <Box m="sm">
         <SelectFileButton />
      </Box>
   )
}

function App() {
   return (
      <Box px="md" id="flex-wrapper">
         <Header />
         <Editor />
      </Box>
   )
}

export default App
