import DynamoDB from 'aws-sdk/clients/dynamodb'
import { CognitoIdentityCredentials } from 'aws-sdk/lib/credentials/cognito_identity_credentials';

const creds = new CognitoIdentityCredentials({IdentityPoolId: 'us-east-1:97004a17-da11-4d97-971b-2697eda9a3bb'})
const db = new DynamoDB({
    apiVersion: '2012-08-10',
    region: 'us-east-1',
    credentials: creds
})


const createGame = document.getElementById('btn-create-game') as HTMLButtonElement
createGame.addEventListener('click', async ev => {
    const config = {
        'iceServers': [
            {'urls': 'stun:stun.l.google.com:19302'}
        ]
    } as RTCConfiguration
    const peerConn = new RTCPeerConnection(config);
    const offer = await peerConn.createOffer();
    await peerConn.setLocalDescription(offer);
    // send SDP offer
    // const remoteDesc = new RTCSessionDescription(message.answer);
    // await peerConn.setRemoteDescription(remoteDesc);
    // comment
})

const joinGame = document.getElementById('btn-join-game') as HTMLButtonElement
joinGame.addEventListener('click', ev => {
    const gameCode = prompt("Enter a game code")
})
