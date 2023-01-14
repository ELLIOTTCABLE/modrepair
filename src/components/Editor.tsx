import { useState, useRef, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import MonacoEditor from '@monaco-editor/react'
import type * as MonacoReactT from '@monaco-editor/react'
import type * as MonacoT from 'monaco-editor'

import draculaThemeData from '../Dracula.monacotheme.json'

import type { ModMap } from '../utils/rimworld/modMetaData'
import { parseModsConfig } from '../utils/rimworld/modsConfig'
import type { ModsConfigFile } from '../App'

declare global {
   interface Console {
      groupEnd(label: string): void
   }
}

export interface Props {
   modsConfigFile: ModsConfigFile
   modMap?: ModMap
   setModMap: Dispatch<SetStateAction<ModMap | undefined>>
}

const consoleLogLongString = (
   descriptor?: string,
   content?: string,
   ...args: Parameters<Console['log']>
) => {
   const firstLine = (content?.match(/^.*$/m) || [])[0]
   if (firstLine && firstLine !== content) {
      console.groupCollapsed(descriptor + ' ' + firstLine)
      console.log(descriptor, content, ...args)
      console.groupEnd(descriptor + ' ' + firstLine)
   } else {
      console.log(descriptor, content, ...args)
   }
}

export default function Editor({ modsConfigFile, modMap, setModMap }: Props) {
   const initialText = '<ModsConfigData><!-- Loading content ... --></ModsConfigData>'
   const [modsConfig, setModsConfig] = useState(() => parseModsConfig(initialText))

   const editorRef = useRef<MonacoT.editor.IStandaloneCodeEditor | null>(null)

   // FIXME: WHY DOES THIS GET CALLED TWICE ON FIRST LOAD
   const updateEditorContent = (content: string) => {
      consoleLogLongString('updateEditorContent:', content)
      setModsConfig(parseModsConfig(content))
      editorRef.current?.getModel()?.setValue(content)
   }

   const replaceEditorFile = useCallback(
      async (isStillMounted: () => boolean) => {
         // TODO: create a new Monaco model
         const modsConfigText = await modsConfigFile.file.text()
         consoleLogLongString('replaceEditorFile:', modsConfigText)

         if (editorRef && isStillMounted()) updateEditorContent(modsConfigText)
      },
      [editorRef, modsConfigFile],
   )

   useAsyncEffect(
      function modsConfigFileChanged(isStillMounted) {
         return replaceEditorFile(isStillMounted)
      },
      [modsConfigFile],
   )

   const handleModelContentDidChange = useCallback(
      (ev: MonacoT.editor.IModelContentChangedEvent) => {
         const newContent = editorRef.current?.getModel()?.getValue()
         consoleLogLongString('handleModelContentDidChange:', newContent, ev)

         if (newContent) {
            const newModsConfig = parseModsConfig(newContent)
            if (newModsConfig) setModsConfig(newModsConfig)
         }
      },
      [editorRef, setModsConfig],
   )

   const handleEditorWillMount: MonacoReactT.BeforeMount = monaco => {
      const themeData = draculaThemeData as MonacoT.editor.IStandaloneThemeData
      monaco.editor.defineTheme('dracula', themeData)
   }

   const handleEditorDidMount: MonacoReactT.OnMount = async (editor, _monaco) => {
      console.log('handleEditorDidMount', editor, _monaco)
      editorRef.current = editor

      replaceEditorFile(() => true)

      editor.onDidChangeModelContent(handleModelContentDidChange)
   }

   const root = document.documentElement,
      cvFiraCode = getComputedStyle(root).getPropertyValue('--fira-code'),
      cvCodeWeightSm = getComputedStyle(root).getPropertyValue('--code-weight-sm')

   console.log('rendering Editor')

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
         beforeMount={handleEditorWillMount}
         onMount={handleEditorDidMount}
         // onChange={handleEditorDidChange}
      />
   )
}
