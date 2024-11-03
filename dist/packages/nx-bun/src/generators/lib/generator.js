"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libGenerator = void 0;
const devkit_1 = require("@nx/devkit");
const path = require("path");
const project_name_and_root_utils_1 = require("@nx/devkit/src/generators/project-name-and-root-utils");
const js_1 = require("@nx/js");
const init_1 = require("../init/init");
const typescript_1 = require("typescript");
const add_import_1 = require("../../utils/add-import");
async function libGenerator(tree, options) {
    const opts = await normalizeOptions(tree, options);
    const tasks = [
        await (0, init_1.default)(tree, { bunNXRuntime: false, forceBunInstall: false }),
    ];
    if (opts.publishable === true && !opts.importPath) {
        throw new Error(`For publishable libs you have to provide a proper "--importPath" which needs to be a valid npm package name (e.g. my-awesome-lib or @myorg/my-lib)`);
    }
    (0, devkit_1.ensurePackage)('@nx/js', devkit_1.NX_VERSION);
    const jsLibraryGenerator = await Promise.resolve().then(() => require('@nx/js')).then((m) => m.libraryGenerator);
    const libraryInstall = await jsLibraryGenerator(tree, {
        ...options,
        name: options.name,
        includeBabelRc: opts.unitTestRunner !== 'bun' && opts.unitTestRunner !== 'none',
        importPath: options.importPath,
        testEnvironment: 'node',
        skipFormat: true,
        unitTestRunner: options.unitTestRunner === 'bun' ? 'none' : options.unitTestRunner,
    });
    tasks.push(libraryInstall);
    const entryPoints = [(0, devkit_1.joinPathFragments)(opts.projectRoot, 'src', 'index.ts')];
    createFiles(tree, opts);
    tasks.push(updateProject(tree, opts, entryPoints));
    await (0, devkit_1.formatFiles)(tree);
    return (0, devkit_1.runTasksInSerial)(...tasks);
}
exports.libGenerator = libGenerator;
async function normalizeOptions(tree, options) {
    if (options.publishable) {
        if (!options.importPath) {
            throw new Error(`For publishable libs you have to provide a proper "--importPath" which needs to be a valid npm package name (e.g. my-awesome-lib or @myorg/my-lib)`);
        }
    }
    const { projectName, names: projectNames, projectRoot, importPath, } = await (0, project_name_and_root_utils_1.determineProjectNameAndRootOptions)(tree, {
        name: options.name,
        projectType: 'library',
        directory: options.directory,
        importPath: options.importPath,
        rootProject: options.rootProject,
        projectNameAndRootFormat: options.projectNameAndRootFormat,
        callingGenerator: '@nx-bun/nx:lib',
    });
    const fileName = getCaseAwareFileName({
        fileName: options.simpleName
            ? projectNames.projectSimpleName
            : projectNames.projectFileName,
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
function createFiles(tree, options) {
    const templateOptions = {
        ...options,
        template: '',
        cliCommand: 'nx',
        offsetFromRoot: (0, devkit_1.offsetFromRoot)(options.projectRoot),
        baseTsConfig: (0, js_1.getRootTsConfigPathInTree)(tree),
    };
    (0, devkit_1.generateFiles)(tree, path.join(__dirname, 'files'), `${options.projectRoot}`, templateOptions);
    if (options.unitTestRunner === 'none') {
        tree.delete((0, devkit_1.joinPathFragments)(options.projectRoot, `./src/lib/${options.fileName}.spec.ts`));
    }
    else if (options.unitTestRunner === 'bun') {
        const file = (0, devkit_1.joinPathFragments)(options.projectRoot, `./src/lib/${options.fileName}.spec.ts`);
        const indexSource = tree.read(file, 'utf-8');
        if (indexSource !== null) {
            const indexSourceFile = (0, typescript_1.createSourceFile)(file, indexSource, typescript_1.ScriptTarget.Latest, true);
            const changes = (0, devkit_1.applyChangesToString)(indexSource, (0, add_import_1.addImport)(indexSourceFile, `import { expect, test, describe } from "bun:test";`));
            tree.write(file, changes);
        }
        if (!options.publishable) {
            tree.delete((0, devkit_1.joinPathFragments)(options.projectRoot, 'package.json'));
        }
    }
}
function updateProject(tree, options, entryPoints) {
    const project = (0, devkit_1.readProjectConfiguration)(tree, options.projectName);
    project.targets = project.targets || {};
    const build = {
        executor: '@nx-bun/nx:build',
        outputs: ['{options.outputPath}'],
        options: {
            entrypoints: entryPoints,
            outputPath: (0, devkit_1.joinPathFragments)('dist', options.projectRoot ? options.name : options.projectRoot),
            tsConfig: (0, devkit_1.joinPathFragments)(options.projectRoot, `tsconfig.lib.json`),
            smol: false,
            bun: true,
        },
    };
    project.targets['build'] = build;
    if (options.unitTestRunner === 'bun') {
        const test = {
            executor: '@nx-bun/nx:test',
            options: {
                smol: false,
                bail: true,
                bun: false,
            },
        };
        project.targets['test'] = test;
    }
    (0, devkit_1.updateProjectConfiguration)(tree, options.projectName, project);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => { };
}
exports.default = libGenerator;
//# sourceMappingURL=generator.js.map