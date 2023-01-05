declare global {
   interface FileSystemEntry {
      createReader(): FileSystemDirectoryReader
   }
}

const entryIsFile = (entry: FileSystemEntry): entry is FileSystemFileEntry => {
   return entry.isFile
}

const entryIsDirectory = (entry: FileSystemEntry): entry is FileSystemDirectoryEntry => {
   return entry.isDirectory
}

async function filePromise(entry: FileSystemFileEntry): Promise<File> {
   return await new Promise((resolve, reject): void => {
      entry.file(resolve, reject)
   })
}

// Adapted from <https://stackoverflow.com/a/53058574>, then
// <https://github.com/koel/koel/blob/4c923fae/resources/assets/js/utils/directoryReader.ts>
async function readEntriesPromise(
   directoryReader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
   return await new Promise((resolve, reject): void => {
      directoryReader.readEntries(resolve, reject)
   })
}

async function readAllDirectoryEntries(
   directoryReader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
   const entries: FileSystemEntry[] = []
   let readEntries = await readEntriesPromise(directoryReader)

   while (readEntries.length > 0) {
      entries.push(...readEntries)
      readEntries = await readEntriesPromise(directoryReader)
   }

   return entries
}

// modifies the first argument
async function entriesOfDirectories(
   queue: FileSystemEntry[],
   entries: FileSystemEntry[] = [],
): Promise<FileSystemEntry[]> {
   while (queue.length > 0) {
      const entry = queue.shift()

      if (!entry) {
         continue
      }

      if (entry.isFile) {
         entries.push(entry)
      } else if (entry.isDirectory) {
         entries.push(...(await readAllDirectoryEntries(entry.createReader())))
      }
   }

   return entries
}

export { entryIsFile, entryIsDirectory, filePromise, entriesOfDirectories }
