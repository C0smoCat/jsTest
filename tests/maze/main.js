'use strict';
let lastUpd = 0;
let canv;
let ctx;
let canvasSizes;
let colors = {
    background: "#333",
    danger: "#f00",
    wallPrefabs: [
        (a, b) => `rgb(${a * 255},${b * 255},150)`,
        (a, b) => `rgb(${(1 - a) * 255},150,${b * 255})`,
        (a, b) => `rgb(150,${a * 255},${(1 - b) * 255})`,
        (a, b) => `rgb(${(1 - a) * 255},${(1 - b) * 255},150)`
    ],
    hiddenDanger: "#a55",
    hiddenWall: "#555",
    godModeDanger: "#faf",
    godModeWall: "#aaf",
    player: "#ff0",
    playerExtraLive: "#ffa500",
    playerGodMode: "#22f",
    playerBorderLine: "#000",
    marker: "#f70",
    coin: "#fe2",
    path: "#afa",
    playerVelocity: "#eee6",
    flashLine: "#fff"
};
let player = {
    x: 3.5,
    y: 3.5,
    speed: 5,
    vx: 0,
    vy: 0,
    spawn: {
        x: 3.5,
        y: 3.5
    }
};
let scale = 10;
let wScale;
let hScale;
let map = undefined;
let godMode = false;
let flashpower = 2;
let count = 0;
let seened = 0;
let zz = 0;
let minimapMode = false;
let mapW = 201;
let mapH = 201;
let goal = undefined;
let drawPath = false;
let drawPathInterval = 1000;
let coins = 0;
let cursorHold = false;
let lbCoins;
let lbPercent;
let shopCosts = {
    extraLive: 50,
    flashpowerUp: 20,
    pathLength: 5,
    marker: 1,
    markerReturn: -1
};
let autoMarker = {
    enable: false,
    lastX: undefined,
    lastY: undefined
};

function VirtualClick(btn) {
    switch (btn) {
        case "ArrowLeft":
        case "KeyA":
            player.vx = Clamp(-1, 1, player.vx + 1);
            break;
        case "ArrowUp":
        case "KeyW":
            player.vy = Clamp(-1, 1, player.vy + 1);
            break;
        case "ArrowDown":
        case "KeyS":
            player.vy = Clamp(-1, 1, player.vy - 1);
            break;
        case "ArrowRight":
        case "KeyD":
            player.vx = Clamp(-1, 1, player.vx - 1);
            break;
        case "KeyZ":
            minimapMode = false;
            scale = 400 / scale;
            Resize();
            break;
        case "KeyO":
            godMode = !godMode;
            break;
        case "KeyP":
            drawPath = !drawPath;
            break;
        case "KeyR":
            if (coins >= shopCosts.flashpowerUp) {
                flashpower += 0.5;
                coins -= shopCosts.flashpowerUp;
                UpdateCounters();
            }
            break;
        case "KeyT":
            if (map !== undefined &&
                player.x !== undefined &&
                player.y !== undefined) {
                let buyPath = (x, y) => {
                    if (map !== undefined &&
                        map[x] !== undefined &&
                        map[x][y] !== undefined) {
                        let bl = map[x][y];
                        if (!bl.isWall && bl.toGoal !== undefined && coins >= shopCosts.pathLength) {
                            if (bl.toGoalVisible) {
                                buyPath(bl.toGoal.x, bl.toGoal.y);
                            } else {
                                bl.toGoalVisible = true;
                                coins -= shopCosts.pathLength;
                                UpdateCounters();
                            }
                        }
                    }
                };
                buyPath(Math.floor(player.x / 2) * 2 + 1, Math.floor(player.y / 2) * 2 + 1);
            }
            /*
                        if (map !== undefined &&
                            map[Math.floor(player.x)] !== undefined &&
                            map[Math.floor(player.x)][Math.floor(player.y)] !== undefined &&
                            player.x !== undefined &&
                            player.y !== undefined) {
                            let bl = map[Math.floor(player.x)][Math.floor(player.y)];
                            if (!bl.isWall && bl.toGoal !== undefined && !bl.toGoalVisible && coins >= shopCosts.pathLength) {
                                bl.toGoalVisible = true;
                                coins -= shopCosts.pathLength;
                                UpdateCounters();
                            }
                        }*/
            break;
        case "Space":
            if (map !== undefined &&
                player.x !== undefined &&
                player.y !== undefined &&
                map[Math.floor(player.x)] !== undefined &&
                map[Math.floor(player.x)][Math.floor(player.y)] !== undefined) {
                let bl = map[Math.floor(player.x)][Math.floor(player.y)];
                if (!bl.isWall && !bl.isDanger) {
                    if (bl.isSeen) {
                        if (coins >= shopCosts.markerReturn) {
                            bl.isSeen = false;
                            coins -= shopCosts.markerReturn;
                            UpdateCounters();
                        }
                    } else if (coins >= shopCosts.marker) {
                        bl.isSeen = true;
                        coins -= shopCosts.marker;
                        UpdateCounters();
                    }
                }
            }
            break;
        case "KeyQ":
            minimapMode = !minimapMode;
            Resize();
            break;
        case "KeyE":
            player.speed = 50 / player.speed;
            break;
    }
}

