import { allValidMoves, X, O, _, Space, Player } from "./gameboard";

test('Get all valid moves for player', () => {
    let boardState = [
        [_, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _],
        [_, _, _, Space.LOCAL_KING, _, _, _, _],
        [_, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _],
    ]
    expect(allValidMoves(Player.REMOTE)).not.toContain(null)
})
