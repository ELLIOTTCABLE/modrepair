import { useState, useMemo, useRef, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import MonacoEditor from '@monaco-editor/react'
import type * as MonacoReactT from '@monaco-editor/react'
import type * as MonacoT from 'monaco-editor'

import draculaThemeData from '../Dracula.monacotheme.json'

import type { ModMap } from '../utils/rimworld/modMetaData'
import { parseModsConfig } from '../utils/rimworld/modsConfig'

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

const consoleLogLongString: Console['log'] = (
   descriptor: string,
   content: string,
   ...args
) => {
   const firstLine = (content.match(/^.*$/m) || [])[0]
   if (firstLine && firstLine !== content) {
      console.groupCollapsed(descriptor + ' ' + firstLine)
      console.log(descriptor, content, ...args)
      console.groupEnd(descriptor + ' ' + firstLine)
   } else {
      console.log(descriptor, content, ...args)
   }
}

export default function Editor({
   modsConfigFile,
   modMap,
   setModMap,
   fileIsSelected = false,
}: Props) {
   const initialText = '<!-- Loading content ... -->'
   const [xmlText, setXmlText] = useState(initialText)
   const xmlDOM = useMemo(
      function updateXmlDOM() {
         consoleLogLongString('updateXmlDOM:', xmlText)
         return parseModsConfig(xmlText)
      },
      [xmlText],
   )

   const editorRef = useRef<MonacoT.editor.IStandaloneCodeEditor | null>(null)

   useAsyncEffect(
      async function modsConfigFileChanged(isStillMounted) {
         const modsConfigText = await modsConfigFile.text()
         consoleLogLongString('modsConfigFileChanged:', modsConfigText)

         if (!editorRef || !isStillMounted()) return
         updateEditorContent(modsConfigText)
      },
      [modsConfigFile],
   )

   // FIXME: WHY DOES THIS GET CALLED TWICE ON FIRST LOAD
   const updateEditorContent = (content: string) => {
      consoleLogLongString('updateEditorContent:', content)
      setXmlText(content)
      editorRef.current?.getModel()?.setValue(content)
   }

   const handleModelContentDidChange = useCallback(
      (ev: MonacoT.editor.IModelContentChangedEvent) => {
         const newContent = editorRef.current?.getModel()?.getValue()
         consoleLogLongString('handleModelContentDidChange:', newContent, ev)
         setXmlText(newContent || '')
      },
      [editorRef, setXmlText],
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
