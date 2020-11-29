/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

import iceServers from "./stun";
import { postICECandidate, Side } from "./aws";

/* P2P channel used to communicate with other player. */
export const peerConn = new RTCPeerConnection({ iceServers })
let datachannel: RTCDataChannel

peerConn.addEventListener('icegatheringstatechange', _ => {
    console.log('Gathering state change:', peerConn.iceGatheringState)
})

// Push ICE candidates to AWS when they are discovered
peerConn.addEventListener('icecandidate', async event => {
    console.log('icecandidate:', event)
    if (event.candidate) {
        // await postICECandidate(gameCode, side, event.candidate)
        console.log('Posted an ICE candidate:', event.candidate)
    }
})

peerConn.addEventListener('iceconnectionstatechange', async event => {
    console.log('iceconnectionstatechange:', peerConn.iceConnectionState)
})

export function setupDataChannels(side: Side) {
    if (side === Side.HOST) {
        console.log('I\'m host')
        datachannel = peerConn.createDataChannel('data')
        datachannel.addEventListener('open', event => {
            datachannel.send('Hello')
            console.log('Sent data')
        })
    } else {
        console.log('I\'m peer')
        peerConn.addEventListener('datachannel', event => {
            console.log('Got a data channel')
            datachannel = event.channel
            datachannel.addEventListener('message', event => {
                console.log(event.data)
            })
        })
    }
}
