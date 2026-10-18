export class AssertionError extends Error {
    "name": "Assertion Error";
}

export function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new AssertionError(message);
}

export function assertNever(value: never): never {
    throw new AssertionError(`Unexpected value: ${JSON.stringify(value)}`);
}
