/*
 * util.ts
 *
 * Module for misc. utility functions.
 */

export function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}
