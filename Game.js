//TODO need to double check the behaviour of the rounded paddle

class Game {
  constructor() {
    // Cache DOM elements
    this.gameContainer = document.querySelector('.game-container')
    this.gameBoard = document.querySelector('.game-board')
    this.bricksGrid = document.getElementById('bricks-grid')
    this.paddle = document.getElementById('paddle')
    this.ball = document.getElementById('ball')
    this.livesCount = document.getElementById('lives-count')
    this.scoreValue = document.getElementById('score-value')
    this.timeValue = document.getElementById('time-value')

    this.startScreen = document.getElementById('start-screen')
    this.gameOverScreen = document.getElementById('game-over-screen')
    this.pauseScreen = document.getElementById('pause-screen')
    this.winScreen = document.getElementById('win-screen')

    this.startBtn = document.getElementById('start-btn')
    this.playAgainBtn = document.getElementById('play-again-btn')
    this.pauseBtn = document.getElementById('pause-btn')
    this.resumeBtn = document.getElementById('resume-btn')
    this.restartBtn = document.getElementById('restart-btn')
    this.nextLevelBtn = document.getElementById('next-level-btn')

    this.isPlaying = false
    this.isPaused = false
    this.level = 1
    this.lives = 3
    this.score = 0
    this.time = 0
    this.timerInterval = null

    this.paddleWidth = 100
    this.paddleHeight = 15
    this.ballSize = 18
    this.brickRowCount = 3
    this.brickColumnCount = 8
    this.rightPressed = false
    this.leftPressed = false

    this.paddleCollisionTolerance = 5

    this.startBtn.addEventListener('click', () => this.startGame())
    this.playAgainBtn.addEventListener('click', () => this.resetGame())
    this.pauseBtn.addEventListener('mouseup', () => this.togglePause())
    this.resumeBtn.addEventListener('click', () => this.togglePause())
    this.restartBtn.addEventListener('click', () => this.resetGame())
    this.nextLevelBtn.addEventListener('click', () => this.resetGame())

    document.addEventListener('keydown', (e) => this.keyDownHandler(e))
    document.addEventListener('keyup', (e) => this.keyUpHandler(e))
    window.addEventListener('resize', () => this.handleResize())

    if (window.innerWidth <= 600) {
      this.showMobileWarning()
      return
    }

    this.init()
  }

  init() {
    this.updateDimensions()

    this.paddleX = (this.gameBoard.offsetWidth - this.paddleWidth) / 2
    this.ballX = this.gameBoard.offsetWidth / 2 - this.ballSize / 2
    this.ballY = this.gameBoard.offsetHeight - 100
    this.ballSpeedX = this.calculateBallSpeed(4)
    this.ballSpeedY = -this.calculateBallSpeed(4)
    this.normalizeBallSpeed()
    this.paddle.style.width = `${this.paddleWidth}px`
    this.paddle.style.height = `${this.paddleHeight}px`
    this.ball.style.width = `${this.ballSize}px`
    this.ball.style.height = `${this.ballSize}px`

    this.updatePaddlePosition()    // need to do something about this
    this.ball.style.transform = `translate(${this.ballX}px, ${this.ballY})`
    // this.ball.style.transform = `translateX(${}px)`

    this.showScreen('start')
    this.createBricks()
  }

  updateDimensions() {
    const boardWidth = this.gameBoard.offsetWidth
    const boardHeight = this.gameBoard.offsetHeight

    this.paddleWidth = Math.max(60, boardWidth * 0.12)
    this.paddleHeight = Math.max(10, boardHeight * 0.025)

    this.ballSize = Math.max(12, boardWidth * 0.022)

    if (boardWidth < 500) {
      this.brickColumnCount = 6
    } else if (boardWidth < 700) {
      this.brickColumnCount = 7
    } else {
      this.brickColumnCount = 8
    }

    this.paddleCollisionTolerance = Math.max(5, this.ballSize * 0.3)
  }

