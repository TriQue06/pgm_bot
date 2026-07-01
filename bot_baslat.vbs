Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\baris\Documents\GitHub\pgm_bot"
WshShell.Run "node index.js", 0, False