"use strict";
let ctx;
let canv;
let lastUpd = new Date().getTime();
let backgroundColor = "#333";
let moveDirection = 0; // 0=Left, 1=Right, 2=Up, 3=Down
let mapSize = 8; // 2, 4, 8, 16 or 32
let snake = [];
let snakeHead = {x: mapSize / 2, y: mapSize / 2};
let fruit;
let snakeLength = 3;

window.onload = () => {
    document.body.addEventListener("keydown", onkeydown, false);
    RandFruit();
    canv = document.getElementById("canvas");
    canv.width = 32;
    canv.height = 32;
    ctx = canv.getContext("2d");
    ctx.lineWidth = 3;
    document.head || (document.head = document.getElementsByTagName('head')[0]);
    setInterval(Loop, 300);
};

function onkeydown(key) {
    switch (key.code) {
        case "KeyW":
        case "ArrowUp":
            moveDirection = 2;
            break;
        case "KeyA":
        case "ArrowLeft":
            moveDirection = 0;
            break;
        case "KeyS":
        case "ArrowDown":
            moveDirection = 3;
            break;
        case "KeyD":
        case "ArrowRight":
            moveDirection = 1;
            break;
    }
}

function Loop() {
    let time = new Date().getTime();
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 32, 32);

    while (snakeLength > snake.length) {
        snake.push(Object.assign({}, snakeHead));
    }

    switch (moveDirection) {
        case 0:
            snakeHead.x--;
            break;
        case 1:
            snakeHead.x++;
            break;
        case 2:
            snakeHead.y--;
            break;
        case 3:
            snakeHead.y++;
            break;
    }
    if (snakeHead.x >= mapSize || snakeHead.x < 0) snakeHead.x = Repeat(snakeHead.x, mapSize);
    if (snakeHead.y >= mapSize || snakeHead.y < 0) snakeHead.y = Repeat(snakeHead.y, mapSize);

    let last = snake.pop();
    last.x = snakeHead.x;
    last.y = snakeHead.y;
    snake.unshift(last);

    if (fruit.x === snakeHead.x && fruit.y === snakeHead.y) {
        snakeLength++;
        RandFruit();
    }

    let size = 32 / mapSize;
    for (let s = 0; s < snake.length; s++) {
        if (s % 3 === 0)
            ctx.fillStyle = `#80A531`;
        else
            ctx.fillStyle = `#A3D746`;
        ctx.fillRect(snake[s].x * size, snake[s].y * size, size, size);
    }
    ctx.fillStyle = `#5076F9`;
    ctx.fillRect(snakeHead.x * size, snakeHead.y * size, size, size);
    ctx.fillStyle = `#F43706`;
    ctx.fillRect(fruit.x * size, fruit.y * size, size, size);

    changeFavicon(canv.toDataURL("image/png"));
    lastUpd = time;
}

function RandFruit() {
    let emptyDots = [];
    for (let x = 0; x < mapSize; x++) {
        for (let y = 0; y < mapSize; y++) {
            let ok = true;
            for (let s = 0; s < snake; s++) {
                if (snake[s].x === x && snake[s].y === y) {
                    ok = false;
                    break;
                }
            }
            if (ok) emptyDots.push({x, y});
        }
    }
    fruit = emptyDots[Math.floor(Math.random() * emptyDots.length)];
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

function Repeat(t, length) {
    return t - Math.floor(t / length) * length;
}