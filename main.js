function openTest(evt, contentUrl) {
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    let frame = document.getElementById("iframe");
    frame.src = contentUrl;
    frame.addEventListener("load", () => {
        if (frame.contentWindow['OnKeyDown'] !== undefined) {
            window.addEventListener("keydown", frame.contentWindow.OnKeyDown, false);
        }
        if (frame.contentWindow['OnKeyDown'] !== undefined) {
            window.addEventListener("keyup", frame.contentWindow.OnKeyUp, false);
        }
        if (frame.contentWindow['changeFavicon'] !== undefined) {
            frame.contentWindow.changeFavicon = (src) => {
                let link = document.createElement('link');
                let oldLink = document.getElementById('dynamic-favicon');
                link.id = 'dynamic-favicon';
                link.rel = 'shortcut icon';
                link.href = src;
                if (oldLink) {
                    document.head.removeChild(oldLink);
                }
                document.head.appendChild(link);
            }
        }
    });
    evt.currentTarget.classList.add("active");
}