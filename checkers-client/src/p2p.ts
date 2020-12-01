/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

import Peer from 'peerjs'

enum MessageType {
    MOVE,
    END_TURN
}

interface PDU {
    type: MessageType
    payload: any
}

const localPeer = new Peer()

/** Get the broker ID for the local Peer connection. */
async function getBrokerId() {
    const id = new Promise<string>((resolve, reject) => {
        if (localPeer.id) {
            resolve(localPeer.id)
        } else {
            localPeer.on('open', id => {
                resolve(id)
            })
            localPeer.on('error', err => {
                reject(err)
            })
        }
    })
    return await id
}

function addDataConnectionHandlers(conn: Peer.DataConnection) {
    conn.on('error', err => {
        console.error(err)
        conn.close()
    })
    conn.on('data', (data: PDU) => {
        // TODO process PDU i.e. update game state
    })
}

export async function hostGame() {
    const id = await getBrokerId()
    alert(`Game code: ${id}`)
    localPeer.on('connection', conn => {
        addDataConnectionHandlers(conn)
    })
}

export function joinGame(gameCode: string | null) {
    if (!gameCode) throw new Error('Game code is null')
    const conn = localPeer.connect(gameCode)
    addDataConnectionHandlers(conn)
}
