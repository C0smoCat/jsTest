"use strict";
let ctx;
let canv;
let dots = [];
let dotsCount = 5;
let lastUpd = new Date().getTime();
let backgroundColor = "#333";
let repeatBorders = false;
let dotDistance = 0.45;
let dotSpeed = 1;
let dotSize = 0.05;
let colorSpeed = 0.0001;
let canvasSizes = {
    w: 32,
    h: 32,
    min: 32,
    max: 32,
    avg: 32
};

window.onload = () => {
    for (let i = 0; i < dotsCount; i++) {
        dots.push({
            x: Lerp(0, 1, Math.random()),
            y: Lerp(0, 1, Math.random()),
            vx: Lerp(0.02, 0.1, Math.random()) * (Math.random() < 0.5 ? -1 : 1),
            vy: Lerp(0.02, 0.1, Math.random()) * (Math.random() < 0.5 ? -1 : 1)
        });
    }
    canv = document.getElementById("canvas");
    canv.width = 32;
    canv.height = 32;
    ctx = canv.getContext("2d");
    ctx.lineWidth = 3;
    document.head || (document.head = document.getElementsByTagName('head')[0]);
    setInterval(Loop, 200);
};

function Loop() {
    let time = new Date().getTime();
    let deltaTime = (time - lastUpd) / 1000;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSizes.w, canvasSizes.h);

    let hue = Lerp(0, 360, UnLerp(-1, 1, Math.sin(time * colorSpeed)));

    for (let i = 0; i < dots.length; i++) {
        let size = dotSize * canvasSizes.avg;

        if (repeatBorders) {
            if (dots[i].x > 1 || dots[i].x < 0) dots[i].x = Repeat(dots[i].x, 1);
            if (dots[i].y > 1 || dots[i].y < 0) dots[i].y = Repeat(dots[i].y, 1);
        } else {
            if (dots[i].x > 1 && dots[i].vx > 0) dots[i].vx = -dots[i].vx;
            if (dots[i].x < 0 && dots[i].vx < 0) dots[i].vx = -dots[i].vx;
            if (dots[i].y > 1 && dots[i].vy > 0) dots[i].vy = -dots[i].vy;
            if (dots[i].y < 0 && dots[i].vy < 0) dots[i].vy = -dots[i].vy;
            dots[i].x = Clamp(0, 1, dots[i].x);
            dots[i].y = Clamp(0, 1, dots[i].y);
        }

        dots[i].x += dots[i].vx * deltaTime * dotSpeed;
        dots[i].y += dots[i].vy * deltaTime * dotSpeed;

        ctx.strokeStyle = ctx.fillStyle = `hsla(${hue}, 90%, 90%, 1)`;

        ctx.beginPath();
        ctx.arc(dots[i].x * canvasSizes.w, dots[i].y * canvasSizes.h, size, 0, 2 * Math.PI, true);
        ctx.fill();

        if (dotDistance > 0) {
            for (let a = 0; a < i; a++) {
                let mag = Math.hypot((dots[i].x - dots[a].x) * canvasSizes.w, (dots[i].y - dots[a].y) * canvasSizes.h) / canvasSizes.avg;
                if (mag <= dotDistance) {
                    ctx.strokeStyle = `hsla(${hue}, 90%, 90%, ${Lerp(1, 0, mag / dotDistance)})`;
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x * canvasSizes.w, dots[i].y * canvasSizes.h);
                    ctx.lineTo(dots[a].x * canvasSizes.w, dots[a].y * canvasSizes.h);
                    ctx.stroke();
                }
            }
        }
    }

    changeFavicon(canv.toDataURL("image/png"));
    lastUpd = time;
}

// change-favicon.js https://gist.github.com/mathiasbynens/428626
function changeFavicon(src) {
    var link = document.createElement('link'),
        oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    if (oldLink) {
        document.head.removeChild(oldLink);
    }
    document.head.appendChild(link);
}

function Lerp(a, b, t) {
    return a + (b - a) * t;
}

function UnLerp(a, b, t) {
    return (t - a) / (b - a);
}

function Clamp(a, b, t) {
    return t < a ? a : t > b ? b : t;
}

function Repeat(t, length) {
    return t - Math.floor(t / length) * length;
}