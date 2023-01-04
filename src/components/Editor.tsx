import { useState, useRef, useCallback } from "react"
import { useAsyncEffect } from "use-async-effect"

import MonacoEditor from "@monaco-editor/react"
import type * as MonacoReactT from "@monaco-editor/react"
import type * as MonacoT from "monaco-editor"

import draculaThemeData from "../Dracula.monacotheme.json"

export interface Props {
   modsConfigFile: File
   fileIsSelected?: boolean
}

// TODO: Derive this dynamically, somehow, from
//    <https://github.com/csstools/sanitize.css/blob/main/typography.css>
const uiMonospace = `ui-monospace,
   /* macOS 10.10+ */ "Menlo",
   /* Windows 6+ */ "Consolas",
   /* Android 4+ */ "Roboto Mono",
   /* Ubuntu 10.10+ */ "Ubuntu Monospace",
   /* KDE Plasma 5+ */ "Noto Mono",
   /* KDE Plasma 4+ */ "Oxygen Mono",
   /* Linux/OpenOffice fallback */ "Liberation Mono",
   /* fallback */ monospace,
   /* macOS emoji */ "Apple Color Emoji",
   /* Windows emoji */ "Segoe UI Emoji",
   /* Windows emoji */ "Segoe UI Symbol",
   /* Linux emoji */ "Noto Color Emoji"`

export default function Editor({ modsConfigFile, fileIsSelected = false }: Props) {
   const [content, setContent] = useState("<!-- Uninitialized content -->")
   const editorRef = useRef<MonacoT.editor.IStandaloneCodeEditor | null>(null)

   const updateEditorContent = (content: string) => {
      setContent(content)
      editorRef.current?.getModel()?.setValue(content)
   }

   const handleModelContentDidChange = useCallback(
      (ev: MonacoT.editor.IModelContentChangedEvent) => {
         let newContent = editorRef.current?.getModel()?.getValue()
         console.log("handleModelContentDidChange", newContent, ev)
         if (newContent !== content) setContent(newContent || "")
      },
      [editorRef, setContent],
   )

   useAsyncEffect(
      async (isStillMounted) => {
         let modsConfigText = await modsConfigFile.text()
         if (!isStillMounted()) return

         updateEditorContent(modsConfigText)
      },
      [modsConfigFile],
   )

   const handleEditorWillMount: MonacoReactT.BeforeMount = (monaco) => {
      const themeData = draculaThemeData as MonacoT.editor.IStandaloneThemeData
      monaco.editor.defineTheme("dracula", themeData)
   }

   const handleEditorDidMount: MonacoReactT.OnMount = async (editor, _monaco) => {
      console.log("handleEditorDidMount", editor, _monaco)
      editorRef.current = editor

      updateEditorContent(await modsConfigFile.text())

      editor.onDidChangeModelContent(handleModelContentDidChange)
   }

   return (
      <MonacoEditor
         options={{
            formatOnPaste: true,
            formatOnType: true,

            // TODO: Derive these dynamically, somehow
            fontFamily: uiMonospace,
            fontSize: 16,
            lineHeight: 1.375, // Dracula --line-height-md
         }}
         className="editor"
         height="100%"
         theme="dracula"
         defaultLanguage="xml"
         // defaultValue={modsConfigFile}
         beforeMount={handleEditorWillMount}
         onMount={handleEditorDidMount}
         // onChange={handleEditorDidChange}
      />
   )
}
