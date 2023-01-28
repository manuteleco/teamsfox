(function() {
    function isExternalLink(node) {
        return node !== undefined &&
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "A" &&
            node.attributes["target"] !== undefined &&
            node.attributes["target"].value === "_blank" &&
            node.attributes["href"] !== undefined;
    }

    function isBeingEdited(node) {
        return node.closest(".ts-message-editor") !== null;
    }

    function maybeModifyLink(node) {
        // NOTE: We should not modify a link that is edited, because Teams will
        // break it by turning a "firefox:<URL>" link into just "firefox:" once
        // the message is submitted. And, ultimately, that's not necessary
        // either, as the link will be instrumented once it is rendered in the
        // "published" message.
        // Also, when editing a previously published message again, the anchor
        // element that Teams creates inside the editor box will contain the
        // original URL in the href attribute. Therefore, we don't have to worry
        // about explicitly removing the "firefox:" prefix.
        if (isExternalLink(node) && !isBeingEdited(node)) {
            const url = node.attributes["href"].value;
            // NOTE: Embedded images in Teams, often shrinked, are opened within
            // Teams itself in full size when clicked. Those clicks are driven
            // by an HTTP anchor element wrapping the image, which has an href
            // following a pattern like this:
            // https://eu-prod.asyncgw.teams.microsoft.com/v1/objects/<SOME_OBJECT_ID>/views/imgo
            // We don't want to open those links outside Teams. We just keep any
            // link that contains teams.microsoft.com unchanged.
            if (!url.startsWith("firefox:") && !url.includes("teams.microsoft.com")) {
                node.attributes["href"].value = "firefox:" + url;
                // This seems to be needed for links inside the private chats to
                // work. Without it, links are still opened inside Chrome with
                // the usual default behavior.
                node.addEventListener("click", function(event) {
                    event.stopImmediatePropagation();
                }, true);
            }
        }
    }

    function mutationHandler(mutationList, observer) {
        mutationList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                maybeModifyLink(node);
                if (node.getElementsByTagName) {
                    for (const anchor of node.getElementsByTagName("a")) {
                        maybeModifyLink(anchor);
                    }
                }
            });
        });
    }

    const observer = new MutationObserver(mutationHandler);
    const targetNode = document.body;
    const observerOptions = {
        childList: true,
        subtree: true
    };
    observer.observe(targetNode, observerOptions);

    for (const link of document.getElementsByTagName("a")) {
        maybeModifyLink(link);
    }
})();
