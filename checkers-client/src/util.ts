/*
 * util.ts
 *
 * Module for misc. utility functions.
 */

export function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

/** Checks if any Item in s matches. Then return the element in the set that matched.
 * Returns null if there are no matches.
 */
export function anyMatch<T>(s: Set<T>, matchFunc: (e: T) => boolean) {
    for (const e of s) {
        if (matchFunc(e)) {
            return e
        }
    }
    return null
}
