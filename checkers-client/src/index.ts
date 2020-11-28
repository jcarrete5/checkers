/*
 * index.ts
 *
 * Entry point for the application.
 */

import { drawBoard } from './gameboard'
import { createGame, joinGame } from './aws'

const createGameBtn = document.getElementById('btn-create-game') as HTMLButtonElement
const joinGameBtn = document.getElementById('btn-join-game') as HTMLButtonElement

/* btn-create-game click event listener */
createGameBtn.addEventListener('click', async ev => {
    const createGameSeq = createGame()
    const gameCode = (await createGameSeq.next()).value
    if (gameCode) {
        alert(`Game code: ${gameCode}`)
        await createGameSeq.next()
    } else {
        throw 'Internal error generating gameCode'
    }
})

/* btn-join-game click event listener */
joinGameBtn.addEventListener('click', async ev => {
    const gameCode = prompt('Enter a game code')
    await joinGame(gameCode)
})

drawBoard()
