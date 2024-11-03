/// <reference types="bun-types" />
/// <reference types="node" />
import type { SpawnOptions, Subprocess } from 'bun';
import { ChildProcess } from 'node:child_process';
type ExecOptions = BunExecOptions | NodeExecOptions;
type BunExecOptions = {
    cwd?: string;
    stdin?: SpawnOptions.Readable;
    stdout?: SpawnOptions.Writable;
    stderr?: SpawnOptions.Writable;
};
type NodeExecOptions = {
    cwd?: string;
    stdio?: 'inherit' | 'pipe';
};
export type UnifiedChildProcess = ChildProcess | Subprocess<any, any, any>;
export declare function isBunSubprocess(process: UnifiedChildProcess): process is Subprocess<any, any, any>;
export declare function assertBunAvailable(forceInstall?: boolean): Promise<boolean>;
export declare function getBunVersion(): Promise<string | null>;
export declare function executeCliAsync(args: string[], options?: ExecOptions): Promise<UnifiedChildProcess>;
export declare function executeCliWithLogging(args: string[], options?: ExecOptions): Promise<boolean>;
export {};
