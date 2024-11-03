"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProjectFromScript = void 0;
const devkit_1 = require("@nx/devkit");
function addProjectFromScript(host, opts, file, type) {
    const targets = {};
    if (type === 'serve') {
        targets.build = {
            executor: '@nx-bun/nx:build',
            outputs: ['{options.outputPath}'],
            options: {
                entrypoints: [(0, devkit_1.joinPathFragments)(opts.projectRoot, file)],
                outputPath: (0, devkit_1.joinPathFragments)('dist', opts.projectRoot ? opts.name : opts.projectRoot, file),
                bun: false,
                smol: false,
            },
        };
        if (opts.type === 'application') {
            targets.serve = {
                executor: '@nx-bun/nx:run',
                defaultConfiguration: 'development',
                options: {
                    buildTarget: `${opts.projectName}:build`,
                    watch: true,
                    hot: true,
                    bun: true,
                    smol: false,
                },
            };
        }
    }
    const filePaths = file.split('/');
    const project = {
        root: opts.projectRoot,
        sourceRoot: (0, devkit_1.joinPathFragments)(opts.projectRoot, filePaths.length > 1 ? filePaths[0] : ''),
        projectType: opts.type,
        targets,
        tags: [],
    };
    (0, devkit_1.addProjectConfiguration)(host, opts.projectName, project, true);
}
exports.addProjectFromScript = addProjectFromScript;
//# sourceMappingURL=add-project.js.map