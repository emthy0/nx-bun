"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_worker_threads_1 = require("node:worker_threads");
const path = require("node:path");
const node_crypto_1 = require("node:crypto");
const async_iterable_1 = require("@nx/devkit/src/utils/async-iterable");
const devkit_1 = require("@nx/devkit");
const get_main_file_dir_1 = require("@nx/js/src/utils/get-main-file-dir");
const bun_cli_1 = require("../../utils/bun-cli");
const kill_1 = require("../../utils/kill");
const debounce_1 = require("../../utils/debounce");
function getFileToRun(context, project, buildOptions, buildTargetExecutor) {
    // If using run-commands or another custom executor, then user should set
    // outputFileName, but we can try the default value that we use.
    if (!buildOptions?.outputPath && !buildOptions?.outputFileName) {
        const fallbackFile = path.join('dist', project.data.root, 'main.js');
        devkit_1.logger.warn(`Build option outputFileName not set for ${project.name}. Using fallback value of ${fallbackFile}.`);
        return path.join(context.root, fallbackFile);
    }
    let outputFileName = buildOptions.outputFileName;
    if (!outputFileName) {
        if (buildTargetExecutor === '@nx/js:tsc' ||
            buildTargetExecutor === '@nx/js:swc') {
            const fileName = `${path.parse(buildOptions.main).name}.js`;
            outputFileName = path.join((0, get_main_file_dir_1.getRelativeDirectoryToProjectRoot)(buildOptions.main, project.data.root), fileName);
        }
        else if (buildTargetExecutor === '@nx-bun/nx:build' ||
            buildTargetExecutor.includes('../dist/packages/nx-bun:build')) {
            return path.join(context.root, buildOptions.entrypoints[0]);
        }
        else {
            outputFileName = `${path.parse(buildOptions.main).name}.js`;
        }
    }
    return path.join(context.root, buildOptions.outputPath, outputFileName);
}
async function* bunRunExecutor(options, context) {
    await (0, bun_cli_1.assertBunAvailable)();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const project = context.projectGraph?.nodes[context.projectName];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const buildTarget = (0, devkit_1.parseTargetString)(options.buildTarget, context.projectGraph);
    const projectBuildTargetConfig = project.data.targets?.[buildTarget.target];
    if (!projectBuildTargetConfig) {
        throw new Error(`Cannot find build target ${options.buildTarget} for project ${context.projectName}`);
    }
    const buildTargetExecutor = projectBuildTargetConfig?.executor;
    if (!buildTargetExecutor) {
        throw new Error(`Missing executor in build target ${options.buildTarget} for project ${context.projectName}`);
    }
    const isBunBuildTargetExecutor = buildTargetExecutor === '@nx-bun/nx:build' ||
        buildTargetExecutor.includes('../dist/packages/nx-bun:build');
    console.log('isBunBuildTargetExecutor', isBunBuildTargetExecutor);
    console.log('isBun', globalThis.Bun !== undefined);
    const buildOptions = {
        ...(0, devkit_1.readTargetOptions)(buildTarget, context),
        ...options.buildTargetOptions,
    };
    const fileToRun = getFileToRun(context, project, buildOptions, buildTargetExecutor);
    const args = getArgs(options, context);
    let currentTask;
    const tasks = [];
    yield* (0, async_iterable_1.createAsyncIterable)(async ({ next, done }) => {
        const processQueue = async () => {
            if (tasks.length === 0)
                return;
            const previousTask = currentTask;
            const task = tasks.shift();
            currentTask = task;
            await previousTask?.stop('SIGTERM');
            await task?.start();
        };
        const debouncedProcessQueue = (0, debounce_1.debounce)({ delay: options.debounce ?? 1_000 }, processQueue);
        const addToQueue = async (childProcess, buildResult) => {
            const task = {
                id: (0, node_crypto_1.randomUUID)(),
                killed: false,
                childProcess,
                promise: null,
                start: async () => {
                    // Wait for build to finish.
                    const result = await buildResult;
                    if (!result.success) {
                        // If in watch-mode, don't throw or else the process exits.
                        if (options.watch) {
                            if (!task.killed) {
                                // Only log build error if task was not killed by a new change.
                                devkit_1.logger.error(`Build failed, waiting for changes to restart...`);
                            }
                            return;
                        }
                        else {
                            throw new Error(`Build failed. See above for errors.`);
                        }
                    }
                    // Before running the program, check if the task has been killed (by a new change during watch).
                    if (task.killed)
                        return;
                    // Run the program
                    // eslint-disable-next-line no-async-promise-executor
                    task.promise = new Promise(async (resolve, reject) => {
                        const runningBun = await (0, bun_cli_1.executeCliAsync)(['run', ...args, fileToRun], {
                            stdio: 'pipe',
                            stderr: 'inherit',
                            stdin: 'pipe',
                            stdout: 'inherit',
                        });
                        task.childProcess = runningBun;
                        if ((0, bun_cli_1.isBunSubprocess)(runningBun)) {
                            const writableStream = (type) => {
                                const textDecoder = new TextDecoder();
                                return new WritableStream({
                                    write(chunk) {
                                        const text = textDecoder.decode(chunk);
                                        if (node_worker_threads_1.parentPort) {
                                            node_worker_threads_1.parentPort.postMessage({ type, message: text });
                                        }
                                        else {
                                            devkit_1.logger.log(text);
                                        }
                                    },
                                    close() {
                                        if (!options.watch)
                                            done();
                                        resolve();
                                    },
                                    abort(err) {
                                        devkit_1.logger.error(err);
                                        if (!options.watch)
                                            done();
                                        reject(err);
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
                                if (node_worker_threads_1.parentPort) {
                                    node_worker_threads_1.parentPort.postMessage({ type: 'stdout', message: textData });
                                }
                                else {
                                    devkit_1.logger.log(textData);
                                }
                            });
                            const handleStdErr = (data) => {
                                if (!options.watch || !task.killed) {
                                    const textData = textDecoder.decode(data);
                                    if (node_worker_threads_1.parentPort) {
                                        node_worker_threads_1.parentPort.postMessage({
                                            type: 'stderr',
                                            message: textData,
                                        });
                                    }
                                    else {
                                        devkit_1.logger.log(textData);
                                    }
                                }
                            };
                            runningBun.stderr.on('data', handleStdErr);
                            runningBun.once('exit', (code) => {
                                runningBun?.off('data', handleStdErr);
                                if (options.watch && !task.killed) {
                                    devkit_1.logger.info(`NX Process exited with code ${code}, waiting for changes to restart...`);
                                }
                                if (!options.watch)
                                    done();
                                resolve();
                            });
                        }
                        next({ success: true, options: buildOptions });
                    });
                },
                stop: async (signal = 'SIGTERM') => {
                    task.killed = true;
                    // Request termination and wait for process to finish gracefully.
                    // NOTE: `childProcess` may not have been set yet if the task did not have a chance to start.
                    // e.g. multiple file change events in a short time (like git checkout).
                    if (task.childProcess) {
                        await (0, kill_1.killCurrentProcess)(task.childProcess, signal);
                    }
                    try {
                        await task.promise;
                    }
                    catch {
                        // Doesn't matter if task fails, we just need to wait until it finishes.
                    }
                },
            };
            tasks.push(task);
        };
        if (!isBunBuildTargetExecutor) {
            // TODO: custom run executor
            const output = await (0, devkit_1.runExecutor)(buildTarget, {
                ...options.buildTargetOptions,
                watch: options.watch,
            }, context);
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const event = await output.next();
                await addToQueue(null, Promise.resolve(event.value));
                await debouncedProcessQueue();
                if (event.done || !options.watch) {
                    break;
                }
            }
        }
        else {
            await addToQueue(null, Promise.resolve({ success: true }));
            await processQueue();
        }
        const stopAllTasks = (signal = 'SIGTERM') => {
            for (const task of tasks) {
                task.stop(signal);
            }
        };
        process.on('SIGTERM', async () => {
            stopAllTasks('SIGTERM');
            process.exit(128 + 15);
        });
        process.on('SIGINT', async () => {
            stopAllTasks('SIGINT');
            process.exit(128 + 2);
        });
        process.on('SIGHUP', async () => {
            stopAllTasks('SIGHUP');
            process.exit(128 + 1);
        });
    });
}
exports.default = bunRunExecutor;
function getArgs(options, context) {
    const args = [];
    if (options.bun) {
        args.push('--bun');
    }
    if (options.tsConfig) {
        args.push(`--tsconfig-override=${options.tsConfig}`);
    }
    if (options.smol) {
        args.push('--smol');
    }
    if (options.watch) {
        args.push('--watch');
    }
    if (options.hot) {
        args.push('--hot');
    }
    if (options.config) {
        args.push(`-c ${options.config}`);
    }
    return args;
}
//# sourceMappingURL=executor.js.map