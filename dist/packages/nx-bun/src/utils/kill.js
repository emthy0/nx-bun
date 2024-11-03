"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.killCurrentProcess = void 0;
const bun_cli_1 = require("./bun-cli");
async function killCurrentProcess(childProcess, signal) {
    try {
        if (!childProcess.killed) {
            if ((0, bun_cli_1.isBunSubprocess)(childProcess)) {
                childProcess.kill();
            }
            else {
                childProcess.kill(signal);
            }
        }
    }
    catch (error) {
        console.error('Error killing the process:', error);
    }
}
exports.killCurrentProcess = killCurrentProcess;
//# sourceMappingURL=kill.js.map