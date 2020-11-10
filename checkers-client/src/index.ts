import { CognitoIdentityCredentials } from 'aws-sdk'
import DynamoDB from 'aws-sdk/clients/dynamodb'
import { drawBoard } from "./gameboard.ts";

// Initialize AWS credentials for DynamoDB access
const creds = new CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:97004a17-da11-4d97-971b-2697eda9a3bb'
}, {
    region: 'us-east-1'
})
const db = new DynamoDB({
    apiVersion: '2012-08-10',
    region: 'us-east-1',
    credentials: creds
})

// Create RTCPeerConnection with config
const config = {
    'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
} as RTCConfiguration
const peerConn = new RTCPeerConnection(config)

// btn-create-game click event listener
const createGame = document.getElementById('btn-create-game') as HTMLButtonElement
createGame.addEventListener('click', async ev => {
    const offer = await peerConn.createOffer()
    await peerConn.setLocalDescription(offer)
    const params = {
        Item: {
            'RoomCode': { N: '1' },
            'Offer': { S: JSON.stringify(offer) }
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: "CheckersGame"
    } as DynamoDB.PutItemInput
    db.putItem(params).send()
    // const remoteDesc = new RTCSessionDescription(message.answer);
    // await peerConn.setRemoteDescription(remoteDesc);
})

// btn-join-game click event listener
const joinGame = document.getElementById('btn-join-game') as HTMLButtonElement
joinGame.addEventListener('click', async ev => {
    const gameCode = prompt('Enter a game code')
    let params = {
        Key: {
            'RoomCode': { N: gameCode }
        },
        AttributesToGet: ['Offer'],
        TableName: 'CheckersGame'
    } as DynamoDB.GetItemInput
    let res = await db.getItem(params).promise()
    if (res.Item) {
        const offer = JSON.parse(res.Item.Offer as string) as RTCSessionDescriptionInit
        peerConn.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConn.createAnswer()
        await peerConn.setLocalDescription(answer)
        const values = {
            ':a': { S: JSON.stringify(answer) }
        }
        params = {
            Key: {
                'RoomCode': { N: gameCode }
            },
            UpdateExpression: 'SET Answer = :a',
            ExpressionAttributeValues: values,
            TableName: 'CheckersGame'
        } as DynamoDB.UpdateItemInput
        db.updateItem(params, (err, _data) => {
            if (err) {
                console.error(err)
            }
        })
    }
})

drawBoard()
