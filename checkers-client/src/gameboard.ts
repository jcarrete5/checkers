/**
 * gameboard.ts
 *
 * Module for implementing rendering and maintaining state of the gameboard.
 */

import { anyMatch } from "./util";
import { sendMove, sendEndTurn } from "./p2p";

const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement

/*************
 * CONSTANTS
 *************/

const LOCAL_MAN_COLOR = 'black'
const LOCAL_KING_COLOR = 'grey'
const REMOTE_MAN_COLOR = 'red'
const REMOTE_KING_COLOR = 'pink'
const DARK_SPACE_COLOR = '#8db596'
const LIGHT_SPACE_COLOR = '#bedbbb'
const PIECE_SELECTION_BORDER_COLOR = 'red'
const FREE_SPACE_SELECTION_BORDER_COLOR = 'blue'
const SIDE_LEN = boardCanvas.width / 8

/** Enumeration of values that can occupy a space on the board. */
export enum Space {
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

export enum Player {
    REMOTE = 1,
    LOCAL,
}

/************************
 * STATE INITIALIZATION
 ************************/

export const O = Space.LOCAL_MAN
export const X = Space.REMOTE_MAN
export const _ = Space.FREE

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
if (!_g) throw new Error('Failed to load graphics 2D context for board canvas')
const g = _g

export interface BoardIndex {
    row: number
    col: number
}

export interface Move {
    /** Source of jump */
    src: BoardIndex
    /** Destination of jump */
    dest: BoardIndex
    /** Optional index that was jumped */
    jumped?: BoardIndex
}

/** List of valid moves for currently selected piece. */
let validMoves: Set<Move> | null = null
/** Current turn player. */
let turnPlayer = Player.LOCAL
/** Current selected space on the board. */
let selectedSpace: BoardIndex | null = null
/** True if the player can make another move. Only the piece that moved can move again */
let goAgain: boolean = false
/** True if the game is started */
let gameStarted: boolean = false

/***************
 * FUNCTIONS
 ***************/

/** Set the state of a space on the board. */
function set(i: BoardIndex, v: Space) {
    board[i.row][i.col] = v
}

/** Get the stat of a space on the board */
function get(i: BoardIndex) {
    return board[i.row][i.col]
}

function isLocalPiece(space: BoardIndex) {
    return isLocalMan(space) || isLocalKing(space)
}

function isLocalMan(space: BoardIndex) {
    return isSpaceInsideBoard(space) && get(space) === Space.LOCAL_MAN
}

function isLocalKing(space: BoardIndex) {
    return isSpaceInsideBoard(space) && get(space) === Space.LOCAL_KING
}

function isRemotePiece(space: BoardIndex) {
    return isRemoteMan(space) || isRemoteKing(space)
}

function isRemoteMan(space: BoardIndex) {
    return isSpaceInsideBoard(space) && get(space) === Space.REMOTE_MAN
}

function isRemoteKing(space: BoardIndex) {
    return isSpaceInsideBoard(space) && get(space) === Space.REMOTE_KING
}

function isFree(space: BoardIndex) {
    return isSpaceInsideBoard(space) && get(space) === Space.FREE
}

function isIndexEqual(i: BoardIndex, j: BoardIndex) {
    return i.row === j.row && i.col === j.col
}

function drawPiece(i: BoardIndex) {
    if (isFree(i)) return  // Ignore free spaces
    const [x, y] = [i.col*SIDE_LEN, i.row*SIDE_LEN]
    const space = get(i)
    const r = SIDE_LEN/2 - 4
    g.beginPath()
    g.strokeStyle = 'black'
    switch (space) {
        case Space.LOCAL_MAN:
            g.fillStyle = LOCAL_MAN_COLOR
            break
        case Space.LOCAL_KING:
            g.fillStyle = LOCAL_KING_COLOR
            break
        case Space.REMOTE_MAN:
            g.fillStyle = REMOTE_MAN_COLOR
            break
        case Space.REMOTE_KING:
            g.fillStyle = REMOTE_KING_COLOR
            break
    }
    g.ellipse(x+SIDE_LEN/2, y+SIDE_LEN/2, r, r, 0, 0, 2*Math.PI)
    g.fill()
    g.stroke()
}

function highlightSpace(i: BoardIndex, color: string) {
    g.strokeStyle = color
    g.strokeRect(i.col*SIDE_LEN, i.row*SIDE_LEN, SIDE_LEN, SIDE_LEN)
}

function getClickedSpace(e: MouseEvent) {
    const rect = boardCanvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const i: BoardIndex = { row: Math.floor(y/SIDE_LEN), col: Math.floor(x/SIDE_LEN) }
    console.log('Clicked board space', i)
    return i
}

function tryPromoteToKing(i: BoardIndex) {
    if (isLocalPiece(i) && i.row === 0 && !isLocalKing(i)) {
        set(i, Space.LOCAL_KING)
        return true
    } else if (isRemotePiece(i) && i.row === 7 && !isRemoteKing(i)) {
        set(i, Space.REMOTE_KING)
        return true
    }
    return false
}

function checkGameOver() {
    let localPieceCount = 0
    let remotePieceCount = 0
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            const s = { row: i, col: j } as BoardIndex
            if (isLocalPiece(s)) {
                localPieceCount++
            } else if (isRemotePiece(s)) {
                remotePieceCount++
            }
        }
    }
    if (localPieceCount === 0 || allValidMoves(Player.LOCAL).size === 0) {
        return Player.REMOTE
    } else if (remotePieceCount === 0 || allValidMoves(Player.REMOTE).size === 0) {
        return Player.LOCAL
    }
}

