/*
 * p2p.ts
 *
 * Module for managing P2P communication.
 */

/* P2P channel used to communicate with other player. */
export const peerConn = new RTCPeerConnection({
    'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
})


// export async function acceptSDPOffer(offer: RTCSessionDescriptionInit) {
//     if (state != State.DISCONNECTED) {
//         throw 'Invalid state: must be DISCONNECTED'
//     }
//     await peerConn.setRemoteDescription(offer)
//     const answer = await peerConn.createAnswer()
//     await peerConn.setLocalDescription(answer)
//     state = State.AWAIT_HOST_ICE_CANDIDATES
//     listenForICECandidates()
//     return answer
// }

export async function addRemoteICECandidate() {

}
