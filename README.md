# TeamsZilla

Chrome extension that, together with an accompanying native application,
instruments external links in Microsoft Teams to open in Firefox.

## Why

Microsoft has retired the native Teams application for Linux, and [released a
PWA][1] (Progressive Web App) to replace it. PWA doesn't work on Firefox and,
according to folklore, the standard web client has always worked better in
Chrome anyway.

This means that, going forward, we should expect advanced native-like features
and better reliability to be available only when using the PWA client in Chrome.

On the other hand, I'm using Firefox as daily driver for everything web related.
Running the Teams PWA from Chrome shouldn't be a problem, at least in theory. If
the concept of PWA truly delivered a native-like experience, external links
clicked from the Teams PWA client running in Chrome would open in my default
browser, which happens to be Firefox.

Unfortunately, that's not the case. External links open in a Chrome window,
regardless of which browser is configured as default in my system. In Chrome, I
don't have any of my active sessions or integrations with other work-related
tools and services. So I'm faced with a choice: I must either explicitly copy
each external link into Firefox instead of clicking on them, or I must
completely switch everything to Chrome and abandon Firefox. I find both
alternatives suboptimal.

This experimental project represents an attempt to provide a third option that
gives me the best of both worlds and allows me to maintain my current workflow:
running Teams PWA independently in Chrome, but having links open in Firefox,
where I keep everything else.

[1]: https://techcommunity.microsoft.com/t5/microsoft-teams-blog/microsoft-teams-progressive-web-app-now-available-on-linux/ba-p/3669846


## How does it work

The Chrome extension replaces external links within Microsoft Teams on the fly.
The new links are crafted in a way that tells Chrome they should be opened using
our native application, installed on the system. The native application recovers
the original URL and opens it through Firefox.

The Chrome extension makes use of the
[MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
Web API to detect and replace any new link being included in the DOM. By virtue
of the `"all_frames": true` attribute in the extension's
[manifest](./chrome_extension/manifest.json), it will also detect external links
included in any iframe, like the one used for the "Chat" area.

External links are instrumented by prepending a custom `firefox:` prefix to
their `href` value. That `firefox:` token turns regular URLs into URIs with a
custom scheme (a.k.a. protocol). Chrome won't try to open those links in a new
tab anymore, but through an appropriate _protocol handler_ instead.

A [Desktop Entry](./native_app/teamszilla.desktop) with a special [MIME Type][2]
provides a handler for the `firefox` protocol. So, effectively, clicks on our
instrumented links in Chrome result in the execution of the command defined in
the Desktop Entry, which is just a small [shell
script](./native_app/teamszilla.sh).

The shell script just needs to extract the original URL from the custom URI
(i.e., strip the `firefox:` prefix) and invoke Firefox. Incidentally, and for
additional convenience, the shell script also needs to provide some window
management automation to focus on the Firefox window where the URL has opened
and close a transient Chrome window that would remain open otherwise.

[2]: https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html#mime-types


## Scope and limitations

This tool was originally developed to be used with Microsoft Teams running as
PWA (Progressive Web Application) within Chromium and the i3 window manager. The
goal was to provide a solution for my own problem, given my own set of unique
circumstances, rather than being generally applicable for everyone _as is_.

Its scope and supported environment are rather narrow:

### Standard external links

Only _standard_ external links are supported. That includes all links embedded
as part of text messages as HTML anchor elements with a `target="_black"`
attribute.

Notably, other elements that also have the effect of opening URLs externally,
but do so based on Javascript-handled click events, are not supported. Clicks on
those will still open according to the default behavior. Examples for such
elements are:

* Preview cards that are automatically generated by Teams, when messages contain
  links.
* Buttons, like the ones created by integrated Apps, are not supported either.

Unclear how much extra effort would be required to instrument those elements as
well. But, considering I never really click on them, this limitation doesn't
disrupt my workflow.

### No link safety check

A side effect of modifying links in this way is that they will no longer go
through a safety check step.

By default, clicking on external links in Teams will first take a detour through
https://statics.teams.cdn.office.net/evergreen-assets/safelinks/1/atp-safelinks.html
before redirecting to the destination URL. With modified links, they jump
directly to the destination URL.

In summary, we lose the safety check, but load pages quicker. I count it as a
net win.

### Chromium

Only tested with Chromium, but expected to work with Chrome as well.

Be aware that the i3 automation (see below) currently assumes Chromium, but
could easily be extended to support Chrome.

### Linux with i3

Only GNU Linux and the i3 window manager are supported.

Support for other OSes would require providing an alternative implementation for
the [native application](./native_app). The [Chrome
extension](./chrome_extension) should work on any OS unmodified.

Support for additional window managers would probably require scripting their
window _close_ and _focus_ operations like it is done for i3 in
[teamszilla.sh](./native_app/teamszilla.sh).


## Installation

### Chrome extension

In Chromium, visit <chrome://extensions>, click on "Load upacked" and select
the [Chrome extension](./chrome_extension) directory.

The first time a modified link is clicked, Chromium will ask for permission to
open the native application. Click on the "Always allow..." checkbox and accept.

### Native application

On most GNU Linux distributions, it can be installed with:

```shell
# As root:
install -Dm 755 native_app/teamszilla.sh /usr/local/bin/teamszilla.sh
install -Dm 644 native_app/teamszilla.desktop /usr/share/applications/teamszilla.desktop
update-desktop-database
```
