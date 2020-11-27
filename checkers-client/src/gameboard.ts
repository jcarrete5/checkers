/**
 * gameboard.ts
 *
 * Module for implementing rendering and maintaining state of the gameboard.
 */

const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement

/*************
 * CONSTANTS
 *************/

const LOCAL_MAN_COLOR = '#edf285'
const LOCAL_KING_COLOR = '#000000'
const REMOTE_MAN_COLOR = '#fd8c04'
const REMOTE_KING_COLOR = '#f4f4f2'
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
    LOCAL_MAN,
    /** Remote player's man */
    REMOTE_MAN,
    /** Local player's king */
    LOCAL_KING,
    /** Remote player's king */
    REMOTE_KING,
}

/** Enumberation of values that indicate the direction to check movable spaces. */
enum Direction {
    TOP_LEFT,
    TOP_RIGHT,
}
/************************
 * STATE INITIALIZATION
 ************************/

const O = Space.LOCAL_MAN
const X = Space.REMOTE_MAN
const K = Space.LOCAL_KING
const Q = Space.REMOTE_KING
const _ = Space.FREE

var gameTurn = Space.LOCAL_MAN

/** Board state */
const board = [
    [_, X, _, X, _, K, _, X],
    [X, _, X, _, X, _, _, _],
    [_, X, _, O, _, _, _, X],
    [_, _, _, _, X, _, _, _],
    [_, _, _, _, _, _, _, _],
    [O, _, X, _, O, _, O, _],
    [_, O, _, O, _, O, _, O],
    [O, _, Q, _, O, _, O, _],
]

/** Graphics context */
const _g = boardCanvas.getContext('2d')
if (!_g) throw 'Failed to load graphics 2D context for board canvas'
const g = _g

interface BoardIndex {
    row: number
    col: number
}

var moveableFreeSpaces: BoardIndex[] = []

/** Current selected space on the board */
let selectedPiece: BoardIndex | null = null

/***************
 * FUNCTIONS
 ***************/

function isLocalMan(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.LOCAL_MAN
}

function isLocalKing(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.LOCAL_KING
}

// function isRemote(space: BoardIndex) {
//     return (
//         (isSpaceInsideBoard(space) && board[space.row][space.col] === Space.REMOTE_KING) ||
//         board[space.row][space.col] === Space.REMOTE_MAN
//     )
// }

function isRemoteMan(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.REMOTE_MAN
}

function isRemoteKing(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.REMOTE_KING
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
    moveableFreeSpaces = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currentSpace = { row: i, col: j }
            g.fillStyle = (i + j) % 2 ? DARK_SPACE_COLOR : LIGHT_SPACE_COLOR
            const x = j * SIDE_LEN
            const y = i * SIDE_LEN

            g.fillRect(x, y, SIDE_LEN, SIDE_LEN)
            if (isRemoteMan(currentSpace)) {
                drawCircle(x, y, REMOTE_MAN_COLOR)
            } else if (isRemoteKing(currentSpace)) {
                drawCircle(x, y, REMOTE_KING_COLOR)
            } else if (isLocalMan(currentSpace)) {
                drawCircle(x, y, LOCAL_MAN_COLOR)
            } else if (isLocalKing(currentSpace)) {
                drawCircle(x, y, LOCAL_KING_COLOR)
            }

            if (!selectedPiece && isMovable(currentSpace)) {
                highlightSpace(currentSpace, PIECE_SELECTION_BORDER_COLOR)
            }
        }
    }

    // highlight selected piece + moveable spaces (if any)
    if (selectedPiece && isLocalMan(selectedPiece)) {
        highlightSpace(selectedPiece, PIECE_SELECTION_BORDER_COLOR)
        highlightMovesFor(selectedPiece, Direction.TOP_RIGHT, 1)
        highlightMovesFor(selectedPiece, Direction.TOP_LEFT, 1)
    }
}