  handleResize() {
    if (window.innerWidth <= 600) {
      return
    }

    this.updateDimensions()

    this.paddle.style.width = `${this.paddleWidth}px`
    this.paddle.style.height = `${this.paddleHeight}px`
    this.ball.style.width = `${this.ballSize}px`
    this.ball.style.height = `${this.ballSize}px`

    this.paddleX = Math.min(
      this.paddleX,
      this.gameBoard.offsetWidth - this.paddleWidth
    )

    if (!this.isPlaying && !this.isPaused) {
      this.createBricks()
    }

    this.updatePaddlePosition()
  }

  normalizeBallSpeed() {
    const currentSpeed = Math.sqrt(this.ballSpeedX ** 2 + this.ballSpeedY ** 2)
    const desiredSpeed = this.calculateBallSpeed(9)

    if (currentSpeed === 0) return

    const scale = desiredSpeed / currentSpeed
    this.ballSpeedX *= scale
    this.ballSpeedY *= scale
  }

  createBricks() {
    this.bricksGrid.innerHTML = ''
    this.bricks = []

    const padding = Math.max(4, this.gameBoard.offsetWidth * 0.01)
    const offsetX = Math.max(10, this.gameBoard.offsetWidth * 0.025)
    const offsetY = Math.max(10, this.gameBoard.offsetHeight * 0.033)
    const brickWidth = (this.gameBoard.offsetWidth - offsetX * 2 - padding * (this.brickColumnCount - 1)) / this.brickColumnCount
    const brickHeight = Math.max(15, this.gameBoard.offsetHeight * 0.04)

    for (let r = 0; r < this.brickRowCount + this.level; r++) {
      for (let c = 0; c < this.brickColumnCount; c++) {
        const brickX = offsetX + c * (brickWidth + padding)
        const brickY = offsetY + r * (brickHeight + padding)

        const brick = document.createElement('div')
        brick.className = 'brick'
        brick.style.width = `${brickWidth}px`
        brick.style.height = `${brickHeight}px`
        brick.style.left = `${brickX}px`
        brick.style.top = `${brickY}px`

        this.bricksGrid.appendChild(brick)

        this.bricks.push({
          x: brickX,
          y: brickY,
          width: brickWidth,
          height: brickHeight,
          destroyed: false,
          element: brick,
        })
      }
    }
  }

  calculateBallSpeed(baseSpeed) {
    const scaleFactor = Math.min(
      this.gameBoard.offsetWidth / 800,
      this.gameBoard.offsetHeight / 530
    )
    return baseSpeed * scaleFactor
  }

  startGame() {
    this.isPlaying = true
    this.isPaused = false
    this.hideAllScreens()

    this.updatePaddlePosition()

    this.ballSpeedX = this.calculateBallSpeed(4) * (Math.random() > 0.5 ? 1 : -1)
    this.ballSpeedY = -this.calculateBallSpeed(4)
    this.normalizeBallSpeed()

    this.startTimer()
    this.gameLoop()
  }

  resetGame() {
    // this.gameBoard.innerHTML = ''
    this.lives = 3
    this.score = 0
    this.time = 0
    this.level = 1
    this.updateStats()

    this.paddleX = (this.gameBoard.offsetWidth - this.paddleWidth) / 2
    this.ballX = this.gameBoard.offsetWidth / 2 - this.ballSize / 2
    this.ballY = this.gameBoard.offsetHeight - 100

    this.createBricks()
    this.startGame()
  }

  nextLevel() {
    this.level++
    this.createBricks()
    this.startGame()
  }

  togglePause() {
    if (!this.isPlaying) return

    this.isPaused = !this.isPaused
console.log(this.isPaused, Error.call());


    if (this.isPaused) {
      this.showScreen('pause')
      clearInterval(this.timerInterval)
    } else {
      this.hideAllScreens()
      this.startTimer()
      this.gameLoop()
    }
  }

  gameOver() {
    this.isPlaying = false
    clearInterval(this.timerInterval)

    document.getElementById('final-score').textContent = this.score
    document.getElementById('final-time').textContent = `${this.time}s`
    document.getElementById('result-title').textContent = 'GAME OVER'
    document.getElementById('result-title').style.backgroundImage = 'linear-gradient(to right, #ff416c, #ff4b2b)'

    this.showScreen('game-over')
  }

