// FormData type declarations for Node.js environment
declare global {
  interface FormData {
    get(name: string): FormDataEntryValue | null;
    getAll(name: string): FormDataEntryValue[];
    has(name: string): boolean;
    set(name: string, value: string | Blob): void;
    append(name: string, value: string | Blob): void;
    delete(name: string): void;
    entries(): IterableIterator<[string, FormDataEntryValue]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<FormDataEntryValue>;
    [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
  }
}

export {};