window.onload = function () {
    canv = document.getElementById("canvas");
    lbCoins = document.getElementById("lbCoins");
    lbPercent = document.getElementById("lbPercent");
    window.addEventListener("keydown", OnKeyDown, false);
    window.addEventListener("keyup", OnKeyUp, false);
    window.addEventListener("resize", Resize, false);
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
        UpdateCursorPos(undefined, false);
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
        UpdateCursorPos(undefined, false);
    }, false);
    document.body.style.backgroundColor = colors.background;

    map = GenMap(mapW, mapH, [], [], {x: Math.floor(player.spawn.x), y: Math.floor(player.spawn.y)});

    map = Makeway2(goal.x, goal.y, map, {x: Lerp(goal.x, goal.b.x, 2), y: Lerp(goal.y, goal.b.y, 2)});

    count = 0;
    for (let x = 0; x < mapW; x++) {
        for (let y = 0; y < mapH; y++) {
            if (map[x][y].isWall) {
                count++;
            }
        }
    }
    ctx = canv.getContext("2d");
    Resize();

    requestAnimationFrame(Loop);
};

function OnKeyDown(event) {
    switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
            player.vx = Clamp(-1, 1, player.vx - 1);
            break;
        case "ArrowUp":
        case "KeyW":
            player.vy = Clamp(-1, 1, player.vy - 1);
            break;
        case "ArrowDown":
        case "KeyS":
            player.vy = Clamp(-1, 1, player.vy + 1);
            break;
        case "ArrowRight":
        case "KeyD":
            player.vx = Clamp(-1, 1, player.vx + 1);
            break;
    }
}

function OnKeyUp(event) {
    VirtualClick(event.code);
}

function MovePlayer(deltaTime) {
    let nx = player.x + Clamp(-0.3, 0.3, player.vx * player.speed * deltaTime / 1000);
    let ny = player.y + Clamp(-0.3, 0.3, player.vy * player.speed * deltaTime / 1000);

    if (nx >= 0 && nx < mapW && ny >= 0 && ny < mapH) {
        if (godMode) {
            player.x = nx;
            player.y = ny;
        } else if (map[Math.floor(nx)][Math.floor(ny)].isDanger && map[Math.floor(nx)][Math.floor(ny)].isWall) {
            map[Math.floor(nx)][Math.floor(ny)].isDanger = false;
            if (coins >= shopCosts.extraLive) {
                coins -= shopCosts.extraLive;
                UpdateCounters();
                Vibrate(60);
            } else {
                player.x = player.spawn.x;
                player.y = player.spawn.y;
                let thanos = [];
                for (let y = 0; y < mapH; y++) {
                    for (let x = 0; x < mapW; x++) {
                        if (map[x][y].isSeen && map[x][y].isWall) {
                            thanos.push({x: x, y: y});
                        }
                    }
                }
                thanos = Shuffle(thanos);
                for (let i = 0; i < seened / 2; i++) {
                    map[thanos[i].x][thanos[i].y].isSeen = false;
                    seened--;
                }
                Vibrate(100);
            }
        } else {
            if (!map[Math.floor(nx)][Math.floor(player.y)].isWall) {
                player.x = nx;
            }
            if (!map[Math.floor(player.x)][Math.floor(ny)].isWall) {
                player.y = ny;
            }
        }
    } else {
        godMode = true;
        drawPath = true;
        player.x = nx;
        player.y = ny;
    }
}

