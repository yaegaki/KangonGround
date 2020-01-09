(() => {
    const width = 600;
    const height = 500;

    // highDPI対応
    const canvas = document.getElementById('canvas');
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let prevTime = Date.now();
    function frame() {
        const currentTime = Date.now();
        // 秒単位に変換
        const deltaTime = (currentTime - prevTime) / 1000;
        prevTime = currentTime;

        update(deltaTime);

        requestAnimationFrame(frame);
    }

    const kangon = new Image();
    kangon.src = 'img/kangon.png';
    let kangonLoaded = false;
    kangon.addEventListener('load', () => {
        kangonLoaded = true;
    });

    let inputState = {
        'mousedown': false,
        'space': false,
    };

    let state = 0;
    let prevState = 0;
    const highscore = JSON.parse(localStorage.getItem('score') || JSON.stringify({score: 0}));
    function update(deltaTime) {
        ctx.clearRect(0, 0, width, height);
        if (!kangonLoaded) {
            drawItalicText(width / 2, height / 2, 'Now Loading...', 'white', 40);
            return;
        }

        const isFirstFrame = state !== prevState;
        if (isFirstFrame)
        {
            prevState = state;
        }

        switch (state) {
            case 0:
                title(deltaTime, isFirstFrame);
                break;
            case 1:
                game(deltaTime, isFirstFrame);
                break;
            case 2:
                result(deltaTime, isFirstFrame);
                break;
        }

        inputState = {
            'mousedown': false,
            'space': false,
        };
    }

    function title(deltaTime, isFirstFrame) {
        const center = width / 2;
        drawText(center, 100, 'KANGON', 'white', 40);
        drawText(center, 150, 'GROUND', 'white', 40);

        drawText(center, 240, `Highscore:${highscore.score}`, 'white', 20);

        drawItalicText(center, 400, `Click to start!`, 'white', 20);

        if (inputState.mousedown) {
            state = 1;
        }
    }

    let score = 0;
    const selfRadius = 30;
    const selfX = 55;
    let selfY = 0;
    let selfVelocity = 0;
    const thornHeight = 85;
    const thornWidth = 50;
    const areaMargin = 50;
    const areaTop = areaMargin;
    const areaBottom = height - areaMargin;
    const selfTopLimit = areaTop + selfRadius;
    // 地面から微妙に浮かせる
    const selfBottomLimit = areaBottom - selfRadius - 6;
    // none: 0, up: 1, down: 2
    let dir = 0;
    let thornX = 0;
    // up: 1, down: 2
    let thornDir = 0;
    const thornSpawnX = width + 200;
    const thornDespawnX = -200;
    const thornSpeed = 550;
    const thronSpeedAcc = 5;
    let thornCount = 0;
    function game(deltaTime, isFirstFrame) {
        if (isFirstFrame) {
            score = 0;
            selfY = selfBottomLimit;
            selfVelocity = 0;
            dir = 0;
            thornX = thornSpawnX;
            thornDir = Math.floor(Math.random() * 2) === 0 ? 1 : 2;
            thornCount = 1;
        }

        ctx.fillStyle = 'red';
        // 天井と床の描画
        ctx.fillRect(0, 0, width, areaMargin);
        ctx.fillRect(0, areaBottom, width, areaMargin);

        // スコア
        drawText(480, 35, `Score:${score}`, 'white', 25);

        const g = 500;
        if (dir === 1) {
            selfVelocity += -g * deltaTime;
            selfY += selfVelocity * deltaTime;
            if (selfY < selfTopLimit) {
                selfY = selfTopLimit;
                dir = 0;
            }
        }
        else if (dir === 2) {
            selfVelocity += g * deltaTime;
            selfY += selfVelocity * deltaTime;
            if (selfY > selfBottomLimit) {
                selfY = selfBottomLimit;
                dir = 0;
            }
        }
        // どちらにも進んでいないときのみマウス入力を受け付ける
        else if (inputState.mousedown) {
            dir = selfY > selfTopLimit ? 1 : 2;
            selfVelocity = 0;
            // ジャンプしたときにスコア加算
            score++;
        }

        // とげを動かす
        thornX -= (thornSpeed + Math.floor(thornCount / 5) * thronSpeedAcc) * deltaTime;
        console.log((thornSpeed + Math.floor(thornCount / 5) * thronSpeedAcc));

        const thornY = thornDir === 1 ? areaTop + thornHeight : areaBottom - thornHeight;
        const h = thornDir === 1 ? -thornHeight : thornHeight;

        // とげ描画
        drawTriangle(thornX, thornY, thornWidth, h, 'white');

        // 自機描画
        const kangonOffset = 20;
        ctx.drawImage(kangon, 0, 0, kangon.width, kangon.height, selfX - selfRadius - 5, selfY - selfRadius - 5, selfRadius * 2 + kangonOffset, selfRadius * 2 + kangonOffset);
        // ctx.beginPath();
        // ctx.arc(selfX, selfY, selfRadius,0, Math.PI*2);
        // ctx.fill();

        const thornTopPos = { x: thornX, y: thornY };
        const thornLeftPos = { x: thornX - thornWidth / 2, y: thornY + h };
        const thornRightPos = { x: thornX + thornWidth / 2, y: thornY + h };
        const line1 = vecSub(thornTopPos, thornLeftPos);
        const line2 = vecSub(thornTopPos, thornRightPos);

        const selfPos = { x: selfX, y: selfY };
        if (collision(vecSub(selfPos, thornLeftPos), selfRadius, line1) || collision(vecSub(selfPos, thornRightPos), selfRadius, line2)) {
            state = 2;
            return;
        }

        if (thornX < thornDespawnX) {
            thornX = thornSpawnX;
            thornDir = Math.random() < 0.5 ? 1 : 2;
            thornCount++;
        }

        // if (inputState.space) { state = 0; }
    }

    let isBestscore = false;
    function result(deltaTime, isFirstFrame) {
        if (isFirstFrame) {
            isBestscore = score > highscore.score;
            if (isBestscore) {
                highscore.score = score;
                localStorage.setItem('score', JSON.stringify(highscore));
            }
        }

        const center = width / 2;
        if (isBestscore) {
            drawText(center, 100, 'Bestscore!', 'red', 30);
        }
        drawText(center, 150, 'Game Over!', 'white', 30);

        drawText(center, 240, `Score:${score}`, 'white', 30);
        drawText(center, 300, `Highscore:${highscore.score}`, 'white', 30);

        drawItalicText(center, 400, `Click to restart!`, 'white', 20);

        if (inputState.mousedown) {
            state = 1;
        }
    }

    function drawText(x, y, text, color, size, font) {
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.font = `${size}pt ${font || 'sans-serif'}`;
        ctx.fillText(text, x, y);
    }

    function drawItalicText(x, y, text, color, size, font) {
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.font = `italic bold ${size}pt ${font || 'sans-serif'}`;
        ctx.fillText(text, x, y);
    }

    function drawTriangle (x, y, w, h, color) {
        ctx.fillStyle = color;
        const bottom = y + h;
        const left = x - w / 2;
        const right = x + w / 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.fill();
    }

    function vecSub(p1, p2) {
        return {
            x: p1.x - p2.x,
            y: p1.y - p2.y,
        };
    }

    function vecDot(p1, p2) {
        return p1.x * p2.x + p1.y * p2.y;
    }

    function vecCross(p1, p2) {
        return p1.x * p2.y - p2.x * p1.y;
    }

    function vecDistance(p) {
        return Math.sqrt(p.x * p.x + p.y * p.y);
    }


    function collision(circleVec, radius, lineVec) {
        const circleToLine = Math.abs(vecCross(lineVec, circleVec)) / vecDistance(lineVec);
        if (circleToLine <= radius) {
            const endToCircleVec = vecSub(circleVec, lineVec);
            if (vecDot(circleVec, lineVec) * vecDot(endToCircleVec, lineVec) <= 0) {
                return true;
            }

            if (circleToLine > vecDistance(circleVec) || circleToLine > vecDistance(endToCircleVec)) {
                return true;
            }
        }

        return false;
    }

    frame();

    document.addEventListener('keydown', e => {
        if (e.keyCode === 32) {
            inputState.space = true;
        }
    });

    canvas.addEventListener('mousedown', e => {
        inputState.mousedown = true;
    });
})();

