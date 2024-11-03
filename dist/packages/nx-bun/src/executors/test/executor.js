"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_iterable_1 = require("@nx/devkit/src/utils/async-iterable");
const bun_cli_1 = require("../../utils/bun-cli");
const worker_threads_1 = require("worker_threads");
const kill_1 = require("../../utils/kill");
async function* runExecutor(options, context) {
    await (0, bun_cli_1.assertBunAvailable)();
    const opts = normalizeOptions(options, context);
    const args = createArgs(opts);
    yield* (0, async_iterable_1.createAsyncIterable)(async ({ next, done }) => {
        const runningBun = await (0, bun_cli_1.executeCliAsync)(args, {
            stdio: 'pipe',
            stderr: 'pipe',
            stdin: 'pipe',
            stdout: 'pipe',
        });
        if ((0, bun_cli_1.isBunSubprocess)(runningBun)) {
            const writableStream = (type) => {
                const textDecoder = new TextDecoder();
                return new WritableStream({
                    write(chunk) {
                        const text = textDecoder.decode(chunk);
                        if (worker_threads_1.parentPort) {
                            worker_threads_1.parentPort.postMessage({ type, message: text });
                        }
                        else {
                            console.log(text);
                        }
                    },
                    close() {
                        console.log('Stream closed');
                    },
                    abort(err) {
                        console.error('Stream aborted', err);
                    },
                });
            };
            runningBun.stdout.pipeTo(writableStream('stdout'));
            runningBun.stderr.pipeTo(writableStream('stderr'));
        }
        else {
            const textDecoder = new TextDecoder();
            runningBun.stdout.on('data', (data) => {
                const textData = textDecoder.decode(data);
                if (worker_threads_1.parentPort) {
                    worker_threads_1.parentPort.postMessage({ type: 'stdout', message: textData });
                }
                else {
                    console.log(textData);
                }
            });
            runningBun.stderr.on('data', (data) => {
                const textData = textDecoder.decode(data);
                if (worker_threads_1.parentPort) {
                    worker_threads_1.parentPort.postMessage({ type: 'stderr', message: textData });
                }
                else {
                    console.log(textData);
                }
            });
        }
        process.on('SIGTERM', async () => {
            await (0, kill_1.killCurrentProcess)(runningBun, 'SIGTERM');
            process.exit(128 + 15);
        });
        process.on('SIGINT', async () => {
            await (0, kill_1.killCurrentProcess)(runningBun, 'SIGINT');
            process.exit(128 + 2);
        });
        process.on('SIGHUP', async () => {
            await (0, kill_1.killCurrentProcess)(runningBun, 'SIGHUP');
            process.exit(128 + 1);
        });
        process.on('uncaughtException', async (err) => {
            console.error('Caught exception:', err);
            await (0, kill_1.killCurrentProcess)(runningBun, 'SIGTERM');
            process.exit(1);
        });
        if (options.watch) {
            next({ success: true });
        }
        if ((0, bun_cli_1.isBunSubprocess)(runningBun)) {
            runningBun.exited.then((code) => {
                next({ success: code === 0 });
                if (!options.watch) {
                    done();
                }
            });
        }
        else {
            runningBun.on('exit', (code) => {
                next({ success: code === 0 });
                if (!options.watch) {
                    done();
                }
            });
        }
    });
}
exports.default = runExecutor;
function createArgs(options) {
    const args = ['test', `--cwd=${options.testDir}`];
    if (options.smol) {
        args.push('--smol');
    }
    if (options.config) {
        args.push(`-c ${options.config}`);
    }
    if (options.tsConfig) {
        args.push(`--tsconfig-override=${options.tsConfig}`);
    }
    if (typeof options.bail === 'boolean') {
        args.push('--bail');
    }
    else if (typeof options.bail === 'number') {
        args.push(`--bail=${options.bail}`);
    }
    if (options.preload) {
        args.push(`--preload=${options.preload}`);
    }
    if (options.timeout) {
        args.push(`--timeout=${options.timeout}`);
    }
    if (options.rerunEach) {
        args.push(`--rerun-each=${options.rerunEach}`);
    }
    if (options.watch) {
        args.push('--watch');
    }
    return args;
}
function normalizeOptions(options, context) {
    const projectConfig = context.projectGraph?.nodes?.[context.projectName]?.data;
    if (!projectConfig) {
        throw new Error(`Could not find project configuration for ${context.projectName} in executor context.`);
    }
    return {
        ...options,
        testDir: projectConfig.sourceRoot || projectConfig.root,
    };
}
//# sourceMappingURL=executor.js.map