  levelComplete() {
    this.isPlaying = false
    clearInterval(this.timerInterval)

    document.getElementById('win-score').textContent = this.score
    document.getElementById('win-time').textContent = `${this.time}s`

    this.showScreen('win')
  }

  startTimer() { // TODO need better time management 
    clearInterval(this.timerInterval)

    this.timerInterval = setInterval(() => {
      this.time++
      this.timeValue.textContent = this.time
    }, 1000)
  }

  updateStats() {
    this.livesCount.textContent = this.lives
    this.scoreValue.textContent = this.score
    this.timeValue.textContent = this.time
  }

  showScreen(screen) {
    this.hideAllScreens()

    switch (screen) {
      case 'start':
        this.startScreen.style.display = 'flex'
        break
      case 'game-over':
        this.gameOverScreen.style.display = 'flex'
        break
      case 'pause':
        this.pauseScreen.style.display = 'flex'
        break
      case 'win':
        this.winScreen.style.display = 'flex'
        break
    }
  }

  hideAllScreens() {
    this.startScreen.style.display = 'none'
    this.gameOverScreen.style.display = 'none'
    this.pauseScreen.style.display = 'none'
    this.winScreen.style.display = 'none'
  }

  updatePaddlePosition() {
    // this.paddle.style.left = '50%'
// let m = this.paddleX-this.paddleWidth/2
    // this.paddle.style.transform = `${m}px`
    this.paddle.style.transform = `translate( calc(-50% + ${this.paddleX - (this.gameBoard.offsetWidth - this.paddleWidth) / 2}px))`
  }

  resetBall() {
    this.ballX = this.gameBoard.offsetWidth / 2 - this.ballSize / 2
    this.ballY = this.gameBoard.offsetHeight - 100
    this.paddleX = (this.gameBoard.offsetWidth - this.paddleWidth) / 2
    this.ballSpeedX = this.calculateBallSpeed(4) * (Math.random() > 0.5 ? 1 : -1)
    this.ballSpeedY = -this.calculateBallSpeed(4)
    this.normalizeBallSpeed()

    this.ball.style.left = `${this.ballX}px`
    this.ball.style.top = `${this.ballY}px`
    this.updatePaddlePosition()
  }

  handlePaddleCollision(adjustedPaddleRect, ballRect) { //TODO the ball sticks to the paddle on the sides 

    const ballBottom = ballRect.top + ballRect.height;
    const ballTop = ballRect.top;
    const ballCenterX = ballRect.left + ballRect.width / 2;
    const ballCenterY = ballRect.top + ballRect.height / 2;

    const isOverlapping =
      ballBottom >= adjustedPaddleRect.top &&
      // ballTop <= adjustedPaddleRect.bottom &&
      ballCenterX >= adjustedPaddleRect.left &&
      ballCenterX <= adjustedPaddleRect.right;

    if (isOverlapping) {

      const dx = ballCenterX - (adjustedPaddleRect.left + adjustedPaddleRect.width / 2);
      const dy = ballCenterY - (adjustedPaddleRect.top + adjustedPaddleRect.height / 2);
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      const paddleApprox = adjustedPaddleRect.width / 2;
      const ballRadius = this.ballSize / 2;
      // const dist = Math.sqrt(this.ballSpeedX ** 2 + this.ballSpeedY ** 2);

      if (distance < paddleApprox + ballRadius) {
        const angle = Math.atan2(dy, dx)
        this.ballSpeedX = Math.cos(angle)
        this.ballSpeedY = Math.sin(angle)
      } else {
        const paddleCenter = adjustedPaddleRect.left + adjustedPaddleRect.width / 2
        const hitPoint = (ballCenterX - paddleCenter) / (adjustedPaddleRect.width / 2)
        const bounceAngle = hitPoint * (Math.PI / 4)

        this.ballSpeedX = Math.sin(bounceAngle)
        this.ballSpeedY = -Math.cos(bounceAngle)
      }
      this.normalizeBallSpeed()

    }
  }


  loseLife() {
    this.lives--
    this.updateStats()

    if (this.lives <= 0) {
      this.gameOver()
      return true
    } else {
      this.resetBall()
      return false
    }
  }

