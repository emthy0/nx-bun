"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importAndRegisterConverters = exports.getConverter = exports.registerConverter = void 0;
/** Cache for converters */
const converterCache = new Map();
/**
 * Registers a new converter in the conversion registry under the specified executor and target.
 *
 * @param registry - The current state of the conversion registry.
 * @param executor - The name of the executor, corresponding to `TargetConfiguration.executor`.
 * @param target - The name of the target, corresponding to the keys in `ProjectConfiguration.targets`.
 * @param converter - The converter function to register.
 * @template T - The type parameter that `ConverterType` will use.
 * @returns - The updated conversion registry.
 */
const registerConverter = (registry, executor, target, converter) => {
    if (!registry[executor]) {
        registry[executor] = {};
    }
    registry[executor][target] = converter;
    converterCache.set(`${executor}-${target}`, converter);
};
exports.registerConverter = registerConverter;
/**
 * Gets a converter from the cache or the registry
 * @param registry - The current state of the conversion registry.
 * @param executor - The name of the executor.
 * @param target - The name of the target.
 * @template T - The type parameter.
 * @returns - The converter function if it exists, undefined otherwise.
 */
const getConverter = (registry, executor, target) => {
    const key = `${executor}-${target}`;
    return converterCache.get(key) || registry[executor]?.[target];
};
exports.getConverter = getConverter;
/**
 * Imports and registers converters in parallel.
 * @param baseRegistry - The base conversion registry.
 * @param packages - The list of packages to import and register.
 * @returns - The updated conversion registry.
 */
async function importAndRegisterConverters(baseRegistry, packages) {
    try {
        await Promise.allSettled(packages.map((pkg) => loadAndRegisterConverters(pkg, baseRegistry)));
        return baseRegistry;
    }
    catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}
exports.importAndRegisterConverters = importAndRegisterConverters;
/**
 * Loads and registers converters for a given package.
 * @param pkg - The package to load converters from.
 * @param registry - The conversion registry to update.
 */
async function loadAndRegisterConverters(pkg, registry) {
    const convertersModule = await Promise.resolve(`${pkg}`).then(s => require(s));
    if (typeof convertersModule !== 'function') {
        throw new Error(`convertersModule in package "${pkg}" is not a function`);
    }
    const newConverters = convertersModule();
    if (!isConversionRegistry(newConverters)) {
        throw new Error(`newConverters in package "${pkg}" is not of type ConversionRegistry`);
    }
    const executors = Object.keys(newConverters);
    for (let i = 0; i < executors.length; i++) {
        const executor = executors[i];
        const targets = Object.keys(newConverters[executor]);
        for (let j = 0; j < targets.length; j++) {
            const target = targets[j];
            (0, exports.registerConverter)(registry, executor, target, newConverters[executor][target]);
        }
    }
}
/**
 * Checks if a given object is a valid ConversionRegistry.
 * @param obj - The object to check.
 * @returns - True if the object is a ConversionRegistry, false otherwise.
 */
function isConversionRegistry(obj) {
    if (typeof obj !== 'object' || obj === null)
        return false;
    for (const executor in obj) {
        if (typeof obj[executor] !== 'object')
            return false;
        const converters = obj[executor];
        for (const converter in converters) {
            if (typeof converters[converter] !== 'function')
                return false;
        }
    }
    return true;
}
//# sourceMappingURL=utlis.js.map