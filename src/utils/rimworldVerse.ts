import type { ContentSource, ModMetaData } from "./rimworldModMetaData"

// A one-to-one reimplementation of Rimworld's `Verse.GenText.StableStringHash`
// method. (This will likely fail on non-ASCII text, due to JavaScript and C#/CIL
// having different `String.length` semantics.)
const StableStringHash = (str: string) => {
   /*
   // Verse.GenText
   public static int StableStringHash(string str) {
      if (str == null) { return 0; }
      int num = 23;
      int length = str.Length;
      for (int i = 0; i < length; i++) {
         num = num * 31 + str[i];
      }
      return num;
   }
   */

   let num = 23
   const length = str.length
   for (let i = 0; i < length; i++) {
      const char = str.charCodeAt(i)
      // let before = num

      num = Math.imul(num, 31) + char
      // console.log(
      //    `str[${i.toString().padStart(4, "0")}] (${String.fromCharCode(
      //       char,
      //    )}): ${num} = ${before} * 31 + ${char}`,
      // )
   }
   return num
}

// Based on the [C# docs][1], this needs to match "UppercaseLetter,
// LowercaseLetter, TitlecaseLetter, ModifierLetter, OtherLetter, or
// DecimalDigitNumber"; but since the callsite limits this to c <= 0x80, we can
// just check for ASCII letters and digits.
//
//    [1]: <https://learn.microsoft.com/en-us/dotnet/api/system.char.isletterordigit?view=net-7.0#system-char-isletterordigit(system-char)>
//    [2]: <https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5B%3AASCII%3A%5D%26%5B%5B%3Agc%3DUppercaseLetter%3A%5D%5B%3Agc%3DLowercaseLetter%3A%5D%5B%3Agc%3DTitlecaseLetter%3A%5D%5B%3Agc%3DModifierLetter%3A%5D%5B%3Agc%3DOtherLetter%3A%5D%5B%3Agc%3DNd%3A%5D%5D&abb=on&c=on&g=&i=>
const IsLetterOrDigit = (c: number) => {
   return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)
}

// A one-to-one reimplementation of Rimworld's
// `Verse.ModMetaData.ModMetaDataInternal.ConvertToASCII` method. (This will
// likely fail on non-ASCII text, due to JavaScript and C#/CIL having different
// `String.length` semantics.)
const ConvertToASCII = (str: string) => {
   /*
   // Verse.ModMetaData.ModMetaDataInternal
   using System.Text;

   private string ConvertToASCII(string part) {
      StringBuilder stringBuilder = new StringBuilder("");
      for (int i = 0; i < part.Length; i++) {
         char c = part[i];
         if (!char.IsLetterOrDigit(c) || c >= '\u0080') {
            c = (char)((int)c % 25 + 65);
         }
         stringBuilder.Append(c);
      }
      return stringBuilder.ToString();
   }
   */

   let result = ""
   for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i)
      if (!IsLetterOrDigit(c) /*|| c >= 0x80*/) {
         c = (c % 25) + 65
      }
      result += String.fromCharCode(c)
   }
   return result
}

// A one-to-one reimplementation of Rimworld's
// `Verse.ModMetaData.ModMetaDataInternal.TryParsePackageId` method. (This will
// likely fail on non-ASCII text, due to JavaScript and C#/CIL having different
// `String.length` semantics.)
const TryParsePackageId = (m: {
   packageId?: string
   name: string
   author?: string
   description?: string
}) => {
   /*
   // Verse.ModMetaData.ModMetaDataInternal
   public bool TryParsePackageId(bool isOfficial, bool logIssues = true) {
      if (packageId.NullOrEmpty()) {
         string text = "none";
         if (!description.NullOrEmpty()) {
            text = GenText.StableStringHash(description).ToString().Replace("-", "");
            text = text.Substring(0, Math.Min(3, text.Length));
         }
         packageId = ConvertToASCII(author + text) + "." + ConvertToASCII(name);
      }
   }
   */

   if (null == m.packageId || m.packageId.length === 0) {
      debugger
      let text = "none"
      let author = m.author

      if (null == author || author.length === 0) {
         author = ""
         console.error(
            `mod metadata error: ${m.name}: no <author/> found while generating substitute <packageId/>`,
            m,
         )
      }

      if (null != m.description && m.description.length > 0) {
         const desc = m.description.replaceAll("\n", "\r\n")

         text = Math.abs(StableStringHash(desc)).toString()
         text = text.substring(0, Math.min(3, text.length))
      } else {
         // "none" leaking through the hashing in this case appears to be a bug in
         // Rimworld. reproduced here intentionally.
         console.error(
            `mod metadata error: ${m.name}: no <description/> found while generating substitute <packageId/>`,
            m,
         )
      }

      m.packageId = ConvertToASCII(author + text) + "." + ConvertToASCII(m.name)
      console.warn(
         `mod metadata error: ${m.name}: no <packageId/> found; generated ${m.packageId}`,
         m,
      )
   }
   return m as ModMetaData
}

const Init = (contentSource: ContentSource, folderName: string, xml: Document) => {
   /*
   // Verse.ModMetaData
   private void Init()
   {
      meta = DirectXmlLoader.ItemFromXmlFile<ModMetaDataInternal>(
            GenFile.ResolveCaseInsensitiveFilePath(
               RootDir.FullName + Path.DirectorySeparatorChar + "About", "About.xml"));
      HadIncorrectlyFormattedVersionInMetadata =
         !meta.TryParseSupportedVersions(!OnSteamWorkshop && shouldLogIssues);
      if (meta.name.NullOrEmpty()) {
         if (OnSteamWorkshop) {
            meta.name = "Workshop mod " + FolderName;
         } else {
            meta.name = FolderName;
         }
      }
      HadIncorrectlyFormattedPackageId =
         !meta.TryParsePackageId(Official, !OnSteamWorkshop && shouldLogIssues);
      packageIdLowerCase = meta.packageId.ToLower();
      meta.InitVersionedData();
      meta.ValidateDependencies(shouldLogIssues);
      string publishedFileIdPath = PublishedFileIdPath;
      if (File.Exists(PublishedFileIdPath) &&
            ulong.TryParse(File.ReadAllText(publishedFileIdPath), out var result)) {
         publishedFileIdInt = new PublishedFileId_t(result);
      }
   }
   */
   const root = xml.documentElement

   let name = root.getElementsByTagName("name")[0]?.textContent

   if (null == name || name.length === 0) {
      if ("SteamWorkshop" === contentSource) {
         name = `Workshop mod ${folderName}`
      } else {
         name = folderName
      }
      console.warn(`mod metadata error: ${name}: no <name/> found`, root)
   }

   if (root?.tagName !== "ModMetaData") {
      console.error(`mod metadata error: ${name}: no <ModMetaData/> found`, root)
   }

   let mod = TryParsePackageId({
      name,
      packageId: root.getElementsByTagName("packageId")[0]?.textContent || undefined,
      author: root.getElementsByTagName("author")[0]?.textContent || undefined,
      description: root.getElementsByTagName("description")[0]?.textContent || undefined,
   })

   if ("SteamWorkshop" === contentSource) mod.workshopId = folderName

   return mod
}

const GenText = {
   StableStringHash,
}

const ModMetaData = {
   Init,
   ModMetaDataInternal: {
      TryParsePackageId,
   },
}

export default {
   GenText,
   ModMetaData,
}
