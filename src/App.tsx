import { useState } from "react"
import "./App.css"

import Editor from "./Editor"

function SelectFileButton() {
   return <button>Select ModsConfig</button>
}

function Header() {
   return (
      <>
         <SelectFileButton />
      </>
   )
}

function App() {
   return (
      <>
         <Header />
         <Editor />
      </>
   )
}

export default App
