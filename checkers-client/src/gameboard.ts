/**
 * gameboard.ts
 *
 * Module for implementing rendering and maintaining state of the gameboard.
 */

/** Initialize graphics context */
const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement
const _g = boardCanvas.getContext('2d')
if (!_g) throw 'Failed to load graphics 2D context for board canvas'
const g = _g

/** Enumeration of values that can occupy a space on the board. */
enum Space {
    FREE,           /** A free space */
    LOCAL,          /** Local player's man */
    REMOTE,         /** Remote player's man */
    LOCAL_KING,     /** Local player's king */
    REMOTE_KING,    /** Remote player's king */
}

/** Initialize board state */
const O = Space.LOCAL
const X = Space.REMOTE
const _ = Space.FREE
const board = [
    [_, X, _, X, _, X, _, X],
    [X, _, X, _, X, _, X, _],
    [_, X, _, X, _, X, _, X],
    [_, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _],
    [O, _, O, _, O, _, O, _],
    [_, O, _, O, _, O, _, O],
    [O, _, O, _, O, _, O, _],
]

const LOCAL_PIECE_COLOR = '#edf285'
const REMOTE_PIECE_COLOR = '#fd8c04'
const DARK_SPACE_COLOR = '#8db596'
const LIGHT_SPACE_COLOR = '#bedbbb'
const SIDE_LEN = boardCanvas.width / 8

function isLocalPiece(i: number, j: number) {
    return board[i][j] === Space.LOCAL || board[i][j] === Space.LOCAL_KING
}

function isRemotePiece(i: number, j: number) {
    return board[i][j] === Space.REMOTE || board[i][j] === Space.REMOTE_KING
}

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
            g.fillStyle = (i + j) % 2 ? DARK_SPACE_COLOR : LIGHT_SPACE_COLOR
            const x = j * SIDE_LEN
            const y = i * SIDE_LEN

            g.fillRect(x, y, SIDE_LEN, SIDE_LEN)
            if (isRemotePiece(i, j)) {
                drawCircle(x, y, REMOTE_PIECE_COLOR)
            } else if (isLocalPiece(i, j)) {
                drawCircle(x, y, LOCAL_PIECE_COLOR)
            }
        }
    }
}

function getMousePosition(canvas: HTMLCanvasElement, event: MouseEvent) {
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

    /* TODO this needs to update the state. Drawing should only be done in drawBoard
     * RATIONALE: The board will need to be redrawn everytime something on the
     * board changes (i.e. the board state) to avoid leaving previously drawn
     * artifacts behind. Therefore all of the drawing code should happen in one
     * place so everything can be redrawn at once. */

    // highlight selected piece (if any)
    if (board[i][j] === Space.LOCAL) {
        g.beginPath()
        g.rect(j * SIDE_LEN, i * SIDE_LEN, SIDE_LEN, SIDE_LEN)
        g.lineWidth = 3
        g.strokeStyle = 'red'
        g.stroke()
    }
})
