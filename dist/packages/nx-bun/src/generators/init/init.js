"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initGenerator = void 0;
const devkit_1 = require("@nx/devkit");
const js_1 = require("@nx/js");
const bun_cli_1 = require("../../utils/bun-cli");
async function initGenerator(tree, options) {
    await (0, bun_cli_1.assertBunAvailable)(options.forceBunInstall);
    const tasks = [];
    tasks.push(await (0, js_1.initGenerator)(tree, {
        skipFormat: true,
    }));
    if (options.unitTestRunner === 'jest') {
        try {
            (0, devkit_1.ensurePackage)('@nx/jest', devkit_1.NX_VERSION);
        }
        catch (e) {
            tasks.push((0, devkit_1.addDependenciesToPackageJson)(tree, {}, { '@nx/jest': devkit_1.NX_VERSION }));
        }
        const jestInitGenerator = await Promise.resolve().then(() => require('@nx/jest')).then((m) => m.jestInitGenerator);
        tasks.push(await jestInitGenerator(tree, {}));
    }
    if (options.unitTestRunner === 'vitest') {
        try {
            (0, devkit_1.ensurePackage)('@nx/vite', devkit_1.NX_VERSION);
        }
        catch (e) {
            tasks.push((0, devkit_1.addDependenciesToPackageJson)(tree, {}, { '@nx/vite': devkit_1.NX_VERSION }));
        }
        const viteInitGenerator = await Promise.resolve().then(() => require('@nx/vite')).then((m) => m.initGenerator);
        tasks.push(await viteInitGenerator(tree, { uiFramework: 'none' }));
    }
    if (options.bunNXRuntime && !process.env.NX_DRY_RUN) {
        //TODO: add patch support for nx for better integration in some cases
        tasks.push((0, devkit_1.addDependenciesToPackageJson)(tree, {}, { '@nx-bun/task-worker-runner': 'latest' }));
        tasks.push(addBunPluginToNxJson(tree));
    }
    tasks.push((0, devkit_1.addDependenciesToPackageJson)(tree, {}, { 'bun-types': 'latest' }));
    const rootTsConfig = (0, js_1.getRootTsConfigPathInTree)(tree);
    (0, devkit_1.updateJson)(tree, rootTsConfig, (json) => {
        if (json.compilerOptions.types &&
            !json.compilerOptions.types.includes('bun-types')) {
            json.compilerOptions.types.push('bun-types');
        }
        else if (!json.compilerOptions.types) {
            json.compilerOptions.types = ['bun-types'];
        }
        return json;
    });
    return (0, devkit_1.runTasksInSerial)(...tasks);
}
exports.initGenerator = initGenerator;
function addBunPluginToNxJson(tree) {
    const nxJson = (0, devkit_1.readNxJson)(tree);
    nxJson.tasksRunnerOptions.default.runner = '@nx-bun/task-worker-runner';
    (0, devkit_1.updateNxJson)(tree, nxJson);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => { };
}
exports.default = initGenerator;
//# sourceMappingURL=init.js.map