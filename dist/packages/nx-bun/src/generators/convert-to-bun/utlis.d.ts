import { Tree, TargetConfiguration } from '@nx/devkit';
import { ConvertToBunGeneratorSchema } from './schema';
/**
 * Type for a converter function
 * @template T - The type parameter for the target configuration
 */
export type ConverterType<T = any> = (tree: Tree, options: ConvertToBunGeneratorSchema, targetConfiguration: TargetConfiguration<T>) => void | Promise<void>;
/**
 * A type representing a mapping from target names to converter functions.
 * This corresponds to the keys in `ProjectConfiguration.targets`.
 *
 * @template T - The type parameter that `ConverterType` will use.
 */
export type SupportedConversion<T = any> = Record<string, ConverterType<T>>;
/**
 * A type representing a mapping from executor names to supported conversions.
 * This corresponds to the `executor` property in `TargetConfiguration`.
 *
 * @template T - The type parameter that `SupportedConversion` will use.
 */
export type ConversionRegistry<T = any> = Record<string, SupportedConversion<T>>;
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
export declare const registerConverter: <T>(registry: ConversionRegistry<T>, executor: string, target: string, converter: ConverterType<T>) => void;
/**
 * Gets a converter from the cache or the registry
 * @param registry - The current state of the conversion registry.
 * @param executor - The name of the executor.
 * @param target - The name of the target.
 * @template T - The type parameter.
 * @returns - The converter function if it exists, undefined otherwise.
 */
export declare const getConverter: <T>(registry: ConversionRegistry<T>, executor: string, target: string) => ConverterType<T>;
/**
 * Imports and registers converters in parallel.
 * @param baseRegistry - The base conversion registry.
 * @param packages - The list of packages to import and register.
 * @returns - The updated conversion registry.
 */
export declare function importAndRegisterConverters(baseRegistry: ConversionRegistry, packages: string[]): Promise<ConversionRegistry>;
