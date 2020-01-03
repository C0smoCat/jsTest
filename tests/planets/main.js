'use strict';
let planets;
let lastUpd = 0;
let canv;
let maxDethp = 3;
let maxPlanets = 4;
let color1 = {
    r: 150,
    g: 150,
    b: 210
};
let color2 = {
    r: 60,
    g: 60,
    b: 100
};
let planetsHistory = [];

let drawTails = true;
let tailsLength = 7500;
let tailsSimple = false;
let drawOrbits = false;
let drawGravity = false;
let drawSun = true;
let drawPlanets = true;
let backgroundColor = "#282828";
let shadowsColor = 'black';
let canvasSizes;
let ctx;

window.onload = function () {
    canv = document.getElementById("canvas");
    ctx = canv.getContext("2d");
    document.body.style.backgroundColor = backgroundColor;
    Resize();
    window.addEventListener("resize", Resize, false);
    planets = GetPlanets(maxDethp, 0.1);
    requestAnimationFrame(Loop);
};

function Loop(time) {
    let deltaTime = time - lastUpd;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canv.width, canv.height);

    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    UpdLines(canvasSizes.w / 2, canvasSizes.h / 2, planets, deltaTime, ctx, 0, time);

    if (drawPlanets) {
        ctx.shadowBlur = canvasSizes.avg * 0.015;
        ctx.shadowColor = shadowsColor;
        UpdPlanets(0.5 * canvasSizes.w, 0.5 * canvasSizes.h, planets, deltaTime, ctx, 0, time);
    }

    if (drawSun) {
        ctx.shadowBlur = canvasSizes.avg * 0.015;
        ctx.shadowColor = 'gold';
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        let siz = Lerp(canvasSizes.avg * 0.1, canvasSizes.avg * 0.12, UnLerp(-1, 1, Math.sin(time / 2000)));
        ctx.arc(canv.width / 2, canv.height / 2, siz, 0, 2 * Math.PI, true);
        ctx.fill();
    }
    lastUpd = time;
    requestAnimationFrame(Loop);
}

function UpdPlanets(x, y, plns, deltaTime, ctx, dethp, nTime) {
    for (let i = 0; i < plns.length; i++) {
        plns[i].deg = (plns[i].deg + plns[i].speed * (deltaTime / 1000)) % 360;
        let rad = plns[i].deg * Math.PI / 180;
        let px = x + Math.cos(rad) * plns[i].orbit * canvasSizes.min;
        let py = y + Math.sin(rad) * plns[i].orbit * canvasSizes.min;

        UpdPlanets(px, py, plns[i].childs, deltaTime, ctx, dethp + 1, nTime);

        ctx.strokeStyle = "rgba(0,0,0,1)";

        ctx.beginPath();
        ctx.fillStyle = `rgba(${Lerp(color1.r, color2.r, dethp / maxDethp)},` +
            `${Lerp(color1.g, color2.g, dethp / maxDethp)},` +
            `${Lerp(color1.b, color2.b, dethp / maxDethp)},1)`;
        ctx.arc(px, py, plns[i].size * canvasSizes.min, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.arc(px, py, plns[i].size * canvasSizes.min, 0, Math.PI * 2, true);
        ctx.stroke();
    }
}

function UpdLines(x, y, plns, deltaTime, ctx, dethp, nTime) {
    for (let i = 0; i < plns.length; i++) {
        plns[i].deg = (plns[i].deg + plns[i].speed * (deltaTime / 1000)) % 360;
        let rad = plns[i].deg * Math.PI / 180;
        let px = x + Math.cos(rad) * plns[i].orbit * canvasSizes.min;
        let py = y + Math.sin(rad) * plns[i].orbit * canvasSizes.min;
        ctx.strokeStyle = "#aaa";
        if (drawTails) {
            plns[i].posHistory.push({t: nTime, x: px, y: py});
            while (nTime - plns[i].posHistory[0].t >= tailsLength) {
                plns[i].posHistory.shift();
            }

            if (tailsSimple) {
                if (plns[i].posHistory.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = "#aaa";
                    ctx.moveTo(plns[i].posHistory[0].x, plns[i].posHistory[0].y);
                    for (let t = 1; t < plns[i].posHistory.length; t++) {
                        ctx.lineTo(plns[i].posHistory[t].x, plns[i].posHistory[t].y);
                    }
                    ctx.stroke();
                }
            } else {
                if (plns[i].posHistory.length > 1) {
                    for (let t = 1; t < plns[i].posHistory.length; t++) {
                        ctx.beginPath();
                        ctx.moveTo(plns[i].posHistory[t - 1].x, plns[i].posHistory[t - 1].y);
                        let per = t / plns[i].posHistory.length;
                        ctx.strokeStyle = "rgba(200,200,200," + (per * 0.8) + ")";
                        ctx.lineTo(plns[i].posHistory[t].x, plns[i].posHistory[t].y);
                        ctx.stroke();
                    }
                }
            }
        }

        if (drawGravity) {
            ctx.strokeStyle = "#ffa";
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        if (drawOrbits) {
            ctx.strokeStyle = "#faf";
            ctx.beginPath();
            ctx.arc(x, y, plns[i].orbit * canvasSizes.min, 0, Math.PI * 2, true);
            ctx.stroke();
        }

        UpdLines(px, py, plns[i].childs, deltaTime, ctx, dethp + 1, nTime);
    }
}

function GetPlanets(limit, maxSize) {
    if (limit <= 0)
        return [];
    let arr = [];
    let count = RandFloat(0, maxPlanets);
    for (let i = 0; i < count; i++) {
        let size = RandFloat(Math.max(maxSize / 5, 0.01), maxSize);
        arr[i] = {
            deg: RandFloat(0, 360),
            size: size,
            speed: Rand(0, 1) === 0 ? RandFloat(3, 60) : -RandFloat(3, 60),
            orbit: RandFloat(maxSize * 2, maxSize * 3),
            //div: p,
            childs: GetPlanets(limit - 1, size * 0.9),
            posHistory: []
        };
    }
    return arr;
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
        avg: (Math.min(canv.width, canv.height) + Math.max(canv.width, canv.height)) / 2
    };
    //ctx.lineWidth = dotSize * canvasSizes.avg * 0.5;
}

function RandArr(array) {
    return array[Math.floor(Math.random() * (array.length))];
}

/**
 * @return {number}
 */
function Rand(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

function RandFloat(min, max) {
    return min + Math.random() * (max - min);
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