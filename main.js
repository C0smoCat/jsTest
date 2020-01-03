function openTest(evt, contentUrl) {
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    let frame = document.getElementById("iframe");
    frame.src = contentUrl;
    frame.addEventListener("load", () => {
        let a = frame.contentDocument.createElement("script");
        a.innerHTML = `changeFavicon = (src) => {
    let link = parent.document.createElement('link');
    let oldLink = parent.document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    if (oldLink) {
        parent.document.head.removeChild(oldLink);
    }
    parent.document.head.appendChild(link);}`;
        frame.contentDocument.body.appendChild(a);
    });
    evt.currentTarget.classList.add("active");
}