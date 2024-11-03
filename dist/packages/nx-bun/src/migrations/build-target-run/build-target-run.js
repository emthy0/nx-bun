"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devkit_1 = require("@nx/devkit");
const executor_options_utils_1 = require("@nx/devkit/src/generators/executor-options-utils");
const js_1 = require("@nx/js");
async function update(tree) {
    const migrateProject = (options, projectName, targetName) => {
        const projectConfig = (0, devkit_1.readProjectConfiguration)(tree, projectName);
        const appTsConfigPath = projectConfig.root
            ? (0, devkit_1.joinPathFragments)(projectConfig.root, 'tsconfig.app.json')
            : (0, devkit_1.joinPathFragments)(projectConfig.sourceRoot, '..', 'tsconfig.app.json');
        const projectTsConfigPath = projectConfig.root
            ? (0, devkit_1.joinPathFragments)(projectConfig.root, 'tsconfig.json')
            : (0, devkit_1.joinPathFragments)(projectConfig.sourceRoot, '..', 'tsconfig.json');
        projectConfig.targets[targetName].executor = '@nx-bun/nx:run';
        delete projectConfig.targets[targetName].options.main;
        projectConfig.targets[targetName].options.buildTarget = `${projectConfig.name}:build`;
        projectConfig.targets[targetName].options.tsConfig = tree.exists(appTsConfigPath)
            ? appTsConfigPath
            : tree.exists(projectTsConfigPath)
                ? projectTsConfigPath
                : (0, js_1.getRootTsConfigFileName)(tree);
        (0, devkit_1.updateProjectConfiguration)(tree, projectName, projectConfig);
    };
    (0, executor_options_utils_1.forEachExecutorOptions)(tree, '@nx-bun/nx:run', migrateProject);
    await (0, devkit_1.formatFiles)(tree);
}
exports.default = update;
//# sourceMappingURL=build-target-run.js.map