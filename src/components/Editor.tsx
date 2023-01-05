import { useState, useRef, useCallback } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import MonacoEditor from '@monaco-editor/react'
import type * as MonacoReactT from '@monaco-editor/react'
import type * as MonacoT from 'monaco-editor'

import draculaThemeData from '../Dracula.monacotheme.json'

export interface Props {
   modsConfigFile: File
   fileIsSelected?: boolean
}

export default function Editor({ modsConfigFile, fileIsSelected = false }: Props) {
   const [content, setContent] = useState('<!-- Uninitialized content -->')
   const editorRef = useRef<MonacoT.editor.IStandaloneCodeEditor | null>(null)

   useAsyncEffect(
      async isStillMounted => {
         let modsConfigText = await modsConfigFile.text()
         if (!isStillMounted()) return

         updateEditorContent(modsConfigText)
      },
      [modsConfigFile],
   )

   const updateEditorContent = (content: string) => {
      setContent(content)
      editorRef.current?.getModel()?.setValue(content)
   }

   const handleModelContentDidChange = useCallback(
      (ev: MonacoT.editor.IModelContentChangedEvent) => {
         let newContent = editorRef.current?.getModel()?.getValue()
         console.log('handleModelContentDidChange', newContent, ev)
         if (newContent !== content) setContent(newContent || '')
      },
      [editorRef, setContent],
   )

   const handleEditorWillMount: MonacoReactT.BeforeMount = monaco => {
      const themeData = draculaThemeData as MonacoT.editor.IStandaloneThemeData
      monaco.editor.defineTheme('dracula', themeData)
   }

   const handleEditorDidMount: MonacoReactT.OnMount = async (editor, _monaco) => {
      console.log('handleEditorDidMount', editor, _monaco)
      editorRef.current = editor

      updateEditorContent(await modsConfigFile.text())

      editor.onDidChangeModelContent(handleModelContentDidChange)
   }

   const root = document.documentElement,
      cvFiraCode = getComputedStyle(root).getPropertyValue('--fira-code'),
      cvCodeWeightSm = getComputedStyle(root).getPropertyValue('--code-weight-sm')

   return (
      <MonacoEditor
         options={{
            formatOnPaste: true,
            formatOnType: true,

            // TODO: update these when they change ...
            fontFamily: cvFiraCode,
            fontSize: 14,
            fontWeight: cvCodeWeightSm,
            lineHeight: 1.375, // Dracula --
         }}
         className='editor'
         height='100%'
         theme='dracula'
         defaultLanguage='xml'
         // defaultValue={modsConfigFile}
         beforeMount={handleEditorWillMount}
         onMount={handleEditorDidMount}
         // onChange={handleEditorDidChange}
      />
   )
}
