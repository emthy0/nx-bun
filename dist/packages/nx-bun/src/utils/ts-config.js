"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTsConfig = void 0;
const devkit_1 = require("@nx/devkit");
const js_1 = require("@nx/js");
function updateTsConfig(tree, options) {
    const rootTsConfig = (0, js_1.getRootTsConfigPathInTree)(tree);
    const newPaths = options?.entryPoints?.map((entry) => entry.startsWith('./') ? entry.slice(2) : entry);
    if (!tree.exists(rootTsConfig)) {
        (0, devkit_1.writeJson)(tree, rootTsConfig, {
            compileOnSave: false,
            compilerOptions: {
                rootDir: '.',
                sourceMap: true,
                declaration: false,
                moduleResolution: 'node',
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                importHelpers: true,
                target: 'ES2021',
                module: 'ES2022',
                lib: ['es2020', 'dom'],
                types: ['bun-types', 'node'],
                esModuleInterop: true,
                forceConsistentCasingInFileNames: true,
                strict: true,
                skipLibCheck: true,
                skipDefaultLibCheck: true,
                baseUrl: '.',
                paths: options?.importPath && newPaths
                    ? {
                        [options.importPath]: newPaths,
                    }
                    : {},
            },
            exclude: ['node_modules', 'tmp'],
        });
        return;
    }
    if (options) {
        (0, devkit_1.updateJson)(tree, rootTsConfig, (json) => {
            json.compilerOptions.paths = json.compilerOptions?.paths || {};
            if (json.compilerOptions.paths[options.importPath]) {
                throw new Error((0, devkit_1.stripIndents) `Import path already exists in ${rootTsConfig} for ${options.importPath}.
    You can specify a different import path using the --import-path option.
    The value needs to be unique and not already used in the ${rootTsConfig} file.`);
            }
            json.compilerOptions.paths[options.importPath] = newPaths;
            return json;
        });
    }
}
exports.updateTsConfig = updateTsConfig;
//# sourceMappingURL=ts-config.js.map