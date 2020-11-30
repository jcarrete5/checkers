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

enum GameTurn {
    REMOTE,
    LOCAL,
}

/** Enumberation of values that indicate the direction to check movable spaces. */
enum Direction {
    TOP_LEFT,
    TOP_RIGHT,
    BOT_LEFT,
    BOT_RIGHT,
}
/************************
 * STATE INITIALIZATION
 ************************/

const O = Space.LOCAL_MAN
const X = Space.REMOTE_MAN
const K = Space.LOCAL_KING
const Q = Space.REMOTE_KING
const _ = Space.FREE

let gameTurn = GameTurn.LOCAL

/** Board state */
const board = [
    [_, X, _, X, _, X, _, X],
    [X, _, X, _, X, _, X, _],
    [_, X, _, X, _, _, _, X],
    [_, _, _, _, X, _, _, _],
    [_, _, _, _, _, _, _, _],
    [_, _, X, _, O, _, O, _],
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

let validMoves: BoardIndex[] = []

/** Current selected space on the board */
let selectedPiece: BoardIndex | null = null

/***************
 * FUNCTIONS
 ***************/

function isLocalPiece(space: BoardIndex) {
    return (
        board[space.row][space.col] === Space.LOCAL_MAN ||
        board[space.row][space.col] === Space.LOCAL_KING
    )
}
function isLocalMan(space: BoardIndex) {
    return board[space.row][space.col] === Space.LOCAL_MAN
}

function isLocalKing(space: BoardIndex) {
    return board[space.row][space.col] === Space.LOCAL_KING
}

function isRemotePiece(space: BoardIndex) {
    return (
        board[space.row][space.col] === Space.REMOTE_KING ||
        board[space.row][space.col] === Space.REMOTE_MAN
    )
}

function isRemoteMan(space: BoardIndex) {
    return board[space.row][space.col] === Space.REMOTE_MAN
}

function isRemoteKing(space: BoardIndex) {
    return board[space.row][space.col] === Space.REMOTE_KING
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
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            let currentSpace = { row: i, col: j }
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

            if (!selectedPiece && isPieceMovable(currentSpace)) {
                highlightSpace(currentSpace, PIECE_SELECTION_BORDER_COLOR)
            }
        }
    }

    if (selectedPiece) {
        // highlight selected piece
        highlightSpace(selectedPiece, PIECE_SELECTION_BORDER_COLOR)

        // highlight valid moves
        if (isLocalMan(selectedPiece)) {
            highlightMovesForLocalMan(selectedPiece, Direction.TOP_RIGHT, 1)
            highlightMovesForLocalMan(selectedPiece, Direction.TOP_LEFT, 1)
        } else if (isLocalKing(selectedPiece)) {
            // highlight valid moves
            highlightMovesForLocalKing(selectedPiece, Direction.TOP_RIGHT, 1)
            highlightMovesForLocalKing(selectedPiece, Direction.TOP_LEFT, 1)
            highlightMovesForLocalKing(selectedPiece, Direction.BOT_LEFT, 1)
            highlightMovesForLocalKing(selectedPiece, Direction.BOT_RIGHT, 1)
        }
    }
}