  gameLoop() {
    if (!this.isPlaying || this.isPaused) return

    this.ballX += this.ballSpeedX
    this.ballY += this.ballSpeedY

    // Wall collision (left/right)
    if (this.ballX <= 0 || this.ballX + this.ballSize >= this.gameBoard.offsetWidth) {
      this.ballSpeedX = -this.ballSpeedX
      this.normalizeBallSpeed()

      // Keep ball within bounds
      if (this.ballX < 0) this.ballX = 0
      if (this.ballX + this.ballSize > this.gameBoard.offsetWidth) {
        this.ballX = this.gameBoard.offsetWidth - this.ballSize
      }
    }

    // Top wall collision
    if (this.ballY <= 0) {
      this.ballSpeedY = -this.ballSpeedY
      this.ballY = 0
    }

    // Bottom collision 
    if (this.ballY >= this.gameBoard.offsetHeight) {
      // console.log(this.ballY + this.ballSize, this.gameBoard.offsetHeight)

      if (this.loseLife()) return
    }

    const ballRect = {
      left: this.ballX,
      right: this.ballX + this.ballSize,
      top: this.ballY,
      bottom: this.ballY + this.ballSize,
      width: this.ballSize,
      height: this.ballSize
    }

    const paddleRect = this.paddle.getBoundingClientRect()
    const gameBoardRect = this.gameBoard.getBoundingClientRect()

    const adjustedPaddleRect = {
      left: paddleRect.left - gameBoardRect.left,
      right: paddleRect.right - gameBoardRect.left,
      top: paddleRect.top - gameBoardRect.top,
      bottom: paddleRect.bottom - gameBoardRect.top,
      width: paddleRect.width,
      height: paddleRect.height
    }
    this.handlePaddleCollision(adjustedPaddleRect, ballRect)

    // Brick collision
    let bricksRemaining = 0
    for (let brick of this.bricks) {
      if (brick.destroyed) continue
      bricksRemaining++

      const bx = brick.x
      const by = brick.y
      const bw = brick.width
      const bh = brick.height

      const brickLeft = bx
      const brickRight = bx + bw
      const brickTop = by
      const brickBottom = by + bh

      const isColliding =
        ballRect.right > brickLeft &&
        ballRect.left < brickRight &&
        ballRect.bottom > brickTop &&
        ballRect.top < brickBottom

      if (isColliding) {
        brick.destroyed = true
        brick.element.classList.add('destroyed')
        this.score += 10 * this.level
        this.updateStats()

        const prevBallX = this.ballX - this.ballSpeedX
        const prevBallY = this.ballY - this.ballSpeedY
        const prevBallRect = {
          left: prevBallX,
          right: prevBallX + this.ballSize,
          top: prevBallY,
          bottom: prevBallY + this.ballSize
        }

        const hitFromTop = prevBallRect.bottom <= brickTop
        const hitFromBottom = prevBallRect.top >= brickBottom
        const hitFromLeft = prevBallRect.right <= brickLeft
        const hitFromRight = prevBallRect.left >= brickRight

        if (hitFromTop || hitFromBottom) {
          this.ballSpeedY = -this.ballSpeedY
        } else if (hitFromLeft || hitFromRight) {
          this.ballSpeedX = -this.ballSpeedX
        } else {
          this.ballSpeedY = -this.ballSpeedY
        }
        this.normalizeBallSpeed()
        break // Only handle one brick collision per frame
      }
    }

    if (bricksRemaining === 0) {
      this.levelComplete()
      return
    }

    this.ball.style.left = `${this.ballX}px`
    this.ball.style.top = `${this.ballY}px`

    const paddleSpeed = this.calculateBallSpeed(8)
    if (this.rightPressed) {
      this.paddleX = Math.min(this.paddleX + paddleSpeed, this.gameBoard.offsetWidth - this.paddleWidth)
    }
    if (this.leftPressed) {
      this.paddleX = Math.max(this.paddleX - paddleSpeed, 0)
    }

    this.updatePaddlePosition()

    requestAnimationFrame(() => this.gameLoop())
  }

  keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      this.rightPressed = true
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      this.leftPressed = true
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      this.togglePause()
    }
  }

  keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      this.rightPressed = false
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      this.leftPressed = false
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game()
})