declare module 'pagedjs' {
    export class Previewer {
        constructor();
        preview(content: string | Element, css: string | string[], renderTo: Element): Promise<any>;
        registerHandlers(handlers: any[]): void;
    }

    export class Polisher {
        constructor();
    }

    export class Chunker {
        constructor();
    }

    export class Handler {
        constructor(chunker: any, polisher: any, caller: any);
    }
}

declare module 'pagedjs/dist/paged.esm.js' {
    export * from 'pagedjs';
}

declare module '@/lib/paged.esm.js' {
    export * from 'pagedjs';
}
