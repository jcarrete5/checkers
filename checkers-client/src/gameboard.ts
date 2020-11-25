/**
 * gameboard.ts
 *
 * Module for implementing rendering and maintaining state of the gameboard.
 */

/** Init graphics context */
const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement
const _g = boardCanvas.getContext('2d')
if (!_g) throw 'Failed to load graphics 2D context for board canvas'
const g = _g

const NUM_ROWS = 8
const NUM_COLS = 8
const SIDE_LEN = boardCanvas.width / 8
const g = boardCanvas.getContext('2d')
const board = [
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
]

function drawCircle(x: number, y: number, color: string) {
    g.fillStyle = color
    g.beginPath()
    g.arc(x + SIDE_LEN / 2, y + SIDE_LEN / 2, SIDE_LEN / 2, 0, Math.PI * 2, false)
    g.closePath()
    g.fill()
}
export function drawBoard() {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            g.fillStyle = (i + j) % 2 ? '#8db596' : '#bedbbb'
            const x = j * SIDE_LEN
            const y = i * SIDE_LEN

            g.fillRect(x, y, SIDE_LEN, SIDE_LEN)
            if (board[i][j] === 2) {
                drawCircle(x, y, '#fd8c04')
            } else if (board[i][j] === 1) {
                drawCircle(x, y, '#edf285')
            }
        }
    }
}

function getMousePosition(canvas: HTMLCanvasElement, event: any) {
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return { x, y }
}

function getClickedSquare(x: number, y: number) {
    var i: number = 0
    var j: number = 0
    i = Math.floor(y / SIDE_LEN)
    j = Math.floor(x / SIDE_LEN)
    console.log(`i: ${i}, j: ${j}`)
    return { i, j }
}

boardCanvas.addEventListener('click', (e) => {
    var { x, y } = getMousePosition(boardCanvas, e)
    var { i, j } = getClickedSquare(x, y)

    // highlight selected piece (if any)
    if (board[i][j] === 1) {
        g.beginPath()
        g.rect(j * SIDE_LEN, i * SIDE_LEN, SIDE_LEN, SIDE_LEN)
        g.lineWidth = 3
        g.strokeStyle = 'red'
        g.stroke()
    }
})
