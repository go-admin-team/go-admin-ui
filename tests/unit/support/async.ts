/**
 * Async helpers shared by the composable specs.
 *
 * Both of these were copy-pasted into each new spec file, and the copies had
 * already started to drift -- one deferred() had lost its reject branch, and the
 * flush helper existed under two names.
 */

/** A promise whose settlement the test controls. */
export function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/**
 * Lets every queued microtask settle.
 *
 * setTimeout rather than a bare `await Promise.resolve()`: the code under test
 * chains several awaits, and a macrotask boundary clears all of them at once.
 */
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
