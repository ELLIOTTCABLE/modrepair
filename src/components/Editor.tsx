import { useState, useRef, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import MonacoEditor from '@monaco-editor/react'
import type * as MonacoReactT from '@monaco-editor/react'
import type * as MonacoT from 'monaco-editor'

import draculaThemeData from '../Dracula.monacotheme.json'

import type { ModMap } from '../utils/rimworld/modMetaData'

declare global {
   interface Console {
      groupEnd(label: string): void
   }
}

export interface Props {
   modsConfigFile: File
   modMap?: ModMap
   setModMap: Dispatch<SetStateAction<ModMap | undefined>>
   fileIsSelected?: boolean
}

export default function Editor({
   modsConfigFile,
   modMap,
   setModMap,
   fileIsSelected = false,
}: Props) {
   const [content, setContent] = useState('<!-- Uninitialized content -->')
   const editorRef = useRef<MonacoT.editor.IStandaloneCodeEditor | null>(null)

   useAsyncEffect(
      async function modsConfigFileChanged(isStillMounted) {
         const modsConfigText = await modsConfigFile.text()
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
         const newContent = editorRef.current?.getModel()?.getValue()
         console.groupCollapsed('handleModelContentDidChange')
         console.log('handleModelContentDidChange:', newContent, ev)
         console.groupEnd('handleModelContentDidChange')
         setContent(newContent || '')
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
