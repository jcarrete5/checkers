/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

import Peer from 'peerjs'

const idPrefix = 'se181-checkers'

let localPeer: Peer

function generateGameCode() {
    // TODO Generate sufficiently random room code
    return '0001'
}

function setupEventHandlers() {
    localPeer.on('error', err => {
        console.error(err)
    })
}

export function hostGame() {
    const gameCode = generateGameCode()
    const brokerId = `${idPrefix}_${gameCode}`
    localPeer = new Peer(brokerId)
    setupEventHandlers()
    localPeer.on('connection', conn => {
        console.log('Got a connection')
        conn.on('data', data => {
            console.log(data)
        })
        conn.on('error', err => {
            console.error(err)
        })
    })
}

export function joinGame(gameCode: string | null) {
    if (!gameCode) throw new Error('Game code is null')
    localPeer = new Peer()
    setupEventHandlers()
    const brokerId = `${idPrefix}_${gameCode}`
    const dataConn = localPeer.connect(brokerId)
    dataConn.on('error', err => {
        console.error(err)
    })
    dataConn.on('open', () => {
        dataConn.send('Hello')
    })
}
