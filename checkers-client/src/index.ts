/*
 * index.ts
 *
 * Entry point for the application.
 */

import { drawBoard } from "./gameboard";
import { createRoom, joinRoom } from "./aws";

const createGame = document.getElementById('btn-create-game') as HTMLButtonElement
const joinGame = document.getElementById('btn-join-game') as HTMLButtonElement

/* btn-create-game click event listener */
createGame.addEventListener('click', async ev => {
    const roomCode = await createRoom()
    alert(roomCode)
    // const remoteDesc = new RTCSessionDescription(message.answer);
    // await peerConn.setRemoteDescription(remoteDesc);
})

/* btn-join-game click event listener */
joinGame.addEventListener('click', async ev => {
    const gameCode = prompt('Enter a game code')
    await joinRoom(gameCode)
})

drawBoard()
