"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_cli_1 = require("../../utils/bun-cli");
const async_iterable_1 = require("@nx/devkit/src/utils/async-iterable");
const worker_threads_1 = require("worker_threads");
const kill_1 = require("../../utils/kill");
async function* bundleExecutor(options, context) {
    await (0, bun_cli_1.assertBunAvailable)();
    console.log(`Building ${context.projectName}...`);
    console.log('Is this a bun project?', globalThis.Bun !== undefined);
    console.log('Options:', options);
    if (globalThis.Bun !== undefined && !options.compile) {
        const result = await Bun.build({
            entrypoints: options.entrypoints,
            define: options.define,
            outdir: options.outputPath,
            external: options.external,
            format: options.format,
            minify: options.define,
            naming: options.naming,
            publicPath: options.publicPath,
            sourcemap: options.sourcemap,
            splitting: options.splitting,
            target: options.target,
        });
        for (const log of result.logs) {
            console.log(log);
        }
        if (result.success) {
            const outputTextAsync = result.outputs.flatMap((res) => res.text());
            const outputText = await Promise.all(outputTextAsync);
            outputText.forEach((out) => console.log(out));
            console.log(`Build completed for  ${context.projectName}`);
            return { success: true };
        }
        else {
            return { success: false };
        }
    }
    else {
        const args = createArgs(options, context);
        console.log('Executing bun with args:', args);
        yield* (0, async_iterable_1.createAsyncIterable)(async ({ next, done }) => {
            const runningBun = await (0, bun_cli_1.executeCliAsync)(args, {
                stdio: 'pipe',
                stderr: 'inherit',
                stdin: 'pipe',
                stdout: 'inherit',
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
            if ((0, bun_cli_1.isBunSubprocess)(runningBun)) {
                runningBun.exited.then((code) => {
                    console.log(`Build completed for  ${context.projectName}`);
                    next({ success: code === 0 });
                    done();
                });
            }
            else {
                runningBun.on('exit', (code) => {
                    console.log(`Build completed for  ${context.projectName}`);
                    next({ success: code === 0 });
                    done();
                });
            }
        });
    }
}
exports.default = bundleExecutor;
function createArgs(options, context) {
    const args = ['build'];
    if (options.smol) {
        args.push('--smol');
    }
    if (options.config) {
        args.push(`-c ${options.config}`);
    }
    if (options.tsConfig) {
        args.push(`--tsconfig-override=${options.tsConfig}`);
    }
    if (options.entrypoints) {
        args.push(`${options.entrypoints.join(' ./')}`);
    }
    if (options.external) {
        args.push(`--external=${options.external}`);
    }
    if (options.format) {
        args.push(`--format=${options.format}`);
    }
    if (options.minify) {
        args.push(`--minify`);
    }
    if (options.naming) {
        args.push(`--naming ${options.naming}`);
    }
    if (options.outputPath) {
        args.push(`--outdir=./${options.outputPath}`);
    }
    if (options.target) {
        args.push(`--target=${options.target}`);
    }
    if (options.compile) {
        args.push('--compile');
    }
    if (options.plugins) {
        console.warn(`plugin is only support with --bun flag, and not in conjuction with --compile`);
    }
    if (options.publicPath) {
        console.warn(`publicPath is only support with --bun flag, and not in conjuction with --compile`);
    }
    return args;
}
//# sourceMappingURL=executor.js.map