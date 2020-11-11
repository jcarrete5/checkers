const boardCanvas = document.getElementById("board-canvas") as HTMLCanvasElement

const NUM_ROWS = 8
const NUM_COLS = 8
const SIDE_LEN = boardCanvas.width/8

export function drawBoard() {
    const g = boardCanvas.getContext('2d')
    if (!g) {
        console.error("Failed to get graphics context for canvas")
        return
    }
    g.fillRect(0, 0, 50, 50)
    for (var i = 0; i < NUM_ROWS; i++) {
        for (var j = 0; j < NUM_COLS; j++) {
            g.fillStyle = (i + j) % 2 ? 'green' : 'blue'
            g.fillRect(i*SIDE_LEN, j*SIDE_LEN, SIDE_LEN, SIDE_LEN)
        }
    }
}
