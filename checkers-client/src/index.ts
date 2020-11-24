/*
 * index.ts
 *
 * Entry point for the application.
 */

import { drawBoard } from './gameboard'
import { createGame, joinGame, test } from './aws'

const createGameBtn = document.getElementById('btn-create-game') as HTMLButtonElement
const joinGameBtn = document.getElementById('btn-join-game') as HTMLButtonElement

/* btn-create-game click event listener */
createGameBtn.addEventListener('click', async ev => {
    const createGameSeq = createGame()
    try {
        const gameCode = await createGameSeq.next()
        alert(`Game code: ${gameCode}`)
        await createGameSeq.next()
    } catch (err) {
        alert(err)
        throw err
    }
})

/* btn-join-game click event listener */
joinGameBtn.addEventListener('click', async ev => {
    const gameCode = prompt('Enter a game code')
    try {
        await joinGame(gameCode)
    } catch (err) {
        alert(err)
        throw err
    }
})

drawBoard()
test()