function isSpaceInsideBoard(i: BoardIndex) {
    return i.row >= 0 && i.row < 8 && i.col >= 0 && i.col < 8
}

/** Precondition: i contains a local man */
function validMovesForLocalMan(i: BoardIndex) {
    if (!isLocalMan(i)) throw new Error('Illegal state: index must contain local man')
    const moves = new Set<Move>()
    const left: BoardIndex = { row: i.row-1, col: i.col-1 }
    const left2: BoardIndex = { row: i.row-2, col: i.col-2 }
    const right: BoardIndex = { row: i.row-1, col: i.col+1 }
    const right2: BoardIndex = { row: i.row-2, col: i.col+2 }
    if (isFree(left)) moves.add({src: i, dest: left})
    if (isFree(right)) moves.add({src: i, dest: right})
    if (isRemotePiece(left) && isFree(left2)) moves.add({src: i, dest: left2, jumped: left})
    if (isRemotePiece(right) && isFree(right2)) moves.add({src: i, dest: right2, jumped: right})
    return moves
}

/** Precondition: i contains a local king */
function validMovesForLocalKing(i: BoardIndex) {
    if (!isLocalKing(i)) throw new Error('Illegal state: index must contain local king')
    const moves = new Set<Move>()
    const topleft: BoardIndex = { row: i.row-1, col: i.col-1 }
    const topleft2: BoardIndex = { row: i.row-2, col: i.col-2 }
    const topright: BoardIndex = { row: i.row-1, col: i.col+1 }
    const topright2: BoardIndex = { row: i.row-2, col: i.col+2 }
    const bottomleft: BoardIndex = { row: i.row+1, col: i.col-1 }
    const bottomleft2: BoardIndex = { row: i.row+2, col: i.col-2 }
    const bottomright: BoardIndex = { row: i.row+1, col: i.col+1 }
    const bottomright2: BoardIndex = { row: i.row+2, col: i.col+2 }
    if (isFree(topleft)) moves.add({src: i, dest: topleft})
    if (isFree(topright)) moves.add({src: i, dest: topright})
    if (isFree(bottomleft)) moves.add({src: i, dest: bottomleft})
    if (isFree(bottomright)) moves.add({src: i, dest: bottomright})
    if (isRemotePiece(topleft) && isFree(topleft2)) moves.add({src: i, dest: topleft2, jumped: topleft})
    if (isRemotePiece(topright) && isFree(topright2)) moves.add({src: i, dest: topright2, jumped: topright})
    if (isRemotePiece(bottomleft) && isFree(bottomleft2)) moves.add({src: i, dest: bottomleft2, jumped: bottomleft})
    if (isRemotePiece(bottomright) && isFree(bottomright2)) moves.add({src: i, dest: bottomright2, jumped: bottomright})
    return moves
}

