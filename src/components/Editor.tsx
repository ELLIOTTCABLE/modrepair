import { useState, useEffect, useRef, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import useFontFaceObserver from 'use-font-face-observer'

import MonacoEditor from '@monaco-editor/react'
import type * as MonacoReactT from '@monaco-editor/react'
import type * as MonacoT from 'monaco-editor'

import draculaThemeData from '../Dracula.monacotheme.json'

import type { ModsConfigFile } from '../App'
import type { ModMap } from '../utils/rimworld/modMetaData'
import type { ModsConfig } from '../utils/rimworld/modsConfig'
import { parseModsConfig, updateModsConfigWithModMap } from '../utils/rimworld/modsConfig'

declare global {
   interface Console {
      groupEnd(label: string): void
   }
}

export interface Props {
   modsConfigFile: ModsConfigFile
   modMap: ModMap
   setModMap: Dispatch<SetStateAction<ModMap>>
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
   const isFontLoaded = useFontFaceObserver([{ family: 'Fira Code' }])

   const initialText = '<ModsConfigData><!-- Loading content ... --></ModsConfigData>'
   const [modsConfig, setModsConfig] = useState(() => parseModsConfig(initialText))

   const editorRef = useRef<MonacoT.editor.IStandaloneCodeEditor | null>(null)
   const monacoRef = useRef<typeof MonacoT | null>(null)

   const updateEditorContent = useCallback(
      (arg: ((prev: ModsConfig) => ModsConfig) | ModsConfig): void => {
         if (typeof arg !== 'function') {
            const cb = () => arg
            return updateEditorContent(cb)
         }

         console.log('updateEditorContent queued:', arg)
         setModsConfig(prevModsConfig => {
            const newModsConfig = arg(prevModsConfig)
            console.log('updateEditorContent:', newModsConfig)

            if (!Object.is(newModsConfig, prevModsConfig)) {
               editorRef.current?.getModel()?.setValue(newModsConfig.text)
               return newModsConfig
            } else {
               return prevModsConfig
            }
         })
      },
      [editorRef],
   )

   const replaceEditorFile = useCallback(
      async (isStillMounted: () => boolean) => {
         // TODO: create a new Monaco model
         const modsConfigText = await modsConfigFile.file.text()
         consoleLogLongString('replaceEditorFile:', modsConfigText)

         if (editorRef && isStillMounted())
            updateEditorContent(parseModsConfig(modsConfigText))
      },
      [editorRef, modsConfigFile, updateEditorContent],
   )

   useAsyncEffect(
      function modsConfigFileChanged(isStillMounted) {
         return replaceEditorFile(isStillMounted)
      },
      [replaceEditorFile],
   )

   useEffect(
      function modMapChanged() {
         updateEditorContent(prevModsConfig => {
            console.log('modMapChanged:', modMap)
            const newModsConfig = updateModsConfigWithModMap(prevModsConfig, modMap)
            if (newModsConfig) return parseModsConfig(newModsConfig)
            else return prevModsConfig
         })
      },
      [updateEditorContent, modMap],
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
      [editorRef],
   )

   const handleEditorWillMount: MonacoReactT.BeforeMount = monaco => {
      const themeData = draculaThemeData as MonacoT.editor.IStandaloneThemeData
      monaco.editor.defineTheme('dracula', themeData)
   }

   useEffect(() => {
      if (isFontLoaded) monacoRef.current?.editor.remeasureFonts()
   }, [isFontLoaded])

   const handleEditorDidMount: MonacoReactT.OnMount = async (editor, monaco) => {
      console.log('handleEditorDidMount', editor, monaco)
      editorRef.current = editor
      monacoRef.current = monaco

      if (isFontLoaded) monaco.editor.remeasureFonts()

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
