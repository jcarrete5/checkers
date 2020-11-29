/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

import Peer from 'peerjs'

const idPrefix = 'se181-checkers'

let localPeer: Peer
const peerParams = {
    host: 'servo.myfiosgateway.com',
    port: 9000,
    path: '/myapp',
    debug: 3
} as Peer.PeerJSOption

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
    console.log('brokerId', brokerId)
    localPeer = new Peer(brokerId, peerParams)
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
    if (!gameCode) throw 'Game code is null'
    localPeer = new Peer(peerParams)
    setupEventHandlers()
    console.log('Getting data connection')
    const brokerId = `${idPrefix}_${gameCode}`
    console.log('brokerId', brokerId)
    const dataConn = localPeer.connect(brokerId)
    console.log('Data connection complete')
    dataConn.on('error', err => {
        console.error(err)
    })
    dataConn.on('open', () => {
        console.log('Sending hello')
        dataConn.send('Hello')
        console.log('Hello sent')
    })
}
