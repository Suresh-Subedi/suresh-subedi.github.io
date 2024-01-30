I live in Belgium. AZERTY is the keyboard layout used here. Few things I noticed.
I use . more than I use ;.
I use { more than I use ç.
So I wrote a AutoHotKey script to swap them.
```ahk
#Requires AutoHotkey v2.0
; Programmer's Azerty
:*:;::. ; ; => .
:*:.::; ; . => ;

:*:ç::{ ; ç => {
```
