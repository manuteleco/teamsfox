#!/bin/sh

# Copy or symlink this file under /usr/local/bin/teamszilla.sh

firefox $(echo "$1" | sed 's/^firefox://')

if [ -n "${I3SOCK}" ]
then
    # The Firefox window where the link was opened as a new tab gets into the
    # "urgent" state (its window title bar and workspace box become red).
    # We use this fact to automatically focus on that window and workspace.
    i3-msg '[urgent=latest] focus'

    # Unfortunately, after clicking on a link from the Microsoft Teams PWA
    # application, a Chromium window opens as "bridge" just for the sake of
    # opening the "firefox:*" link, and it is from there that this native script
    # is invoked. Even more unfortunate is the fact that, after execution this
    # script and effectively opening the link in Firefox, the "bridge" Chromium
    # window remains open. Here, we automatically close that wasteful temporary
    # window.
    i3-msg '[title="Untitled - Chromium"] kill'
fi