function DrawMinimap(time) {
    let ox = 0;
    let oy = 0;
    for (let x = 0; x < mapW; x++) {
        for (let y = 0; y < mapH; y++) {
            let mag = Math.sqrt((player.x - 0.5 - x) ** 2 + (player.y - 0.5 - y) ** 2);
            if (map[x][y].isWall) {
                if (mag <= flashpower) {
                    if (!map[x][y].isSeen) {
                        seened++;
                        map[x][y].isSeen = true;
                        UpdateCounters();
                    }
                    ctx.fillStyle = map[x][y].isDanger ? colors.danger : map[x][y].color;
                } else if (map[x][y].isSeen) {
                    ctx.fillStyle = map[x][y].isDanger ? colors.hiddenDanger : colors.hiddenWall;
                } else if (godMode) {
                    ctx.fillStyle = map[x][y].isDanger ? colors.godModeDanger : colors.godModeWall;
                } else {
                    continue;
                }
                let xx = Math.ceil(zz * x + ox);
                let yy = Math.ceil(zz * y + oy);
                ctx.fillRect(xx, yy, Math.ceil(zz), Math.ceil(zz));
            } else {
                if (map[x][y].isSeen) {
                    ctx.fillStyle = colors.marker;
                    let xx = zz * (x + 0.2) + ox;
                    let yy = zz * (y + 0.2) + oy;
                    ctx.fillRect(xx, yy, zz * 0.6, zz * 0.6);
                } else if ((godMode ? true : mag <= flashpower) && !map[x][y].isWall && map[x][y].isDanger) {
                    if (Math.floor(player.x) === x && Math.floor(player.y) === y) {
                        map[x][y].isDanger = false;
                        coins++;
                        UpdateCounters();
                    }
                    ctx.fillStyle = colors.coin;
                    let xx = zz * (x + 0.3) + ox;
                    let yy = zz * (y + 0.3) + oy;
                    ctx.fillRect(xx, yy, zz * 0.4, zz * 0.4);
                }
                if ((map[x][y].toGoalVisible || godMode) && map[x][y].toGoal !== undefined) {
                    ctx.fillStyle = colors.path;
                    let xx = zz * (Lerp(x, map[x][y].toGoal.x, time / drawPathInterval % 1) + 0.35);
                    let yy = zz * (Lerp(y, map[x][y].toGoal.y, time / drawPathInterval % 1) + 0.35);
                    ctx.fillRect(xx, yy, zz * 0.3, zz * 0.3);
                }
            }
        }
    }
}

