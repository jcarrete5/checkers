/*
 * index.ts
 *
 * Entry point for the application.
 */

import { drawBoard } from './gameboard'
import { hostGame, joinGame } from './p2p'

const createGameBtn = document.getElementById('btn-create-game') as HTMLButtonElement
const joinGameBtn = document.getElementById('btn-join-game') as HTMLButtonElement

/* btn-create-game click event listener */
createGameBtn.addEventListener('click', async ev => {
    hostGame()
})

/* btn-join-game click event listener */
joinGameBtn.addEventListener('click', async ev => {
    const gameCode = prompt('Enter a game code')
    joinGame(gameCode)
})

drawBoard()
