"use strict";
let ctx;
let canv;
let dots = [];
let dotsCount = 150;
let lastUpd = 0;
let backgroundColor = "#333";
let repeatBorders = false;
let outlines = false;
let dotDistance = 0.15;
let dotSpeed = 1;
let dotSize = 0.01;
let gravity = 0; //0.0067;
let showDotVelocity = false;
let showGravityCenter = false;
let gravityRadius = 0;
let colorSpeed = 0.0001;
let sizeBounceSpeed = 0.001;
let canvasSizes;
let mousePos = undefined;
let mouseDistance = 0.2;

window.onload = () => {
    document.body.style.backgroundColor = backgroundColor;

    canv = document.getElementById("canvas");
    canv.addEventListener('touchstart', (e) => {
        e.preventDefault();
        UpdateCursorPos(e.touches[0], true);
    }, false);
    canv.addEventListener('touchmove', (e) => {
        e.preventDefault();
        UpdateCursorPos(e.touches[0], undefined);
    }, false);
    canv.addEventListener('touchend', (e) => {
        e.preventDefault();
        UpdateCursorPos(e.touches[0], false);
    }, false);
    canv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        UpdateCursorPos(e, true);
    }, false);
    canv.addEventListener('mousemove', (e) => {
        e.preventDefault();
        UpdateCursorPos(e, undefined);
    }, false);
    canv.addEventListener('mouseup', (e) => {
        e.preventDefault();
        UpdateCursorPos(e, false);
    }, false);

    window.addEventListener("resize", Resize, false);

    for (let i = 0; i < dotsCount; i++) {
        dots.push({
            x: Lerp(0, 1, Math.random()),
            y: Lerp(0, 1, Math.random()),
            sizeOffset: Math.random() * 2 * Math.PI,
            vx: Lerp(0.02, 0.1, Math.random()) * (Math.random() < 0.5 ? -1 : 1),
            vy: Lerp(0.02, 0.1, Math.random()) * (Math.random() < 0.5 ? -1 : 1)
        });
    }
    ctx = canv.getContext("2d");
    Resize();
    requestAnimationFrame(Loop);
};

function UpdateCursorPos(cursor, press) {
    if (press || (press === undefined && mousePos !== undefined)) {
        let box = canv.getBoundingClientRect();
        mousePos = {
            x: UnLerp(box.left, box.right, cursor.clientX),
            y: UnLerp(box.top, box.bottom, cursor.clientY)
        };
    } else {
        mousePos = undefined;
    }
}

function Loop(time) {
    let deltaTime = (time - lastUpd) / 1000;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSizes.w, canvasSizes.h);

    let hue = Lerp(0, 360, UnLerp(-1, 1, Math.sin(time * colorSpeed)));

    for (let i = 0; i < dots.length; i++) {
        let size = Lerp(0.8, 1, Math.sin(time * sizeBounceSpeed + dots[i].sizeOffset)) * dotSize * canvasSizes.avg;

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
        if (outlines) {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(dots[i].x * canvasSizes.w, dots[i].y * canvasSizes.h, size + canvasSizes.avg * 0.003, 0, 2 * Math.PI, true);
            ctx.stroke();
            ctx.lineWidth = dotSize * canvasSizes.avg * 0.5;
        }

        if (mousePos !== undefined) {
            let mag = Math.hypot((dots[i].x - mousePos.x) * canvasSizes.w, (dots[i].y - mousePos.y) * canvasSizes.h) / canvasSizes.avg;
            if (mag <= mouseDistance) {
                if (gravity > 0) {
                    let f = gravity / mag * deltaTime * dotsCount * 2;
                    dots[i].vx += (mousePos.x - dots[i].x) * f;
                    dots[i].vy += (mousePos.y - dots[i].y) * f;
                } else {
                    dots[i].x += (dots[i].x - mousePos.x) / mag * UnLerp(mouseDistance, 0, mag) * deltaTime * dotSpeed;
                    dots[i].y += (dots[i].y - mousePos.y) / mag * UnLerp(mouseDistance, 0, mag) * deltaTime * dotSpeed;
                }
            }
        }

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

        if (showDotVelocity) {
            ctx.strokeStyle = `#aaa`;
            ctx.beginPath();
            ctx.moveTo(dots[i].x * canvasSizes.w, dots[i].y * canvasSizes.h);
            ctx.lineTo((dots[i].x + dots[i].vx / 10) * canvasSizes.w, (dots[i].y + dots[i].vy / 10) * canvasSizes.h);
            ctx.stroke();
        }

        if (gravity > 0) {
            for (let a = 0; a < dots.length; a++) {
                if (a === i) continue;
                let mag = Math.hypot((dots[i].x - dots[a].x) * canvasSizes.w, (dots[i].y - dots[a].y) * canvasSizes.h) / canvasSizes.avg;
                if (gravityRadius > 0 && mag > gravityRadius) continue;
                let f = gravity / mag * deltaTime;
                dots[i].vx += (dots[a].x - dots[i].x) * f;
                dots[i].vy += (dots[a].y - dots[i].y) * f;
            }
        }
    }

    if (showGravityCenter) {
        let cx = dots.reduce(function (sum, current) {
            return sum + current.x;
        }, 0) / dots.length;
        let cy = dots.reduce(function (sum, current) {
            return sum + current.y;
        }, 0) / dots.length;

        let graviSize = dotSize * canvasSizes.avg;
        ctx.fillStyle = "#aaa";
        ctx.strokeStyle = "#aaa";
        ctx.beginPath();
        ctx.arc(cx * canvasSizes.w, cy * canvasSizes.h, graviSize, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx * canvasSizes.w, cy * canvasSizes.h, graviSize * 1.5, 0, 2 * Math.PI, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx * canvasSizes.w, cy * canvasSizes.h, graviSize * 2.3, 0, 2 * Math.PI, true);
        ctx.stroke();
    }

    lastUpd = time;
    requestAnimationFrame(Loop);
}

function Resize() {
    let box = canv.getBoundingClientRect();
    let w = box.right - box.left;
    let h = box.bottom - box.top;
    canv.width = w;
    canv.height = h;
    canvasSizes = {
        w,
        h,
        min: Math.min(canv.width, canv.height),
        max: Math.max(canv.width, canv.height),
        avg: (canv.width + canv.height) / 2
    };
    ctx.lineWidth = dotSize * canvasSizes.avg * 0.5;
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