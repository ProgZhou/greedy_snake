// 游戏配置
const MAP_CONFIGS = {
    small: {
        gridSize: 20,
        gridCount: 15,
        speed: 150
    },
    medium: {
        gridSize: 20,
        gridCount: 20,
        speed: 130
    },
    large: {
        gridSize: 16,
        gridCount: 25,
        speed: 110
    }
};

let currentMapSize = 'medium';
let config = MAP_CONFIGS[currentMapSize];

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 初始化画布大小
function initCanvas() {
    canvas.width = config.gridSize * config.gridCount;
    canvas.height = config.gridSize * config.gridCount;
}

initCanvas();

// 游戏状态
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isGameRunning = false;

// 食物颜色数组
const FOOD_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
];
let currentFoodColor = FOOD_COLORS[0];

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
}

updateScore();

// 生成随机食物位置
function generateFood() {
    food = {
        x: Math.floor(Math.random() * config.gridCount),
        y: Math.floor(Math.random() * config.gridCount)
    };
    // 确保食物不在蛇身上
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = {
            x: Math.floor(Math.random() * config.gridCount),
            y: Math.floor(Math.random() * config.gridCount)
        };
    }
    // 随机选择食物颜色
    currentFoodColor = FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= config.gridCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * config.gridSize, 0);
        ctx.lineTo(i * config.gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * config.gridSize);
        ctx.lineTo(canvas.width, i * config.gridSize);
        ctx.stroke();
    }
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index === 0) {
            // 绘制蛇头 - 卡通风格
            const headX = segment.x * config.gridSize;
            const headY = segment.y * config.gridSize;
            
            // 头部主体
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.roundRect(headX + 2, headY + 2, config.gridSize - 4, config.gridSize - 4, 6);
            ctx.fill();
            
            // 绘制眼睛
            const eyeSize = config.gridSize * 0.15;
            const eyeOffset = config.gridSize * 0.25;
            
            // 根据方向调整眼睛位置
            let leftEyeX = headX + eyeOffset;
            let leftEyeY = headY + eyeOffset;
            let rightEyeX = headX + config.gridSize - eyeOffset;
            let rightEyeY = headY + eyeOffset;
            
            if (direction.x === 1) { // 向右
                leftEyeX = headX + config.gridSize - eyeOffset - eyeSize;
                rightEyeX = headX + config.gridSize - eyeOffset + eyeSize;
            } else if (direction.x === -1) { // 向左
                leftEyeX = headX + eyeOffset - eyeSize;
                rightEyeX = headX + eyeOffset + eyeSize;
            } else if (direction.y === 1) { // 向下
                leftEyeY = headY + config.gridSize - eyeOffset;
                rightEyeY = headY + config.gridSize - eyeOffset;
            }
            
            // 白色眼白
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 黑色瞳孔
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.arc(rightEyeX, rightEyeY, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // 绘制蛇身 - 渐变效果
            const bodyX = segment.x * config.gridSize;
            const bodyY = segment.y * config.gridSize;
            
            // 创建渐变
            const gradient = ctx.createLinearGradient(
                bodyX, bodyY, 
                bodyX + config.gridSize, bodyY + config.gridSize
            );
            gradient.addColorStop(0, '#66BB6A');
            gradient.addColorStop(1, '#43A047');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(bodyX + 3, bodyY + 3, config.gridSize - 6, config.gridSize - 6, 4);
            ctx.fill();
            
            // 添加高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(
                bodyX + config.gridSize * 0.3, 
                bodyY + config.gridSize * 0.3, 
                config.gridSize * 0.15, 
                0, Math.PI * 2
            );
            ctx.fill();
        }
    });
    
    // 绘制食物 - 彩色圆形带光晕
    const foodX = food.x * config.gridSize + config.gridSize / 2;
    const foodY = food.y * config.gridSize + config.gridSize / 2;
    const foodRadius = config.gridSize * 0.4;
    
    // 外层光晕
    const glowGradient = ctx.createRadialGradient(
        foodX, foodY, 0,
        foodX, foodY, foodRadius * 1.5
    );
    glowGradient.addColorStop(0, currentFoodColor + '80');
    glowGradient.addColorStop(1, currentFoodColor + '00');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 食物主体
    const foodGradient = ctx.createRadialGradient(
        foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, 0,
        foodX, foodY, foodRadius
    );
    foodGradient.addColorStop(0, currentFoodColor);
    foodGradient.addColorStop(1, currentFoodColor + 'CC');
    
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

// 更新游戏状态
function update() {
    // 计算新的蛇头位置
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // 检查碰撞
    if (head.x < 0 || head.x >= config.gridCount || 
        head.y < 0 || head.y >= config.gridCount ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        generateFood();
    } else {
        snake.pop();
    }
    
    draw();
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    isGameRunning = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        updateScore();
    }
    
    // 启用地图选择按钮
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.disabled = false;
    });
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>游戏结束!</h2>
        <p>得分: ${score}</p>
        <p>最高分: ${highScore}</p>
        <button onclick="location.reload()">重新开始</button>
    `;
    document.body.appendChild(gameOverDiv);
}

// 开始游戏
function startGame() {
    if (isGameRunning) return;
    
    isGameRunning = true;
    snake = [{ x: Math.floor(config.gridCount / 2), y: Math.floor(config.gridCount / 2) }];
    direction = { x: 1, y: 0 };
    score = 0;
    updateScore();
    generateFood();
    draw();
    
    // 禁用地图选择按钮
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    gameLoop = setInterval(update, config.speed);
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!isGameRunning && (e.key.startsWith('Arrow') || e.key === ' ')) {
        startGame();
        return;
    }
    
    switch(e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

// 地图选择
document.querySelectorAll('.map-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isGameRunning) return;
        
        // 更新选中状态
        document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新配置
        currentMapSize = btn.dataset.size;
        config = MAP_CONFIGS[currentMapSize];
        
        // 重新初始化画布
        initCanvas();
        
        // 重置游戏
        snake = [{ x: Math.floor(config.gridCount / 2), y: Math.floor(config.gridCount / 2) }];
        direction = { x: 0, y: 0 };
        generateFood();
        draw();
    });
});

// 初始绘制
draw();