//input: selected space
// TODO: highlight moves for local king
function highlightMovesFor(space: BoardIndex, direction: Direction, level: number) {
    if (isSpaceInsideBoard(space)) {
        if (isLocalMan(space) || level > 1) {
            //highlight topright
            if (direction === Direction.TOP_RIGHT) {
                var topRight = getTopRightSpace(space)
                if (isFree(topRight) && level === 1) {
                    highlightSpace(topRight, FREE_SPACE_SELECTION_BORDER_COLOR)
                    moveableFreeSpaces.push({ row: topRight.row, col: topRight.col })
                } else if (isRemoteMan(topRight)) {
                    var topRightBehind = getTopRightSpace(topRight)
                    if (isFree(topRightBehind)) {
                        highlightSpace(topRightBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        moveableFreeSpaces.push({
                            row: topRightBehind.row,
                            col: topRightBehind.col,
                        })
                    } else {
                        return
                    }
                    highlightMovesFor(topRightBehind, Direction.TOP_RIGHT, level + 1)
                }
            } else {
                //highlight topleft
                var topLeft = getTopLeftSpace(space)
                if (isFree(topLeft) && level === 1) {
                    highlightSpace(topLeft, FREE_SPACE_SELECTION_BORDER_COLOR)
                    moveableFreeSpaces.push({ row: topLeft.row, col: topLeft.col })
                } else if (isRemoteMan(topLeft)) {
                    var topLeftBehind = getTopLeftSpace(topLeft)
                    if (isFree(topLeftBehind)) {
                        highlightSpace(topLeftBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        moveableFreeSpaces.push({ row: topLeftBehind.row, col: topLeftBehind.col })
                    } else {
                        return
                    }
                    highlightMovesFor(topLeft, Direction.TOP_LEFT, level + 1)
                }
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
    var row: number = 0
    var col: number = 0
    row = Math.floor(y / SIDE_LEN)
    col = Math.floor(x / SIDE_LEN)
    console.log(`row: ${row}, col: ${col}`)

    return { row, col }
}

function areEqualSpaces(space1: BoardIndex, space2: BoardIndex) {
    return space1.row === space2.row && space1.col === space2.col
}

boardCanvas.addEventListener('click', (e) => {
    var { x, y } = getMousePosition(boardCanvas, e)
    var clickedSpace = getClickedSquare(x, y)
    if (isLocalMan(clickedSpace) && isMovable(clickedSpace)) {
        selectedPiece = clickedSpace
    }

    if (
        isFree(clickedSpace) &&
        moveableFreeSpaces.findIndex(
            (space) => space.col === clickedSpace.col && space.row === clickedSpace.row
        ) != -1
    ) {
        if (selectedPiece) {
            var bottomLeftOfClickedSpace = getBottomLeftSpce(clickedSpace)
            var topRightOfSelectedSpace = getTopRightSpace(selectedPiece)

            var bottomRightOfClickedSpace = getBottomRightSpace(clickedSpace)
            var topLeftOfSelectedSpace = getTopLeftSpace(selectedPiece)

            // move selected piece to a free space
            if (
                (isFree(topLeftOfSelectedSpace) &&
                    areEqualSpaces(topLeftOfSelectedSpace, clickedSpace)) ||
                (isFree(topRightOfSelectedSpace) &&
                    areEqualSpaces(topRightOfSelectedSpace, clickedSpace))
            ) {
                board[clickedSpace.row][clickedSpace.col] = O
                board[selectedPiece.row][selectedPiece.col] = _
                selectedPiece = clickedSpace
            }
            // capture top right piece of selected piece
            else if (areEqualSpaces(bottomLeftOfClickedSpace, topRightOfSelectedSpace)) {
                board[bottomLeftOfClickedSpace.row][bottomLeftOfClickedSpace.col] = _
                board[clickedSpace.row][clickedSpace.col] = O
                board[selectedPiece.row][selectedPiece.col] = _
                selectedPiece = clickedSpace
            }
            // capture top left piece of selected piece
            else if (areEqualSpaces(bottomRightOfClickedSpace, topLeftOfSelectedSpace)) {
                board[bottomRightOfClickedSpace.row][bottomRightOfClickedSpace.col] = _
                board[clickedSpace.row][clickedSpace.col] = O
                board[selectedPiece.row][selectedPiece.col] = _
                selectedPiece = clickedSpace
            }
        }
    }

    drawBoard()
})

function getBottomLeftSpce(space: BoardIndex) {
    if (isSpaceInsideBoard(space)) {
        return { row: space.row + 1, col: space.col - 1 }
    }
    return { row: -1, col: -1 }
}

function getBottomRightSpace(space: BoardIndex) {
    if (isSpaceInsideBoard(space)) {
        return { row: space.row + 1, col: space.col + 1 }
    }
    return { row: -1, col: -1 }
}

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
    return { row: -1, col: -1 }
}

function getTopRightSpace(space: BoardIndex) {
    if (isSpaceInsideBoard(space)) {
        return { row: space.row - 1, col: space.col + 1 }
    }
    return { row: -1, col: -1 }
}

function isFree(space: BoardIndex) {
    return isSpaceInsideBoard(space) && board[space.row][space.col] === Space.FREE
}

function isMovable(space: BoardIndex) {
    if (gameTurn === Space.LOCAL_MAN) {
        if (isLocalMan(space)) {
            // check if top right or top left are free
            var topLeft = getTopLeftSpace(space)
            var topRight = getTopRightSpace(space)
            if (isFree(topLeft) || (topRight && isFree(topRight))) {
                return true
            }
            if (!isFree(topLeft) && isRemoteMan(topLeft)) {
                var topLeftBehind = getTopLeftSpace(topLeft)
                if (topLeftBehind && isFree(topLeftBehind)) {
                    return true
                }
            }
            if (!isFree(topRight) && isRemoteMan(topRight)) {
                var topRightBehind = getTopRightSpace(topRight)
                if (topRightBehind && isFree(topRightBehind)) {
                    return true
                }
            }
        }
    }

    return false
}