function highlightMovesForLocalKing(space: BoardIndex, direction: Direction, depthLevel: number) {
    if (isSpaceInsideBoard(space)) {
        if (isLocalKing(space) || depthLevel > 1) {
            //highlight top right
            if (direction === Direction.TOP_RIGHT) {
                let topRight = getTopRightSpace(space)
                if (
                    isFree(topRight) &&
                    depthLevel === 1 &&
                    !canCaptureBotLeftRemotePiece(space) &&
                    !canCaptureBotRightRemotePiece(space) &&
                    !canCaptureTopLeftRemotePiece(space)
                ) {
                    highlightSpace(topRight, FREE_SPACE_SELECTION_BORDER_COLOR)
                    validMoves.push({ row: topRight.row, col: topRight.col })
                } else if (isSpaceInsideBoard(topRight) && isRemotePiece(topRight)) {
                    let topRightBehind = getTopRightSpace(topRight)
                    if (isFree(topRightBehind)) {
                        highlightSpace(topRightBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        validMoves.push({
                            row: topRightBehind.row,
                            col: topRightBehind.col,
                        })
                    } else {
                        return
                    }
                    highlightMovesForLocalKing(topRightBehind, Direction.TOP_LEFT, depthLevel + 1)
                    highlightMovesForLocalKing(topRightBehind, Direction.TOP_RIGHT, depthLevel + 1)
                    highlightMovesForLocalKing(topRightBehind, Direction.BOT_RIGHT, depthLevel + 1)
                }
            } else if (direction === Direction.TOP_LEFT) {
                //highlight top left
                let topLeft = getTopLeftSpace(space)
                if (
                    isFree(topLeft) &&
                    depthLevel === 1 &&
                    !canCaptureBotLeftRemotePiece(space) &&
                    !canCaptureBotRightRemotePiece(space) &&
                    !canCaptureTopRightRemotePiece(space)
                ) {
                    highlightSpace(topLeft, FREE_SPACE_SELECTION_BORDER_COLOR)
                    validMoves.push({ row: topLeft.row, col: topLeft.col })
                } else if (isSpaceInsideBoard(topLeft) && isRemotePiece(topLeft)) {
                    let topLeftBehind = getTopLeftSpace(topLeft)
                    if (isFree(topLeftBehind)) {
                        highlightSpace(topLeftBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        validMoves.push({ row: topLeftBehind.row, col: topLeftBehind.col })
                    } else {
                        return
                    }
                    highlightMovesForLocalKing(topLeftBehind, Direction.TOP_LEFT, depthLevel + 1)
                    highlightMovesForLocalKing(topLeftBehind, Direction.TOP_RIGHT, depthLevel + 1)
                    highlightMovesForLocalKing(topLeftBehind, Direction.BOT_LEFT, depthLevel + 1)
                }
            } else if (direction === Direction.BOT_LEFT) {
                //highlight bot left
                let botLeft = getBottomLeftSpace(space)
                if (
                    isFree(botLeft) &&
                    depthLevel === 1 &&
                    !canCaptureTopRightRemotePiece(space) &&
                    !canCaptureBotRightRemotePiece(space) &&
                    !canCaptureTopLeftRemotePiece(space)
                ) {
                    highlightSpace(botLeft, FREE_SPACE_SELECTION_BORDER_COLOR)
                    validMoves.push({ row: botLeft.row, col: botLeft.col })
                } else if (isSpaceInsideBoard(botLeft) && isRemotePiece(botLeft)) {
                    let botLeftBehind = getBottomLeftSpace(botLeft)
                    if (isFree(botLeftBehind)) {
                        highlightSpace(botLeftBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        validMoves.push({ row: botLeftBehind.row, col: botLeftBehind.col })
                    } else {
                        return
                    }
                    highlightMovesForLocalKing(botLeftBehind, Direction.TOP_LEFT, depthLevel + 1)
                    highlightMovesForLocalKing(botLeftBehind, Direction.BOT_LEFT, depthLevel + 1)
                    highlightMovesForLocalKing(botLeftBehind, Direction.BOT_RIGHT, depthLevel + 1)
                }
            } else if (direction === Direction.BOT_RIGHT) {
                //highlight bot right
                let botRight = getBottomRightSpace(space)
                if (
                    isFree(botRight) &&
                    depthLevel === 1 &&
                    !canCaptureBotLeftRemotePiece(space) &&
                    !canCaptureTopRightRemotePiece(space) &&
                    !canCaptureTopLeftRemotePiece(space)
                ) {
                    highlightSpace(botRight, FREE_SPACE_SELECTION_BORDER_COLOR)
                    validMoves.push({ row: botRight.row, col: botRight.col })
                } else if (isSpaceInsideBoard(botRight) && isRemotePiece(botRight)) {
                    let botRightBehind = getBottomRightSpace(botRight)
                    if (isFree(botRightBehind)) {
                        highlightSpace(botRightBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        validMoves.push({ row: botRightBehind.row, col: botRightBehind.col })
                    } else {
                        return
                    }
                    highlightMovesForLocalKing(botRightBehind, Direction.TOP_RIGHT, depthLevel + 1)
                    highlightMovesForLocalKing(botRightBehind, Direction.BOT_LEFT, depthLevel + 1)
                    highlightMovesForLocalKing(botRightBehind, Direction.BOT_RIGHT, depthLevel + 1)
                }
            }
        }
    }
}
//input: selected space
function highlightMovesForLocalMan(space: BoardIndex, direction: Direction, depthLevel: number) {
    if (isSpaceInsideBoard(space)) {
        if (isLocalMan(space) || depthLevel > 1) {
            //highlight topright
            if (direction === Direction.TOP_RIGHT) {
                let topRight = getTopRightSpace(space)
                if (isFree(topRight) && depthLevel === 1 && !canCaptureTopLeftRemotePiece(space)) {
                    highlightSpace(topRight, FREE_SPACE_SELECTION_BORDER_COLOR)
                    validMoves.push({ row: topRight.row, col: topRight.col })
                } else if (isSpaceInsideBoard(topRight) && isRemotePiece(topRight)) {
                    let topRightBehind = getTopRightSpace(topRight)

                    if (isFree(topRightBehind)) {
                        highlightSpace(topRightBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        validMoves.push({
                            row: topRightBehind.row,
                            col: topRightBehind.col,
                        })
                    } else {
                        return
                    }
                    highlightMovesForLocalMan(topRightBehind, Direction.TOP_RIGHT, depthLevel + 1)
                    highlightMovesForLocalMan(topRightBehind, Direction.TOP_LEFT, depthLevel + 1)
                }
            } else {
                //highlight topleft
                let topLeft = getTopLeftSpace(space)
                if (isFree(topLeft) && depthLevel === 1 && !canCaptureTopRightRemotePiece(space)) {
                    highlightSpace(topLeft, FREE_SPACE_SELECTION_BORDER_COLOR)
                    validMoves.push({ row: topLeft.row, col: topLeft.col })
                } else if (isSpaceInsideBoard(topLeft) && isRemotePiece(topLeft)) {
                    let topLeftBehind = getTopLeftSpace(topLeft)
                    if (isFree(topLeftBehind)) {
                        highlightSpace(topLeftBehind, FREE_SPACE_SELECTION_BORDER_COLOR)
                        validMoves.push({ row: topLeftBehind.row, col: topLeftBehind.col })
                    } else {
                        return
                    }
                    highlightMovesForLocalMan(topLeftBehind, Direction.TOP_LEFT, depthLevel + 1)
                    highlightMovesForLocalMan(topLeftBehind, Direction.TOP_RIGHT, depthLevel + 1)
                }
            }
        }
    }
}

function canCaptureTopLeftRemotePiece(space: BoardIndex) {
    if (isLocalPiece(space)) {
        let topLeft = getTopLeftSpace(space)
        if (isSpaceInsideBoard(topLeft) && isRemotePiece(topLeft)) {
            let topLeftBehind = getTopLeftSpace(topLeft)
            if (isFree(topLeftBehind)) {
                return true
            }
        }
    }
    return false
}

function canCaptureTopRightRemotePiece(space: BoardIndex) {
    if (isLocalPiece(space)) {
        let topRight = getTopRightSpace(space)
        if (isSpaceInsideBoard(topRight) && isRemotePiece(topRight)) {
            let topRightBehind = getTopRightSpace(topRight)
            if (isFree(topRightBehind)) {
                return true
            }
        }
    }

    return false
}

function canCaptureBotRightRemotePiece(space: BoardIndex) {
    if (isLocalPiece(space)) {
        if (isLocalMan(space)) {
            return false
        }
        let botRight = getBottomRightSpace(space)
        if (isSpaceInsideBoard(botRight) && isRemotePiece(botRight)) {
            let botRightBehind = getBottomRightSpace(botRight)
            if (isFree(botRightBehind)) {
                return true
            }
        }
    }

    return false
}

function canCaptureBotLeftRemotePiece(space: BoardIndex) {
    if (isLocalPiece(space)) {
        if (isLocalMan(space)) {
            return false
        }
        let botLeft = getBottomLeftSpace(space)
        if (isSpaceInsideBoard(botLeft) && isRemotePiece(botLeft)) {
            let botLeftBehind = getBottomLeftSpace(botLeft)
            if (isFree(botLeftBehind)) {
                return true
            }
        }
    }

    return false
}

function canCaptureRemotePiece(space: BoardIndex) {
    return (
        canCaptureBotLeftRemotePiece(space) ||
        canCaptureBotRightRemotePiece(space) ||
        canCaptureTopLeftRemotePiece(space) ||
        canCaptureTopRightRemotePiece(space)
    )
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

function isTopLeftFree(space: BoardIndex) {
    var topLeft = getTopLeftSpace(space)
    return isFree(topLeft)
}

function isTopRightFree(space: BoardIndex) {
    var topRight = getTopRightSpace(space)
    return isFree(topRight)
}

function isBotLeftFree(space: BoardIndex) {
    var botLeft = getBottomLeftSpace(space)
    return isFree(botLeft)
}

function isBotRightFree(space: BoardIndex) {
    var botLeft = getBottomRightSpace(space)
    return isFree(botLeft)
}

function movePiece(from: BoardIndex, to: BoardIndex, middle: BoardIndex | null) {
    board[to.row][to.col] = isLocalMan(from) ? Space.LOCAL_MAN : Space.LOCAL_KING
    board[from.row][from.col] = Space.FREE
    if (middle) {
        board[middle.row][middle.col] = Space.FREE
    }

    selectedPiece = to
    // transform to king
    if (to.row === 0 && isLocalMan(selectedPiece)) {
        board[to.row][to.col] = Space.LOCAL_KING
    }
}

function changeGameTurnToRemote() {
    // unselect the piece
    selectedPiece = null
    // change game turn to remote
    gameTurn = GameTurn.REMOTE
}

boardCanvas.addEventListener('click', (e) => {
    var { x, y } = getMousePosition(boardCanvas, e)
    var clickedSpace = getClickedSquare(x, y)
    if (isLocalPiece(clickedSpace) && isPieceMovable(clickedSpace)) {
        selectedPiece = clickedSpace
        validMoves = []
    }

    if (
        isFree(clickedSpace) &&
        validMoves.findIndex(
            (space) => space.col === clickedSpace.col && space.row === clickedSpace.row
        ) != -1
    ) {
        if (selectedPiece) {
            let bottomLeftOfClickedSpace = getBottomLeftSpace(clickedSpace)
            let topRightOfSelectedSpace = getTopRightSpace(selectedPiece)

            let bottomRightOfClickedSpace = getBottomRightSpace(clickedSpace)
            let topLeftOfSelectedSpace = getTopLeftSpace(selectedPiece)

            if (
                (isTopLeftFree(selectedPiece) || isTopRightFree(selectedPiece)) &&
                (areEqualSpaces(clickedSpace, topRightOfSelectedSpace) ||
                    areEqualSpaces(clickedSpace, topLeftOfSelectedSpace))
            ) {
                // move selected piece to a free space
                movePiece(selectedPiece, clickedSpace, null)
                // change game turn to remote
                changeGameTurnToRemote()
            } else if (areEqualSpaces(bottomLeftOfClickedSpace, topRightOfSelectedSpace)) {
                // capture top right piece of selected piece
                movePiece(selectedPiece, clickedSpace, bottomLeftOfClickedSpace)
            } else if (areEqualSpaces(bottomRightOfClickedSpace, topLeftOfSelectedSpace)) {
                // capture top left piece of selected piece
                movePiece(selectedPiece, clickedSpace, bottomRightOfClickedSpace)
            } else {
                if (isLocalKing(selectedPiece)) {
                    let botLeftOfSelectedSpace = getBottomLeftSpace(selectedPiece)
                    let botRightOfSelectedSpace = getBottomRightSpace(selectedPiece)

                    let topLeftOfClickedSpace = getTopLeftSpace(clickedSpace)
                    let topRightOfClickedSpace = getTopRightSpace(clickedSpace)

                    if (
                        (isBotLeftFree(selectedPiece) || isBotRightFree(selectedPiece)) &&
                        (areEqualSpaces(clickedSpace, botLeftOfSelectedSpace) ||
                            areEqualSpaces(clickedSpace, botRightOfSelectedSpace))
                    ) {
                        // move selected piece to a free space
                        movePiece(selectedPiece, clickedSpace, null)
                        // change game turn to remote
                        changeGameTurnToRemote()
                    } else if (areEqualSpaces(botLeftOfSelectedSpace, topRightOfClickedSpace)) {
                        // capture top right piece of selected piece
                        movePiece(selectedPiece, clickedSpace, topRightOfClickedSpace)
                    } else if (areEqualSpaces(botRightOfSelectedSpace, topLeftOfClickedSpace)) {
                        // capture top left piece of selected piece
                        movePiece(selectedPiece, clickedSpace, topLeftOfClickedSpace)
                    }
                }
            }

            if (selectedPiece && !canCaptureRemotePiece(selectedPiece)) {
                changeGameTurnToRemote()
            }
        }
    }

    drawBoard()
})

function getBottomLeftSpace(space: BoardIndex) {
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

function isPieceMovable(space: BoardIndex) {
    if (gameTurn === GameTurn.LOCAL) {
        let topLeft = getTopLeftSpace(space)
        let topRight = getTopRightSpace(space)
        if (isLocalMan(space) || isLocalKing(space)) {
            // check if top right or top left are free
            if (isFree(topLeft) || isFree(topRight)) {
                return true
            }
            if (canCaptureTopLeftRemotePiece(space) || canCaptureTopRightRemotePiece(space)) {
                return true
            }

            if (isLocalKing(space)) {
                let botLeft = getBottomLeftSpace(space)
                let botRight = getBottomRightSpace(space)

                // check if bot right or bot left are free
                if (isFree(botLeft) || isFree(botRight)) {
                    return true
                }
                if (canCaptureBotLeftRemotePiece(space) || canCaptureBotRightRemotePiece(space)) {
                    return true
                }
            }
        }
    }

    return false
}
