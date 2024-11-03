"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCliWithLogging = exports.executeCliAsync = exports.getBunVersion = exports.assertBunAvailable = exports.isBunSubprocess = void 0;
const devkit_1 = require("@nx/devkit");
const node_child_process_1 = require("node:child_process");
const worker_threads_1 = require("worker_threads");
// Detect environment
const isBun = typeof globalThis.Bun !== 'undefined';
function isBunExecOptions(options) {
    return isBun;
}
function isNodeExecOptions(options) {
    return !isBun;
}
function isBunSubprocess(process) {
    return isBun && 'exited' in process;
}
exports.isBunSubprocess = isBunSubprocess;
async function assertBunAvailable(forceInstall = false) {
    try {
        if (isBun) {
            Bun.spawnSync({ cmd: ['bun', '--version'] });
            return Promise.resolve(true);
        }
        else {
            const { execSync } = await Promise.resolve().then(() => require('child_process'));
            execSync('bun --version');
            return Promise.resolve(true);
        }
    }
    catch (e) {
        if (forceInstall && !process.env.NX_DRY_RUN) {
            const { execSync } = await Promise.resolve().then(() => require('child_process'));
            execSync(`curl -fsSL https://bun.sh/install | bash`);
            return Promise.resolve(true);
        }
        else if (forceInstall) {
            throw new Error((0, devkit_1.stripIndents) `force install of bun is not supported in dry-run`);
        }
        throw new Error((0, devkit_1.stripIndents) `Unable to find Bun on your system.
        Bun will need to be installed in order to run targets from nx-bun in this workspace.
        You can learn how to install bun at https://bun.sh/docs/installation
      `);
    }
}
exports.assertBunAvailable = assertBunAvailable;
async function getBunVersion() {
    try {
        let output;
        if (isBun) {
            const result = Bun.spawnSync({ cmd: ['bun', '--version'] });
            output = result.stdout?.toString().trim() || '';
        }
        else {
            const { execSync } = await Promise.resolve().then(() => require('child_process'));
            output = execSync('bun --version').toString().trim();
        }
        const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
        return versionMatch ? versionMatch[1] : output;
    }
    catch (error) {
        console.error(`Failed to retrieve the version for bun.`);
        return null;
    }
}
exports.getBunVersion = getBunVersion;
async function executeCliAsync(args, options = {}) {
    // TODO: Get bun spawn working. Cant get anything out of it
    if (isBun) {
        if (isBunExecOptions(options)) {
            const childProcess = Bun.spawn(['bun', ...args], {
                cwd: options.cwd || devkit_1.workspaceRoot,
                env: { ...process.env, ...(worker_threads_1.workerData || {}) },
                stdin: options.stdin || 'ignore',
                stdout: options.stdout || isBun ? 'pipe' : 'pipe',
                stderr: options.stderr || isBun ? 'pipe' : 'pipe',
            });
            if (isBunSubprocess(childProcess)) {
                return Promise.resolve(childProcess);
            }
        }
    }
    else {
        if (isNodeExecOptions(options)) {
            return (0, node_child_process_1.spawn)('bun', args, {
                cwd: options.cwd || devkit_1.workspaceRoot,
                env: { ...process.env, ...(worker_threads_1.workerData || {}) },
                windowsHide: true,
                stdio: options.stdio || 'pipe',
            });
        }
    }
}
exports.executeCliAsync = executeCliAsync;
async function executeCliWithLogging(args, options = {}) {
    return new Promise((resolve, reject) => {
        executeCliAsync(args, options).then((child) => {
            if (isBunSubprocess(child)) {
                if (child.stdout) {
                    const stdoutReader = child.stdout.getReader();
                    stdoutReader.read().then(({ value, done }) => {
                        if (!done && value) {
                            const stdout = new TextDecoder().decode(value);
                            if (worker_threads_1.parentPort) {
                                worker_threads_1.parentPort.postMessage({
                                    type: 'stdout',
                                    message: stdout,
                                });
                            }
                            console.log(`stdout: ${stdout}`);
                        }
                    });
                }
                if (child.stderr) {
                    const stderrReader = child.stderr.getReader();
                    stderrReader.read().then(({ value, done }) => {
                        const stderr = new TextDecoder().decode(value);
                        if (!done && value) {
                            if (worker_threads_1.parentPort) {
                                worker_threads_1.parentPort.postMessage({
                                    type: 'stdout',
                                    message: stderr,
                                });
                            }
                            console.error(`stderr: ${stderr}`);
                        }
                    });
                }
                child.exited.then((code) => {
                    if (code !== 0) {
                        reject(new Error(`child process exited with code ${code}`));
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                if (child.stdout) {
                    child.stdout.on('data', (data) => {
                        if (worker_threads_1.parentPort) {
                            worker_threads_1.parentPort.postMessage({
                                type: 'stdout',
                                message: data,
                            });
                        }
                        console.log(`stdout: ${data}`);
                    });
                }
                if (child.stderr) {
                    child.stderr.on('data', (data) => {
                        worker_threads_1.parentPort.postMessage({
                            type: 'stderr',
                            message: data,
                        });
                        console.error(`stderr: ${data}`);
                    });
                }
                child.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`child process exited with code ${code}`));
                    }
                    else {
                        resolve(true);
                    }
                });
            }
        });
    });
}
exports.executeCliWithLogging = executeCliWithLogging;
//# sourceMappingURL=bun-cli.js.map