/** Precondition: i contains a remote man */
function validMovesForRemoteMan(i: BoardIndex) {
    if (!isRemoteMan(i)) throw new Error('Illegal state: index must contain remote man')
    const moves = new Set<Move>()
    const left: BoardIndex = { row: i.row+1, col: i.col-1 }
    const left2: BoardIndex = { row: i.row+2, col: i.col-2 }
    const right: BoardIndex = { row: i.row+1, col: i.col+1 }
    const right2: BoardIndex = { row: i.row+2, col: i.col+2 }
    if (isFree(left)) moves.add({src: i, dest: left})
    if (isFree(right)) moves.add({src: i, dest: right})
    if (isLocalPiece(left) && isFree(left2)) moves.add({src: i, dest: left2, jumped: left})
    if (isLocalPiece(right) && isFree(right2)) moves.add({src: i, dest: right2, jumped: right})
    return moves
}

/** Precondition: i contains a remote king */
function validMovesForRemoteKing(i: BoardIndex) {
    if (!isRemoteKing(i)) throw new Error('Illegal state: index must contain remote king')
    const moves = new Set<Move>()
    const topleft: BoardIndex = { row: i.row-1, col: i.col-1 }
    const topleft2: BoardIndex = { row: i.row-2, col: i.col-2 }
    const topright: BoardIndex = { row: i.row-1, col: i.col+1 }
    const topright2: BoardIndex = { row: i.row-2, col: i.col+2 }
    const bottomleft: BoardIndex = { row: i.row+1, col: i.col-1 }
    const bottomleft2: BoardIndex = { row: i.row+2, col: i.col-2 }
    const bottomright: BoardIndex = { row: i.row+1, col: i.col+1 }
    const bottomright2: BoardIndex = { row: i.row+2, col: i.col+2 }
    if (isFree(topleft)) moves.add({src: i, dest: topleft})
    if (isFree(topright)) moves.add({src: i, dest: topright})
    if (isFree(bottomleft)) moves.add({src: i, dest: bottomleft})
    if (isFree(bottomright)) moves.add({src: i, dest: bottomright})
    if (isLocalPiece(topleft) && isFree(topleft2)) moves.add({src: i, dest: topleft2, jumped: topleft})
    if (isLocalPiece(topright) && isFree(topright2)) moves.add({src: i, dest: topright2, jumped: topright})
    if (isLocalPiece(bottomleft) && isFree(bottomleft2)) moves.add({src: i, dest: bottomleft2, jumped: bottomleft})
    if (isLocalPiece(bottomright) && isFree(bottomright2)) moves.add({src: i, dest: bottomright2, jumped: bottomright})
    return moves
}

function getValidMoves(i: BoardIndex) {
    if (!isSpaceInsideBoard(i)) throw new Error('Index out of bounds')
    let moves: Set<Move>
    switch (board[i.row][i.col]) {
        case Space.LOCAL_MAN:
            moves = validMovesForLocalMan(i)
            break;
        case Space.LOCAL_KING:
            moves = validMovesForLocalKing(i)
            break;
        case Space.REMOTE_MAN:
            moves = validMovesForRemoteMan(i)
            break;
        case Space.REMOTE_KING:
            moves = validMovesForRemoteKing(i)
            break;
        default:
            return new Set<Move>()  // No valid moves for an empty space
    }
    // If a piece has jump moves, then those are the only valid moves
    const jumpMoves = new Set<Move>()
    moves.forEach(m => {
        if (m.jumped) {
            jumpMoves.add(m)
        }
    })
    return jumpMoves.size > 0 ? jumpMoves : moves
}