function DrawNormal(time) {
    let minX = Clamp(0, mapW - 1, Math.floor(player.x - wScale));
    let maxX = Clamp(0, mapW - 1, Math.floor(player.x + wScale));
    let minY = Clamp(0, mapH - 1, Math.floor(player.y - hScale));
    let maxY = Clamp(0, mapH - 1, Math.floor(player.y + hScale));
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            let mag = Math.sqrt((player.x - 0.5 - x) ** 2 + (player.y - 0.5 - y) ** 2);
            if (map[x][y].isWall) {
                if (mag <= flashpower) {
                    if (!map[x][y].isSeen) {
                        seened++;
                        map[x][y].isSeen = true;
                        UpdateCounters();
                    }
                    ctx.fillStyle = map[x][y].isDanger ? colors.danger : map[x][y].color;
                } else if (map[x][y].isSeen) {
                    ctx.fillStyle = map[x][y].isDanger ? colors.hiddenDanger : colors.hiddenWall;
                } else if (godMode) {
                    ctx.fillStyle = map[x][y].isDanger ? colors.godModeDanger : colors.godModeWall;
                } else {
                    continue;
                }
                let xx = Math.ceil(canv.width / 2 + zz * (x - player.x));
                let yy = Math.ceil(canv.height / 2 + zz * (y - player.y));
                let ss = Math.ceil(zz);
                ctx.fillRect(xx, yy, ss, ss);
            } else {
                if (map[x][y].isSeen) {
                    ctx.fillStyle = colors.marker;
                    let xx = canv.width / 2 + zz * (x - player.x + 0.2);
                    let yy = canv.height / 2 + zz * (y - player.y + 0.2);
                    ctx.fillRect(xx, yy, zz * 0.6, zz * 0.6);
                } else if ((godMode ? true : mag <= flashpower) && map[x][y].isDanger) {
                    if (Math.floor(player.x) === x && Math.floor(player.y) === y) {
                        map[x][y].isDanger = false;
                        coins++;
                        UpdateCounters();
                    }
                    ctx.fillStyle = colors.coin;
                    let xx = canv.width / 2 + zz * (x - player.x + 0.3);
                    let yy = canv.height / 2 + zz * (y - player.y + 0.3);
                    let ss = zz * 0.4;
                    ctx.fillRect(xx, yy, ss, ss);
                }
                if ((map[x][y].toGoalVisible || godMode) && map[x][y].toGoal !== undefined) {
                    ctx.fillStyle = colors.path;

                    let xx = canv.width / 2 + zz * (Lerp(x, map[x][y].toGoal.x, time / drawPathInterval % 1) - player.x + 0.35);
                    let yy = canv.height / 2 + zz * (Lerp(y, map[x][y].toGoal.y, time / drawPathInterval % 1) - player.y + 0.35);
                    ctx.fillRect(xx, yy, zz * 0.3, zz * 0.3);

                    xx = canv.width / 2 + zz * (Lerp(x, map[x][y].toGoal.x, (time / drawPathInterval + 0.5) % 1) - player.x + 0.35);
                    yy = canv.height / 2 + zz * (Lerp(y, map[x][y].toGoal.y, (time / drawPathInterval + 0.5) % 1) - player.y + 0.35);
                    ctx.fillRect(xx, yy, zz * 0.3, zz * 0.3);
                }
            }
        }
    }

    /*if (drawPath) {
        for (let i = 0; i < truePath.length - 1; i++) {
            let mag = godMode ? 0 : Math.sqrt((player.x - 0.5 - truePath[i].x) ** 2 + (player.y - 0.5 - truePath[i].y) ** 2);
            if (mag < flashpower) {
                let xx = canv.width / 2 + zz * (Lerp(truePath[i].x, truePath[i + 1].x, time / drawPathInterval % 1) - player.x + 0.35);
                let yy = canv.height / 2 + zz * (Lerp(truePath[i].y, truePath[i + 1].y, time / drawPathInterval % 1) - player.y + 0.35);
                ctx.fillRect(xx, yy, zz * 0.3, zz * 0.3);
            }
        }
    } else {
        for (let i = 0; i < Math.min(pathLength, truePath.length - 1); i++) {
            let xx = canv.width / 2 + zz * (Lerp(truePath[i].x, truePath[i + 1].x, time / drawPathInterval % 1) - player.x + 0.35);
            let yy = canv.height / 2 + zz * (Lerp(truePath[i].y, truePath[i + 1].y, time / drawPathInterval % 1) - player.y + 0.35);
            ctx.fillRect(xx, yy, zz * 0.3, zz * 0.3);
        }
    }*/
}

