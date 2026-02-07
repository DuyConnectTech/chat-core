/**
 * Wraps an async function with error handling. If the wrapped function throws an error,
 * it will be passed to the next middleware function. If the wrapped function returns a promise,
 * it will be resolved or rejected and then passed to the next middleware function.
 *
 * @param {function} fn - The async function to be wrapped.
 * @returns {function} - The wrapped function.
 */
const asyncHandler = (fn) => {
    return function wrappedHandler(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
