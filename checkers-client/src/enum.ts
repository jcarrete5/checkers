
/** Enumeration of values that can occupy a space on the board. */
export enum Space {
    /** A free space */
    FREE,
    /** Local player's man */
    LOCAL_MAN,
    /** Remote player's man */
    REMOTE_MAN,
    /** Local player's king */
    LOCAL_KING,
    /** Remote player's king */
    REMOTE_KING,
}

export enum GameTurn {
    REMOTE,
    LOCAL,
}

/** Enumberation of values that indicate the direction to check movable spaces. */
export enum Direction {
    TOP_LEFT,
    TOP_RIGHT,
    BOT_LEFT,
    BOT_RIGHT,
}
