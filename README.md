modrepair
=========

A bit of learning React, a bit of scratching an itch, and a bit of trying-to-make-programming-fun-again.

Criterion
---------

1. Basic functionality:
    - [x] Loading the `ModsConfig.xml` file from filesystem in such a way as to save it multiple times while bisecting (i.e. the [File System Access API][], [`FileSystemWritableFileStream`][])
       - only implemented in Chrome. great. I fucking _hate_ Chrome, and now I have to write one of those terrible websites demanding you use it?
    - [x] Loading metadata about the mods listed in that file from the user's filesystem as well
       - this ended up being a mess; the File System Access API won't let you touch stuff in `C:\Program Files (x86)\Steam` for security reasons ... so now I'm using a _hybrid_ of the FSAA (for the file I need to re-write over and over), and drag-n-drop (for the files I need to read out of a sensitive location, but do not need to modify.)
    - [ ] Load additional community dependency-details from the RimPy JSON database, if the user has it installed
    - [ ] Write metadata into the XML as comments as the mod metadata is loaded
    - [ ] Load modified metadata from those comments if they were user-modified
    - [ ] Buttons to start/proceed the bisection process
    - [ ] Encode bisection-status in the XML itself
    - [ ] Store each bisection-step as a new editor Model, or "tab"

2. Polish:
    - [ ] Hint to the user about installing the RimPy database-mod, if they're missing it
    - [ ] Add a version-switcher to the UI, so that the user can select which version of RimWorld they're running
    - [ ] Clean up the undo-redo stack management; mods loading etc should be a single undo-step; user-input should cleanly interrupt mod-loading changes
    - [ ] Add an (MDX?) tutorial document / sidebar with filesystem paths, easy to access
    - [ ] Add popover-tutorial for first-time visitors

3. Stretch goals:
    - [ ] Persistence of the undo-redo stack, so that the user can close the browser and come back to it later
    - [ ] Prompt the user to backup their `ModsConfig.xml` file before they start
    - [ ] Detect external changes to the `ModsConfig.xml` file, and help the user avoid losing their work
    - [ ] Handle / retain any non-managed XML comments
    - [ ] Handle weird XML formatting (e.g. tabs, newlines, etc)

   [File System Access API]: <https://web.dev/file-system-access>
   [`FileSystemWritableFileStream`]: <http://mdn.io/FileSystemWritableFileStream>
