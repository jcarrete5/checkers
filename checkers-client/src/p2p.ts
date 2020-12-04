/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

import Peer from 'peerjs'
import { Player, Move, startGame, makeMove, drawBoard, swapTurns } from './gameboard'

enum MessageType {
    START_GAME,
    MOVE,
    END_TURN
}

interface StartGamePayload {
    type: MessageType.START_GAME
    turnPlayer: Player
}

interface MovePayload {
    type: MessageType.MOVE
    move: Move
}

interface EndTurnPayload {
    type: MessageType.END_TURN
}

type PDU = MovePayload | EndTurnPayload | StartGamePayload

const localPeer = new Peer({debug: 1})
let conn: Peer.DataConnection

/** Get the broker ID for a Peer connection. */
async function getBrokerId(peer: Peer) {
    const id = new Promise<string>((resolve, reject) => {
        if (peer.id) {
            resolve(peer.id)
        } else {
            peer.on('open', id => {
                resolve(id)
            })
            peer.on('error', err => {
                reject(err)
            })
        }
    })
    return await id
}

function addDataConnectionHandlers() {
    conn.on('error', err => {
        console.error(err)
        conn.close()
    })
    conn.on('data', (data: PDU) => {
        console.log('rx', data)
        switch (data.type) {
            case MessageType.START_GAME:
                startGame(data.turnPlayer)
                drawBoard()
                break
            case MessageType.MOVE:
                makeMove(data.move)
                drawBoard()
                break
            case MessageType.END_TURN:
                swapTurns()
                drawBoard()
                break
        }
    })
}

export async function hostGame() {
    const id = await getBrokerId(localPeer)
    localPeer.on('connection', c => {
        conn = c
        addDataConnectionHandlers()
        conn.on('open', () => {
            const msg = {type: MessageType.START_GAME, turnPlayer: Player.REMOTE}
            console.log('tx', msg)
            conn.send(msg)
            startGame(Player.LOCAL)
            localPeer.disconnect()
        })
    })
    alert(`Game code: ${id}`)
}

export function joinGame(gameCode: string | null) {
    if (!gameCode) throw new Error('Game code is null')
    conn = localPeer.connect(gameCode)
    conn.on('open', () => {
        localPeer.disconnect()
    })
    addDataConnectionHandlers()
}

export function sendEndTurn() {
    const msg = { type: MessageType.END_TURN }
    console.log('tx', msg)
    conn.send(msg)
}

export function sendMove(move: Move) {
    // Transform move before sending
    if (move.jumped) {
        move = {
            src: { row: 7-move.src.row, col: 7-move.src.col },
            dest: { row: 7-move.dest.row, col: 7-move.dest.col },
            jumped: { row: 7-move.jumped.row, col: 7-move.jumped.col }
        }
    } else {
        move = {
            src: { row: 7-move.src.row, col: 7-move.src.col },
            dest: { row: 7-move.dest.row, col: 7-move.dest.col },
        }
    }
    const msg = { type: MessageType.MOVE, move }
    console.log('tx', msg)
    conn.send(msg)
}
