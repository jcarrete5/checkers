/*
 * aws.ts
 *
 * Module for interacting with AWS services to start/join a game.
 */

import { CognitoIdentityCredentials } from 'aws-sdk/global'
import DynamoDB from 'aws-sdk/clients/dynamodb'
import { peerConn } from "./p2p";
import { sleep } from "./util";

enum Side {
    HOST = "HostICECandidates",
    PEER = "PeerICECandidates"
}

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
const TABLE_NAME = 'CheckersGame'

/** Generates a unique game code for the game. */
function generateGameCode(): string {
    // TODO Generate valid random game code
    return '0001'
}

/** Validate the room code and return, otherwise throw an error */
function validateGameCode(code: string | null) {
    if (!code) throw 'Room code is null'
    if (/^\d{4}$/.test(code)) {
        return code
    } else {
        throw 'Invalid room code'
    }
}

async function publishSDPOffer(gameCode: string, offer: RTCSessionDescriptionInit) {
    const params = {
        Item: {
            'GameCode': { S: gameCode },
            'Offer': { S: JSON.stringify(offer) }
        },
        TableName: TABLE_NAME
    } as DynamoDB.PutItemInput
    try {
        await db.putItem(params).promise()
    } catch (err) {
        throw err
    }
}

async function waitForSDPAnswer(gameCode: string) {
    while (true) {
        const params = {
            Key: { 'GameCode': { S: gameCode } },
            ProjectionExpression: 'Answer',
            TableName: TABLE_NAME
        } as DynamoDB.GetItemInput
        try {
            const res = await db.getItem(params).promise()
            if (!res.Item) {
                // Sleep and try again
                await sleep(1000)
                continue
            } else {
                const answer = res.Item.Answer as string
                return JSON.parse(answer) as RTCSessionDescriptionInit
            }
        } catch (err) {
            throw err
        }
    }
}

async function postICECandidate(gameCode: string, side: Side, candidate: RTCIceCandidate) {
    const params = {
        Key: { 'GameCode': { S: gameCode } },
        UpdateExpression: 'ADD #C :c',
        ExpressionAttributeNames: { '#C': side },
        ExpressionAttributeValues: { ':c': { SS: [JSON.stringify(candidate.toJSON())] } },
        TableName: TABLE_NAME
    } as DynamoDB.UpdateItemInput
    try {
        await db.updateItem(params).promise()
    } catch (err) {
        throw err
    }
}

/** Yield ICE candidates from DynamoDB as they are discovered. */
async function* collectPeerICECandidates(gameCode: string, side: Side) {
    const yieldedCandidates = new Set<string>()
    while (true) {
        const params = {
            Key: { 'GameCode': { S: gameCode } },
            ProjectionExpression: side,
            TableName: TABLE_NAME
        } as DynamoDB.GetItemInput
        try {
            const res = await db.getItem(params).promise()
            if (res.Item && res.Item[side].SS) {
                for (const c of res.Item[side].SS ?? []) {
                    if (!yieldedCandidates.has(c)) {
                        yield JSON.parse(c) as RTCIceCandidateInit
                        yieldedCandidates.add(c)
                    }
                }
            }
            // Limiting request rate
            await sleep(1000)
        } catch (err) {
            throw err
        }
    }
}

/**
 * Setup event listener for ICE candidates from an ICE server and send them
 * to the other peer. Try ICE candidates from peer and return once the P2P
 * connection is established.
 */
async function establishConnection(gameCode: string, side: Side) {
    // Push ICE candidates to AWS when they are discovered
    peerConn.addEventListener('icecandidate', async event => {
        if (event.candidate) {
            await postICECandidate(gameCode, side, event.candidate)
            console.log('Posted an ICE candidate', event.candidate)
        }
    })

    // Add remote ICE candidates from AWS
    const iceCandidateSeq = collectPeerICECandidates(gameCode, side)
    async function updateICE() {
        for await (const candidate of iceCandidateSeq) {
            await peerConn.addIceCandidate(candidate)
            console.log('Added ICE candidate for peer', candidate)
        }
    }
    // Don't await this; We don't want to wait for completion.
    // This gets cancelled implicitly by calling iceCandidateSeq.return()
    // when the P2P connection is established.
    updateICE()

    // Wait for connection establishment
    const connectionEstablished = new Promise<void>((resolve, reject) => {
        peerConn.addEventListener('connectionstatechange', ev => {
            switch (peerConn.connectionState) {
                case 'connected':
                    iceCandidateSeq.return()
                    resolve()
                    break
                case 'failed':
                    iceCandidateSeq.return()
                    reject()
                    break
            }
            console.log('P2P connection state', peerConn.connectionState)
        })
    })
    await connectionEstablished
}

export async function* createGame() {
    const gameCode = generateGameCode();
    yield gameCode
    const offer = await peerConn.createOffer()
    await peerConn.setLocalDescription(offer)
    await publishSDPOffer(gameCode, offer)
    const answer = await waitForSDPAnswer(gameCode)
    await peerConn.setRemoteDescription(answer)
    await establishConnection(gameCode, Side.HOST)
}

export async function joinGame(remoteGameCode: string | null) {
    // gameCode = validateGameCode(remoteGameCode)
    // if (state != State.DISCONNECTED) throw 'Invalid state: must be disconnected'

    // // Find the room SDP offer
    // let params = {
    //     Key: {
    //         'GameCode': { N: gameCode.toString() }
    //     },
    //     ProjectionExpression: 'Offer',
    //     TableName: TABLE_NAME
    // } as DynamoDB.GetItemInput
    // let res
    // try {
    //     res = await db.getItem(params).promise()
    //     if (!res.Item) {
    //         throw `Failed to find room '${gameCode}'`
    //     }
    // } catch (err) {
    //     throw err
    // }

    // // Accept the SDP offer and reply
    // const offer = JSON.parse(res.Item.Offer as string) as RTCSessionDescriptionInit
    // const answer = await acceptSDPOffer(offer)
    // params = {
    //     Key: {
    //         'GameCode': { N: gameCode.toString() }
    //     },
    //     UpdateExpression: 'SET Answer = :a',
    //     ExpressionAttributeValues: {
    //         ':a': { S: JSON.stringify(answer) }
    //     },
    //     TableName: TABLE_NAME
    // } as DynamoDB.UpdateItemInput
    // try {
    //     await db.updateItem(params).promise()
    // } catch (err) {
    //     throw err
    // }
}

export async function test() {
    // const seq = collectPeerICECandidates('0001', Side.HOST)
    // console.log(await seq.next())
    // const offer = await peerConn.createOffer()
    // await publishSDPOffer('0001', offer)
    // await posticecandidate('0001', side.host, 'teststring1')
    // await posticecandidate('0001', side.host, 'teststring2')
}
