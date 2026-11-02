; ТИШЕ / HUSH — the installer's own pages (3.1k), on top of electron-builder's assisted NSIS installer.
;
; The wizard: Welcome (the sidebar art) → for whom (only me / everyone) → the folder → Shortcuts → install →
; Finish (run the game). The uninstaller asks whether to take the saves and settings too.
; A silent run — the launcher's own shell update, `/S --updated` — shows none of it and keeps the folder the player
; chose: electron-builder reads it back from the registry (InstallLocation).
;
; electron-builder includes this file in the script's header, before MUI2 and the languages are loaded. So:
;   • the words are LangStrings by numeric language id (1049 ru, 1033 en), the way its own messages.yml is written;
;   • whatever needs MUI or nsDialogs lives inside the page macros, which expand later, where both exist;
;   • installer-only and uninstaller-only parts are fenced off: the build runs with -WX, and an unused variable or
;     function in the other half would be a warning, which fails it.
; The art beside it (installerSidebar.bmp, uninstallerSidebar.bmp, installerHeader.bmp) is drawn from the game's own
; fonts and sonar rings — see docs/DESKTOP.md.

; the last page of the installer (fenced: the uninstaller's finish page reads the same defines)
!ifndef BUILD_UNINSTALLER
  !define MUI_FINISHPAGE_TITLE "$(hushFinishTitle)"
  !define MUI_FINISHPAGE_TEXT "$(hushFinishText)"
  !define MUI_FINISHPAGE_RUN_TEXT "$(hushFinishRun)"
!endif

LangString hushWelcomeTitle 1049 "ТИШЕ — эхолокационный хоррор"
LangString hushWelcomeTitle 1033 "HUSH — an echolocation horror"
LangString hushWelcomeText 1049 "Мастер поставит игру и её лаунчер. Дальше можно выбрать, для кого её ставить и в какую папку.$\r$\n$\r$\nПотом лаунчер сам держит игру свежей: новые версии скачиваются в фоне, переустанавливать ничего не придётся.$\r$\n$\r$\nИграй в наушниках. Звук — твои глаза."
LangString hushWelcomeText 1033 "This wizard installs the game and its launcher. Next you can choose who it is for and which folder it goes to.$\r$\n$\r$\nAfter that the launcher keeps the game current by itself: new versions download in the background, nothing to reinstall.$\r$\n$\r$\nPlay with headphones. Sound is your eyes."
LangString hushOptTitle 1049 "Ярлыки"
LangString hushOptTitle 1033 "Shortcuts"
LangString hushOptSub 1049 "Откуда запускать игру."
LangString hushOptSub 1033 "Where to start the game from."
LangString hushOptDesktop 1049 "Ярлык на рабочем столе"
LangString hushOptDesktop 1033 "Desktop shortcut"
LangString hushOptMenu 1049 "Ярлык в меню «Пуск» появится в любом случае. Обновления не трогают ярлыки: удалишь ярлык с рабочего стола — он не вернётся."
LangString hushOptMenu 1033 "The Start menu shortcut is always created. Updates leave shortcuts alone: delete the desktop one and it stays gone."
LangString hushFinishTitle 1049 "Готово"
LangString hushFinishTitle 1033 "Done"
LangString hushFinishText 1049 "ТИШЕ установлена. Лаунчер откроется с кнопкой «Играть», новостями и настройками.$\r$\n$\r$\nПри первом запуске игра спросит разрешение на микрофон: им ты зовёшь эхо."
LangString hushFinishText 1033 "HUSH is installed. The launcher opens with PLAY, the news and the settings.$\r$\n$\r$\nOn first run the game asks for the microphone: it is how you call the echo."
LangString hushFinishRun 1049 "Запустить ТИШЕ"
LangString hushFinishRun 1033 "Start HUSH"
LangString hushUnData 1049 "Удалить и сохранения, настройки, скачанные версии игры?$\r$\n$\r$\n«Нет» — оставить их: если поставить игру снова, всё будет на месте."
LangString hushUnData 1033 "Also delete the saves, settings and downloaded game versions?$\r$\n$\r$\nNo keeps them: install the game again and everything is where you left it."

!ifndef BUILD_UNINSTALLER
  Var hushDesk    ; the checkbox's state: 1 — keep the desktop shortcut
  Var hushDeskBox ; the checkbox itself

  !macro customInit
    StrCpy $hushDesk 1
  !macroend

  !macro customWelcomePage
    !define MUI_WELCOMEPAGE_TITLE "$(hushWelcomeTitle)"
    !define MUI_WELCOMEPAGE_TEXT "$(hushWelcomeText)"
    !insertmacro skipPageIfUpdated
    !insertmacro MUI_PAGE_WELCOME
  !macroend

  ; after the folder: one page with the one real choice left
  !macro customPageAfterChangeDir
    Page custom hushShortcutsShow hushShortcutsLeave

    Function hushShortcutsShow
      ${if} ${isUpdated}
        Abort
      ${endif}
      !insertmacro MUI_HEADER_TEXT "$(hushOptTitle)" "$(hushOptSub)"
      nsDialogs::Create 1018
      Pop $0
      ${NSD_CreateCheckbox} 0 0 100% 14u "$(hushOptDesktop)"
      Pop $hushDeskBox
      ${NSD_SetState} $hushDeskBox $hushDesk
      ${NSD_CreateLabel} 0 26u 100% 36u "$(hushOptMenu)"
      Pop $0
      nsDialogs::Show
    FunctionEnd

    Function hushShortcutsLeave
      ${NSD_GetState} $hushDeskBox $hushDesk
    FunctionEnd
  !macroend

  ; electron-builder has just made the shortcuts: take the desktop one back if it was unticked (a fresh install only)
  !macro customInstall
    ${ifNot} ${isUpdated}
      ${if} $hushDesk != 1
        WinShell::UninstShortcut "$newDesktopLink"
        Delete "$newDesktopLink"
      ${endif}
    ${endif}
  !macroend
!else
  ; a player who removes the game decides about the saves; an update (silent) never asks and never deletes them.
  ; The saves live in the user's own Roaming folder whatever the install was, so the context switches to the user
  ; for the delete and back after (the rest of the uninstall works in the install's own context).
  !macro customUnInstall
    ${ifNot} ${isUpdated}
    ${andIfNot} ${Silent}
      MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "$(hushUnData)" IDNO hushUnKeep
        SetShellVarContext current
        RMDir /r "$APPDATA\HUSH"
        RMDir /r "$APPDATA\hush-echolocation-horror"
        ${if} $installMode == "all"
          SetShellVarContext all
        ${endif}
      hushUnKeep:
    ${endif}
  !macroend
!endif
