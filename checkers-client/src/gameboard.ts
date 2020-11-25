/**
 * gameboard.ts
 *
 * Module for implementing rendering and maintaining state of the gameboard.
 */

const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement

/*************
 * CONSTANTS
 *************/

const LOCAL_PIECE_COLOR = '#edf285'
const REMOTE_PIECE_COLOR = '#fd8c04'
const DARK_SPACE_COLOR = '#8db596'
const LIGHT_SPACE_COLOR = '#bedbbb'
const SELECTION_BORDER_COLOR = 'red'
const SELECTION_WIDTH = 2
const SIDE_LEN = boardCanvas.width / 8

/** Enumeration of values that can occupy a space on the board. */
enum Space {
    /** A free space */
    FREE,
    /** Local player's man */
    LOCAL,
    /** Remote player's man */
    REMOTE,
    /** Local player's king */
    LOCAL_KING,
    /** Remote player's king */
    REMOTE_KING,
}

/************************
 * STATE INITIALIZATION
 ************************/

const O = Space.LOCAL
const X = Space.REMOTE
const _ = Space.FREE

/** Board state */
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

/** Graphics context */
const _g = boardCanvas.getContext('2d')
if (!_g) throw 'Failed to load graphics 2D context for board canvas'
const g = _g

interface BoardIndex {
    row: number,
    col: number
}
/** Current selected space on the board */
let selectedSpace: BoardIndex | null = null

/***************
 * FUNCTIONS
 ***************/

function isLocalPiece(i: BoardIndex) {
    return board[i.row][i.col] === Space.LOCAL || board[i.row][i.col] === Space.LOCAL_KING
}

function isRemotePiece(i: BoardIndex) {
    return board[i.row][i.col] === Space.REMOTE || board[i.row][i.col] === Space.REMOTE_KING
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
            if (isRemotePiece({row: i, col: j})) {
                drawCircle(x, y, REMOTE_PIECE_COLOR)
            } else if (isLocalPiece({row: i, col: j})) {
                drawCircle(x, y, LOCAL_PIECE_COLOR)
            }
        }
    }

    // highlight selected piece (if any)
    if (selectedSpace && isLocalPiece(selectedSpace)) {
        g.strokeStyle = SELECTION_BORDER_COLOR
        g.beginPath()
        g.rect(selectedSpace.col * SIDE_LEN, selectedSpace.row * SIDE_LEN, SIDE_LEN, SIDE_LEN)
        g.lineWidth = SELECTION_WIDTH
        g.stroke()
    }
}

function getMousePosition(canvas: HTMLCanvasElement, event: MouseEvent) {
    let rect = canvas.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    return { x, y }
}

function getClickedSquare(x: number, y: number) {
    var row: number = 0
    var col: number = 0
    row = Math.floor(y / SIDE_LEN)
    col = Math.floor(x / SIDE_LEN)
    console.log(`row: ${row}, col: ${col}`)
    return { row, col }
}

boardCanvas.addEventListener('click', (e) => {
    var { x, y } = getMousePosition(boardCanvas, e)

    var { row, col } = getClickedSquare(x, y)
    if (board[row][col] === Space.LOCAL) {
        selectedSpace = { row, col }
    }
    drawBoard()
})
