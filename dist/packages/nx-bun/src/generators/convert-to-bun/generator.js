"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToBunGenerator = void 0;
const devkit_1 = require("@nx/devkit");
const utlis_1 = require("./utlis");
const baseRegistry = {
    '@nx/js:tsc': {
        build: tscConveter,
    },
};
async function convertToBunGenerator(tree, options) {
    const projectConfiguration = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    const registry = options.customConversionRegistry?.length
        ? await (0, utlis_1.importAndRegisterConverters)(baseRegistry, options.customConversionRegistry)
        : baseRegistry;
    await updateProject(tree, options, projectConfiguration, registry);
    (0, devkit_1.updateProjectConfiguration)(tree, options.project, projectConfiguration);
}
exports.convertToBunGenerator = convertToBunGenerator;
async function updateProject(tree, options, projectConfiguration, registry) {
    const targets = options.targets || ['build'];
    // Parallelize the converter calls.
    const conversionPromises = targets.map(async (target) => {
        const targetConfiguration = projectConfiguration.targets[target];
        if (!targetConfiguration)
            return;
        const converter = (0, utlis_1.getConverter)(registry, targetConfiguration.executor, target);
        if (!converter)
            return;
        // Convert and ensure the result is a promise.
        await converter(tree, options, targetConfiguration);
    });
    await Promise.all(conversionPromises);
}
exports.default = convertToBunGenerator;
function tscConveter(tree, options, targetConfiguration) {
    targetConfiguration.executor = '@nx-bun/nx:build';
    targetConfiguration.options = {
        entrypoints: [targetConfiguration.options.main],
        outputPath: targetConfiguration.options.outputPath,
        tsConfig: targetConfiguration.options.tsConfig,
        smol: false,
        bun: true,
    };
}
//# sourceMappingURL=generator.js.map