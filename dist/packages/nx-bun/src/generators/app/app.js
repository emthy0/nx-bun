"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appGenerator = void 0;
const devkit_1 = require("@nx/devkit");
const path = require("path");
const project_name_and_root_utils_1 = require("@nx/devkit/src/generators/project-name-and-root-utils");
const js_1 = require("@nx/js");
const init_1 = require("../init/init");
async function appGenerator(tree, options) {
    const opts = await normalizeOptions(tree, options);
    await (0, init_1.default)(tree, { bunNXRuntime: false, forceBunInstall: false });
    const entryPoints = [(0, devkit_1.joinPathFragments)(opts.projectRoot, 'src', 'main.ts')];
    const build = {
        executor: '@nx-bun/nx:build',
        outputs: ['{options.outputPath}'],
        options: {
            entrypoints: entryPoints,
            outputPath: (0, devkit_1.joinPathFragments)('dist', opts.projectRoot ? opts.name : opts.projectRoot),
            tsConfig: (0, devkit_1.joinPathFragments)(opts.projectRoot, 'tsconfig.app.json'),
            smol: false,
            bun: true,
        },
    };
    const serve = {
        executor: '@nx-bun/nx:run',
        defaultConfiguration: 'development',
        options: {
            buildTarget: `${opts.projectName}:build`,
            tsConfig: (0, devkit_1.joinPathFragments)(opts.projectRoot, 'tsconfig.app.json'),
            watch: true,
            hot: true,
            bun: true,
            smol: false,
        },
    };
    const test = {
        executor: '@nx-bun/nx:test',
        options: {
            smol: false,
            bail: true,
            tsConfig: (0, devkit_1.joinPathFragments)(opts.projectRoot, 'tsconfig.json'),
            bun: true,
        },
    };
    (0, devkit_1.addProjectConfiguration)(tree, opts.projectName, {
        root: opts.projectRoot,
        projectType: 'application',
        sourceRoot: `${opts.projectRoot}/src`,
        targets: {
            build,
            serve,
            test,
        },
    });
    createFiles(tree, opts);
    await (0, devkit_1.formatFiles)(tree);
}
exports.appGenerator = appGenerator;
async function normalizeOptions(tree, options) {
    const { projectName, names: projectNames, projectRoot, importPath, } = await (0, project_name_and_root_utils_1.determineProjectNameAndRootOptions)(tree, {
        name: options.name,
        projectType: 'application',
        directory: options.directory,
        projectNameAndRootFormat: options.projectNameAndRootFormat,
        rootProject: options.rootProject,
        callingGenerator: '@nx-bun/nx:application',
    });
    const fileName = getCaseAwareFileName({
        fileName: projectNames.projectFileName,
        pascalCaseFiles: false,
    });
    const parsedTags = options.tags
        ? options.tags.split(',').map((s) => s.trim())
        : [];
    return {
        ...options,
        fileName,
        name: projectName,
        projectNames,
        projectName,
        propertyName: (0, devkit_1.names)(fileName).propertyName,
        projectRoot,
        parsedTags,
        importPath,
    };
}
function getCaseAwareFileName(options) {
    const normalized = (0, devkit_1.names)(options.fileName);
    return options.pascalCaseFiles ? normalized.className : normalized.fileName;
}
function createFiles(tree, opts) {
    const templateOptions = {
        ...opts,
        template: '',
        cliCommand: 'nx',
        offsetFromRoot: (0, devkit_1.offsetFromRoot)(opts.projectRoot),
        baseTsConfig: (0, js_1.getRootTsConfigPathInTree)(tree),
    };
    (0, devkit_1.generateFiles)(tree, path.join(__dirname, 'files/common'), `${opts.projectRoot}`, templateOptions);
    const applicationType = {
        api: {
            genFiles: () => {
                tree.delete((0, devkit_1.joinPathFragments)(opts.projectRoot, 'src', 'main.ts'));
                tree.delete((0, devkit_1.joinPathFragments)(opts.projectRoot, 'src', 'main.spec.ts'));
                (0, devkit_1.generateFiles)(tree, path.join(__dirname, 'files/api'), `${opts.projectRoot}`, templateOptions);
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            packageInstall: () => { },
        },
    };
    const genAppDetails = applicationType[opts.applicationType];
    genAppDetails?.genFiles();
    genAppDetails?.packageInstall();
}
exports.default = appGenerator;
//# sourceMappingURL=app.js.map