function Loop(time) {
    try {
        let deltaTime = time - lastUpd;
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canv.width, canv.height);

        MovePlayer(deltaTime);

        if (autoMarker.enable && (autoMarker.lastX !== Math.round(player.x) || autoMarker.lastY !== Math.round(player.y))) {
            autoMarker.lastX = Math.round(player.x);
            autoMarker.lastY = Math.round(player.y);
            let maxX = Math.min(Math.round(autoMarker.lastX + flashpower), mapW);
            let maxY = Math.min(Math.round(autoMarker.lastY + flashpower), mapH);
            let minX = Math.max(Math.round(autoMarker.lastX - flashpower), 0);
            let minY = Math.max(Math.round(autoMarker.lastY - flashpower), 0);
            for (let x = minX; x < maxX; x++) {
                for (let y = minY; y < maxY; y++) {
                    if (!map[x][y].isWall && !map[x][y].isSeen) {
                        let wallsAround = 0;
                        if (x + 1 < mapW && map[x + 1][y].isSeen) wallsAround++;
                        if (x - 1 >= 0 && map[x - 1][y].isSeen) wallsAround++;
                        if (y + 1 < mapH && map[x][y + 1].isSeen) wallsAround++;
                        if (y - 1 >= 0 && map[x][y - 1].isSeen) wallsAround++;
                        if (wallsAround === 3)
                            map[x][y].isSeen = true;
                    }
                }
            }
        }

        if (minimapMode) {
            DrawMinimap(time);
        } else {
            DrawNormal(time);
        }

        if (cursorHold) {
            ctx.strokeStyle = colors.playerVelocity;
            ctx.beginPath();
            ctx.moveTo(canv.width / 2, canv.height / 2);
            ctx.lineTo(UnLerp(-1, 1, player.vx) * canvasSizes.w, UnLerp(-1, 1, player.vy) * canvasSizes.h);
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        ctx.lineWidth = 1;
        ctx.fillStyle = godMode ? colors.playerGodMode : (coins >= shopCosts.extraLive) ? colors.playerExtraLive : colors.player;
        ctx.strokeStyle = colors.playerBorderLine;
        ctx.beginPath();
        let xx = 0;
        let yy = 0;
        if (minimapMode) {
            xx = zz * player.x;
            yy = zz * player.y;
        } else {
            xx = canv.width / 2;
            yy = canv.height / 2;
        }
        ctx.arc(xx, yy, zz * 0.4, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(xx, yy, zz * 0.4, 0, 2 * Math.PI, true);
        ctx.stroke();
        ctx.strokeStyle = colors.flashLine;
        ctx.beginPath();
        ctx.arc(xx, yy, zz * flashpower, 0, 2 * Math.PI, true);
        ctx.stroke();
    } catch (error) {
        alert(`${error.name}: ${error.message}\n${error.stack}`);
    }
    lastUpd = time;
    requestAnimationFrame(Loop);
}

function UpdateCounters() {
    lbCoins.innerText = "$" + coins;
    let p = (Math.round(seened * 10000 / count) / 100).toFixed(2);
    lbPercent.innerText = p + "%";
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
    if (minimapMode) {
        zz = Math.min(w / mapW, h / mapH);
    } else {
        zz = canvasSizes.avg / (scale * 2);
    }
    wScale = w / zz;
    hScale = h / zz;
}

function GenMap(width, height, maze, walls, cp) {
    height = height % 2 === 0 ? height + 1 : height;
    width = width % 2 === 0 ? width + 1 : width;
    let rc = RandArr(colors.wallPrefabs);
    for (let x = 0; x < width; x++) {
        maze[x] = [];
        for (let y = 0; y < height; y++) {
            maze[x][y] = {
                isWall: true,
                color: rc(x / width, y / height),
                isDanger: Rand(0, 3) === 0,
                isSeen: false,
                toGoalVisible: false
            };
        }
    }

    function amaze(x, y, addBlockWalls) {
        maze[x][y].isWall = false;
        if (addBlockWalls && valid(x, y + 1) && (maze[x][y + 1].isWall)) {
            walls.push({x: x, y: y + 1, b: {x: x, y: y}});
        }
        if (addBlockWalls && valid(x, y - 1) && (maze[x][y - 1].isWall)) {
            walls.push({x: x, y: y - 1, b: {x: x, y: y}});
        }
        if (addBlockWalls && valid(x + 1, y) && (maze[x + 1][y].isWall)) {
            walls.push({x: x + 1, y: y, b: {x: x, y: y}});
        }
        if (addBlockWalls && valid(x - 1, y) && (maze[x - 1][y].isWall)) {
            walls.push({x: x - 1, y: y, b: {x: x, y: y}});
        }
    }

    function valid(x, y) {
        return (0 <= y && y < height && 0 <= x && x < width);
    }

    amaze(cp.x, cp.y, true);
    while (walls.length !== 0) {
        let randomWall = walls[Math.floor(Math.random() * walls.length)];
        let host = randomWall.b;
        let opposite = {
            x: (host.x + (randomWall.x - host.x) * 2),
            y: (host.y + (randomWall.y - host.y) * 2)
        };
        if (valid(opposite.x, opposite.y)) {
            if (!maze[opposite.x][opposite.y].isWall) {
                walls.splice(walls.indexOf(randomWall), 1);
            } else {
                amaze(randomWall.x, randomWall.y, false);
                amaze(opposite.x, opposite.y, true);
            }
        } else {
            walls.splice(walls.indexOf(randomWall), 1);
        }
    }
    if ((mapW === mapH && Rand(0, 2) === 0) || mapW < mapH) {
        let r = 1 + Rand(0, width / 2 - 1) * 2;
        maze[r][height - 1].isWall = false;
        goal = {x: r, y: height - 2, b: {x: r, y: height - 1}};
    } else {
        let r = 1 + Rand(0, height / 2 - 1) * 2;
        maze[width - 1][r].isWall = false;
        goal = {x: width - 2, y: r, b: {x: width - 1, y: r}};
    }
    return maze;
}

function Makeway2(x, y, map, fromDirection) {
    if (fromDirection === undefined) {
        map[x][y].toGoal = {x, y};
    } else {
        map[x][y].toGoal = fromDirection;
    }

    if (x + 2 < mapW && !map[x + 1][y].isWall && map[x + 2][y].toGoal === undefined) {
        //map[x + 1][y].toGoal = {x, y};
        map = Makeway2(x + 2, y, map, {x: x, y});
    }
    if (x - 2 > 0 && !map[x - 1][y].isWall && map[x - 2][y].toGoal === undefined) {
        //map[x - 1][y].toGoal = {x, y};
        map = Makeway2(x - 2, y, map, {x: x, y});
    }
    if (y + 2 < mapH && !map[x][y + 1].isWall && map[x][y + 2].toGoal === undefined) {
        //map[x][y + 1].toGoal = {x, y};
        map = Makeway2(x, y + 2, map, {x, y: y});
    }
    if (y - 2 > 0 && !map[x][y - 1].isWall && map[x][y - 2].toGoal === undefined) {
        //map[x][y - 1].toGoal = {x, y};
        map = Makeway2(x, y - 2, map, {x, y: y});
    }
    return map;
}

function Vibrate(pattern) {
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function UpdateCursorPos(cursor, press) {
    if (press || (press === undefined && cursorHold === true)) {
        cursorHold = true;
        let box = canv.getBoundingClientRect();
        let x = Lerp(-1, 1, UnLerp(box.left, box.right, cursor.clientX));
        let y = Lerp(-1, 1, UnLerp(box.top, box.bottom, cursor.clientY));
        let mag = Math.hypot(x, y);
        let max = Math.max(Math.abs(x), Math.abs(y));
        player.vx = x / mag * max;
        player.vy = y / mag * max;
    } else {
        cursorHold = false;
        player.vx = 0;
        player.vy = 0;
    }
}

function Shuffle(arr) {
    let j, temp;
    for (let i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }
    return arr;
}

function RandArr(array) {
    return array[Math.floor(Math.random() * (array.length))];
}

function Rand(min, max) {
    return Math.floor(min + Math.random() * (max - min));
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