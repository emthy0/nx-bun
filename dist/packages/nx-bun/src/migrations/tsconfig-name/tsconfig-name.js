"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const devkit_1 = require("@nx/devkit");
const executor_options_utils_1 = require("@nx/devkit/src/generators/executor-options-utils");
function update(host) {
    const migrateProject = (options, projectName, targetName) => {
        const projectConfig = (0, devkit_1.readProjectConfiguration)(host, projectName);
        projectConfig.targets[targetName].options.tsConfig =
            projectConfig.targets[targetName].options.tsconfig;
        delete projectConfig.targets[targetName].options.tsconfig;
        (0, devkit_1.updateProjectConfiguration)(host, projectName, projectConfig);
    };
    (0, executor_options_utils_1.forEachExecutorOptions)(host, '@nx-bun/nx:run', migrateProject);
    (0, executor_options_utils_1.forEachExecutorOptions)(host, '@nx-bun/nx:build', migrateProject);
    (0, executor_options_utils_1.forEachExecutorOptions)(host, '@nx-bun/nx:test', migrateProject);
}
exports.default = update;
//# sourceMappingURL=tsconfig-name.js.map