/** Return a Set of all valid moves for player. */
export function allValidMoves(p: Player) {
    const allValidMoveSets = new Set<Set<Move>>()
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            const s = { row: i, col: j } as BoardIndex
            if (p === Player.LOCAL && isLocalPiece(s) || p === Player.REMOTE && isRemotePiece(s)) {
                allValidMoveSets.add(getValidMoves(s))
            }
        }
    }
    const allJumpMoves = new Set<Move>()
    const allNonJumpMoves = new Set<Move>()
    allValidMoveSets.forEach(moveSet => {
        moveSet.forEach(move => {
            if (move.jumped) {
                allJumpMoves.add(move)
            } else {
                allNonJumpMoves.add(move)
            }
        })
    })
    // If there are jump moves, those are the only valid moves
    if (allJumpMoves.size > 0) {
        return allJumpMoves
    } else {
        return allNonJumpMoves
    }
}

boardCanvas.addEventListener('click', event => {
    if (!gameStarted) return
    const clickedSpace = getClickedSpace(event)
    if (goAgain) {
        if (validMoves) {
            const move = anyMatch(validMoves, e => isIndexEqual(e.dest, clickedSpace))
            if (move) {
                goAgain = !makeMove(move)
                sendMove(move)
                if (!goAgain) {
                    sendEndTurn()
                    swapTurns()
                }
            }
        }
    } else if (isFree(clickedSpace) && selectedSpace) {
        if (validMoves) {
            const move = anyMatch(validMoves, e => isIndexEqual(e.dest, clickedSpace))
            if (move) {
                goAgain = !makeMove(move)
                sendMove(move)
                if (!goAgain) {
                    sendEndTurn()
                    swapTurns()
                }
            } else {
                selectedSpace = null
                validMoves = null
            }
        } else {
            selectedSpace = null
            validMoves = null
        }
    } else {
        if (anyMatch(allValidMoves(turnPlayer), m => isIndexEqual(m.src, clickedSpace))) {
            selectedSpace = clickedSpace
            validMoves = getValidMoves(selectedSpace)
        } else {
            selectedSpace = null
            validMoves = null
        }
    }
    const winner = checkGameOver()
    drawBoard()
    if (winner) {
        const color = winner === Player.LOCAL ? LOCAL_MAN_COLOR : REMOTE_MAN_COLOR
        alert(`${color} has won!`)
    }
})

export function drawBoard() {
    // g.clearRect(0, 0, boardCanvas.width, boardCanvas.height)
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const currentSpace = { row: i, col: j }
            const x = j * SIDE_LEN
            const y = i * SIDE_LEN
            g.fillStyle = (i + j) % 2 ? DARK_SPACE_COLOR : LIGHT_SPACE_COLOR
            g.fillRect(x, y, SIDE_LEN, SIDE_LEN)
            drawPiece(currentSpace)
        }
    }

    if (turnPlayer === Player.LOCAL) {
        allValidMoves(turnPlayer).forEach(m => {
            highlightSpace(m.src, PIECE_SELECTION_BORDER_COLOR)
        })

        if (selectedSpace) {
            highlightSpace(selectedSpace, PIECE_SELECTION_BORDER_COLOR)
            validMoves?.forEach(m => {
                highlightSpace(m.dest, FREE_SPACE_SELECTION_BORDER_COLOR)
            })
        }
    }
}

export function startGame(startingPlayer: Player) {
    turnPlayer = startingPlayer
    gameStarted = true
}

/** Make a move. Return true if the turn should end. */
export function makeMove(move: Move): boolean {
    if (move.jumped) {
        set(move.jumped, Space.FREE)
        set(move.dest, get(move.src))
        set(move.src, Space.FREE)
        if (tryPromoteToKing(move.dest)) {
            return true
        }
        selectedSpace = move.dest
        validMoves = getValidMoves(selectedSpace)
        return !anyMatch(validMoves, m => !!m.jumped)
    } else {
        set(move.dest, get(move.src))
        set(move.src, Space.FREE)
        tryPromoteToKing(move.dest)
        return true
    }
}

export function swapTurns() {
    turnPlayer = (turnPlayer === Player.LOCAL ? Player.REMOTE : Player.LOCAL)
    selectedSpace = null
    validMoves = null
    goAgain = false
}
