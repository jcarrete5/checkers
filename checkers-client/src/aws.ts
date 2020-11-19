/*
 * aws.ts
 *
 * Module for interacting with AWS services.
 */

import { CognitoIdentityCredentials } from 'aws-sdk/global'
import DynamoDB from 'aws-sdk/clients/dynamodb'
import { getSDPOffer, acceptSDPOffer } from "./p2p";

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

export async function createRoom(): Promise<number> {
    const offer = await getSDPOffer()
    const params = {
        Item: {
            'RoomCode': { N: '1' },
            'Offer': { S: JSON.stringify(offer) }
        },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: 'CheckersGame'
    } as DynamoDB.PutItemInput
    db.putItem(params).send()
    return Promise.resolve(1)  // TODO placeholder; return actual room code
}

export async function joinRoom(code: string|null) {
    // Find the room SDP offer
    let params = {
        Key: {
            'RoomCode': { N: code }
        },
        AttributesToGet: ['Offer'],
        TableName: 'CheckersGame'
    } as DynamoDB.GetItemInput
    let res = await db.getItem(params).promise()

    if (res.Item) {
        // Accept the SDP offer and reply
        const offer = JSON.parse(res.Item.Offer as string) as RTCSessionDescriptionInit
        const answer = acceptSDPOffer(offer)
        const values = {
            ':a': { S: JSON.stringify(answer) }
        }
        params = {
            Key: {
                'RoomCode': { N: code }
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
        // TODO prepare to start game
    }
}
