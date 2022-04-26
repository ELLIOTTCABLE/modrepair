import React from "react"
import ReactDOM from "react-dom"

import MonacoEditor from "@monaco-editor/react"
import draculaTheme from "./Dracula.monacotheme.json"
import type { Monaco } from "monaco-editor"

export default function Editor() {
   function handleEditorWillMount(monaco: Monaco) {
      monaco.editor.defineTheme("dracula", draculaTheme)
   }

   return (
      <MonacoEditor
         className="editor"
         height="90vh"
         theme="dracula"
         defaultLanguage="xml"
         defaultValue="<!-- Click above to begin -->"
         beforeMount={handleEditorWillMount}
      />
   )
}
