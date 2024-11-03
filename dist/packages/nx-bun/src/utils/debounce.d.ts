export type DebounceFunction<TArgs extends any[]> = {
    (...args: TArgs): void;
    /**
     * Cancels the debounced function
     */
    cancel(): void;
    /**
     * Checks if there is any invocation debounced
     */
    isPending(): boolean;
    /**
     * Runs the debounced function immediately
     */
    flush(...args: TArgs): void;
};
export declare const debounce: <TArgs extends any[]>({ delay }: {
    delay: number;
}, func: (...args: TArgs) => any) => DebounceFunction<TArgs>;
