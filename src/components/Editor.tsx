import React from "react"
import ReactDOM from "react-dom"

import MonacoEditor from "@monaco-editor/react"
import draculaTheme from "../Dracula.monacotheme.json"
import type * as monaco from "monaco-editor"

import { plainText as exampleModsConfig } from "@virtual:plain-text/../exampleModsConfig.xml"

export default function Editor() {
   function handleEditorWillMount(m: typeof monaco) {
      m.editor.defineTheme("dracula", draculaTheme as monaco.editor.IStandaloneThemeData)
   }

   return (
      <MonacoEditor
         className="editor"
         height="100%"
         theme="dracula"
         defaultLanguage="xml"
         defaultValue={exampleModsConfig}
         beforeMount={handleEditorWillMount}
      />
   )
}
