/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

/* Enumeration of the states of the P2P connection */
enum State {
    DISCONNECTED,
    AWAIT_ANSWER,
    AWAIT_ICE_CANDIDATES,
}

/* P2P channel used to communicate with other player. */
const peerConn = new RTCPeerConnection({
    'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
})

/* State of the P2P connection. */
let state = State.DISCONNECTED

export async function getSDPOffer() {
    if (state != State.DISCONNECTED)
        throw 'Invalid state: must be DISCONNECTED'
    const offer = await peerConn.createOffer()
    await peerConn.setLocalDescription(offer)
    state = State.AWAIT_ANSWER
    return offer
}

export async function acceptSDPOffer(offer: RTCSessionDescriptionInit) {
    if (state != State.DISCONNECTED)
        throw 'Invalid state: must be DISCONNECTED'
    peerConn.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConn.createAnswer()
    await peerConn.setLocalDescription(answer)
    state = State.AWAIT_ICE_CANDIDATES
    return answer
}
