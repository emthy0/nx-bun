"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGenerator = void 0;
const devkit_1 = require("@nx/devkit");
const bun_cli_1 = require("../../utils/bun-cli");
const path_1 = require("path");
const add_project_1 = require("./add-project");
const init_1 = require("../init/init");
const fs_1 = require("fs");
const fileutils_1 = require("nx/src/utils/fileutils");
const ts_config_1 = require("../../utils/ts-config");
const project_name_and_root_utils_1 = require("@nx/devkit/src/generators/project-name-and-root-utils");
async function createGenerator(tree, options) {
    const tasks = [];
    tasks.push(await (0, init_1.default)(tree, { bunNXRuntime: false, forceBunInstall: false }));
    const opts = await normalizedSchema(tree, options);
    const args = createArgs(opts);
    await (0, bun_cli_1.executeCliWithLogging)(args, {
        stderr: 'inherit',
        stdin: 'inherit',
        stdio: 'inherit',
        stdout: 'inherit',
    });
    (0, fs_1.rmSync)(`${opts.projectRoot}/node_modules`, { force: true, recursive: true });
    const bunLockPath = `${opts.projectRoot}/bun.lockb`;
    if (tree.exists(bunLockPath)) {
        tree.delete(bunLockPath);
    }
    tree.delete(`${opts.projectRoot}/.gitignore`);
    // we hack the changes into the change logs of the tree
    for (const filePath of walkSync(opts.projectRoot)) {
        const content = (0, fileutils_1.readFileIfExisting)(filePath);
        tree.recordedChanges[tree.rp(filePath)] = {
            content: Buffer.from(content),
            isDeleted: false,
            options,
        };
    }
    if (tree.exists(`${opts.projectRoot}/tsconfig.json`)) {
        (0, devkit_1.updateJson)(tree, `${opts.projectRoot}/tsconfig.json`, (file) => {
            file.extends = (0, path_1.join)((0, devkit_1.offsetFromRoot)(opts.projectRoot), 'tsconfig.base.json');
            return file;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let scripts = {};
    let dependencies = {};
    let devDependencies = {};
    (0, devkit_1.updateJson)(tree, `${opts.projectRoot}/package.json`, (file) => {
        scripts = file.scripts;
        dependencies = file.dependencies;
        devDependencies = file.devDependencies;
        file.dependencies = {};
        file.devDependencies = {};
        return file;
    });
    (0, devkit_1.addDependenciesToPackageJson)(tree, dependencies, devDependencies);
    const scriptToRun = scripts.start
        ? scripts.start
        : scripts.dev
            ? scripts.dev
            : null;
    if (scriptToRun) {
        const baseFileToRun = findFileToRun(tree, scriptToRun, opts.projectRoot);
        if (baseFileToRun) {
            (0, add_project_1.addProjectFromScript)(tree, opts, baseFileToRun, 'serve');
            if (opts.publishable) {
                (0, ts_config_1.updateTsConfig)(tree, {
                    entryPoints: [(0, devkit_1.joinPathFragments)(opts.projectRoot, baseFileToRun)],
                    importPath: opts.importPath,
                });
            }
        }
    }
    if (process.env.NX_DRY_RUN) {
        (0, fs_1.rmSync)(opts.projectRoot, { force: true, recursive: true });
    }
    await (0, devkit_1.formatFiles)(tree);
    return (0, devkit_1.runTasksInSerial)(...tasks);
}
exports.createGenerator = createGenerator;
function* walkSync(dir) {
    const files = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            yield* walkSync((0, path_1.join)(dir, file.name));
        }
        else {
            yield (0, path_1.join)(dir, file.name);
        }
    }
}
function createArgs(options) {
    const args = ['create'];
    args.push(options.template);
    args.push(options.projectRoot);
    args.push('--no-git');
    args.push('--no-install');
    return args;
}
async function normalizedSchema(tree, options) {
    const name = (0, devkit_1.names)(options.name).fileName;
    const projectDirectory = options.directory
        ? `${(0, devkit_1.names)(options.directory).fileName}/${name}`
        : name;
    const { projectName, names: projectNames, projectRoot, importPath, } = await (0, project_name_and_root_utils_1.determineProjectNameAndRootOptions)(tree, {
        name: options.name,
        projectType: 'application',
        directory: options.directory,
        importPath: options.importPath,
        projectNameAndRootFormat: options.projectNameAndRootFormat,
        rootProject: options.rootProject,
        callingGenerator: '@nx-bun/nx:create',
    });
    const layout = (0, devkit_1.getWorkspaceLayout)(tree);
    return {
        ...options,
        name,
        projectDirectory,
        projectName,
        projectNames,
        layout,
        projectRoot,
        importPath,
    };
}
function findFileToRun(host, script, projectRoot) {
    const afterRun = script
        .split('run')[1]
        .split(' ')
        .filter((s) => s.length);
    return afterRun.find((path) => host.exists((0, path_1.join)(projectRoot, path)));
}
exports.default = createGenerator;
//# sourceMappingURL=generator.js.map