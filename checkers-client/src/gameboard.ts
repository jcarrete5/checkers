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
const PIECE_SELECTION_BORDER_COLOR = 'red'
const FREE_SPACE_SELECTION_BORDER_COLOR = 'blue'
const SELECTION_BORDER_WIDTH = 2
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

var gameTurn = Space.LOCAL

/** Board state */
const board = [
    [_, X, _, X, _, X, _, X],
    [X, _, X, _, X, _, X, _],
    [_, X, _, _, _, _, _, X],
    [_, _, _, _, _, _, _, _],
    [_, _, _, X, _, X, _, _],
    [O, _, O, _, O, _, O, _],
    [_, O, _, O, _, O, _, O],
    [O, _, O, _, O, _, O, _],
]

/** Graphics context */
const _g = boardCanvas.getContext('2d')
if (!_g) throw 'Failed to load graphics 2D context for board canvas'
const g = _g

interface BoardIndex {
    row: number
    col: number
}
/** Current selected space on the board */
let selectedSpace: BoardIndex | null = null

/***************
 * FUNCTIONS
 ***************/

function isLocalMan(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.LOCAL
}

function isLocalKing(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.LOCAL_KING
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

function highlightSpace(space: BoardIndex, color: string) {
    g.strokeStyle = color
    g.beginPath()
    g.rect(space.col * SIDE_LEN, space.row * SIDE_LEN, SIDE_LEN, SIDE_LEN)
    g.lineWidth = SELECTION_BORDER_WIDTH
    g.stroke()
}

export function drawBoard() {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currentSpace = { row: i, col: j }
            g.fillStyle = (i + j) % 2 ? DARK_SPACE_COLOR : LIGHT_SPACE_COLOR
            const x = j * SIDE_LEN
            const y = i * SIDE_LEN

            g.fillRect(x, y, SIDE_LEN, SIDE_LEN)
            if (isRemotePiece({ row: i, col: j })) {
                drawCircle(x, y, REMOTE_PIECE_COLOR)
            } else if (isLocalMan({ row: i, col: j })) {
                drawCircle(x, y, LOCAL_PIECE_COLOR)
            }

            if (!selectedSpace && isMovable(currentSpace)) {
                highlightSpace(currentSpace, PIECE_SELECTION_BORDER_COLOR)
            }
        }
    }

    // highlight selected piece (if any)
    if (selectedSpace && isLocalMan(selectedSpace)) {
        //TODO: separate highlight spaces that a selected piece can move
        var topLeft = { row: selectedSpace.row - 1, col: selectedSpace.col - 1 }
        var topright = { row: selectedSpace.row - 1, col: selectedSpace.col + 1 }

        if (isSpaceInsideBoard(topLeft)) {
            if (board[topLeft.row][topLeft.col] === Space.FREE) {
                highlightSpace(topLeft, FREE_SPACE_SELECTION_BORDER_COLOR)
            }
        }
        if (isSpaceInsideBoard(topright)) {
            if (board[topright.row][topright.col] === Space.FREE) {
                highlightSpace(topright, FREE_SPACE_SELECTION_BORDER_COLOR)
            }
        }

        highlightSpace(selectedSpace, PIECE_SELECTION_BORDER_COLOR)
    }
}

function highlightMovableSpaceFor(space: BoardIndex) {}

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
    var clickedSpace = getClickedSquare(x, y)
    if (isLocalMan(clickedSpace) && isMovable(clickedSpace)) {
        selectedSpace = clickedSpace
    }
    drawBoard()
})

function isSpaceInsideBoard(space: BoardIndex) {
    if (space.row > 7 || space.row < 0 || space.col > 7 || space.col < 0) {
        return false
    }
    return true
}

function getTopLeftSpace(space: BoardIndex) {
    if (isSpaceInsideBoard(space)) {
        return { row: space.row - 1, col: space.col - 1 }
    }
    return null
}

function getTopRightSpace(space: BoardIndex) {
    if (isSpaceInsideBoard(space)) {
        return { row: space.row - 1, col: space.col + 1 }
    }
    return null
}

function isFree(space: BoardIndex) {
    return board[space.row][space.col] === Space.FREE
}

function isMovable(space: BoardIndex) {
    if (gameTurn === Space.LOCAL) {
        if (isLocalMan(space)) {
            // check if top right or top left are free
            var topLeft = getTopLeftSpace(space)
            var topRight = getTopRightSpace(space)
            if ((topLeft && isFree(topLeft)) || (topRight && isFree(topRight))) {
                return true
            } else if (topLeft && !isFree(topLeft) && isRemotePiece(topLeft)) {
                var topLeftBehind = getTopLeftSpace(topLeft)
                if (topLeftBehind && isFree(topLeftBehind)) {
                    return true
                }
            } else if (topRight && !isFree(topRight) && isRemotePiece(topRight)) {
                var topRightBehind = getTopRightSpace(topRight)
                if (topRightBehind && isFree(topRightBehind)) {
                    return true
                }
            }
        }
    }

    return false
}

// function highlightMovablePieces() {
//     for (var i = 0; i < board.length; i++) {
//         for (var j = 0; j < board[i].length; j++) {
//             if (gameTurn === Space.LOCAL) {
//                 if (!selectedSpace && board[i][j] === Space.LOCAL) {
//                     var topLeft = { row: i - 1, col: j - 1 }
//                     var topright = { row: i - 1, col: j + 1 }

//                     if (isSpaceInsideBoard(topLeft) || isSpaceInsideBoard(topright)) {
//                         if (
//                             board[topLeft.row][topLeft.col] === Space.FREE ||
//                             board[topright.row][topright.col] === Space.FREE
//                         ) {
//                             highlightSpace({ row: i, col: j }, SELECTION_BORDER_COLOR)
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }
