type state = {
   fileHandle?: FileSystemFileHandle
}

function isTextArea(el: HTMLElement): el is HTMLTextAreaElement {
   console.log(el)
   return el.nodeName === "TEXTAREA"
}

document.addEventListener(
   "DOMContentLoaded",

   function () {
      const trigger = document.getElementById("pick-file")

      const textarea = document.getElementById("content-area")
      if (!(textarea instanceof HTMLTextAreaElement)) throw new Error()

      const saveButton = document.getElementById("save-button")
      if (!(saveButton instanceof HTMLButtonElement)) throw new Error()

      const state: state = {}

      trigger.onclick = async (e) => {
         console.log(e)
         e.preventDefault()

         let [fileHandle] = await window.showOpenFilePicker()
         state.fileHandle = fileHandle

         await initialRead(state, textarea)

         saveButton.onclick = async function (e) {
            await saveBack(state, textarea)
         }
         saveButton.disabled = false
      }
   },
)

async function initialRead({ fileHandle }: state, textarea: HTMLTextAreaElement) {
   const file = await fileHandle.getFile()
   const content = await file.text()
   console.log(content)

   textarea.readOnly = false
   textarea.value = content
}

async function saveBack({ fileHandle }: state, textarea: HTMLTextAreaElement) {
   console.log(fileHandle)

   const writable = await fileHandle.createWritable()
   await writable.write(textarea.value)
   await writable.close()
}
