/**
 * A fetch RequestInit compatible structure.
 */
export interface FetchRequestInit {
    body?: BodyInit | null;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    method?: string;
    signal?: AbortSignal | null;
    redirect?: RequestRedirect;
    integrity?: string;
    keepalive?: boolean;
    mode?: RequestMode;
    referrer?: string;
    window?: any;
}
/**
 * A fetch Request compatible structure.
 */
export interface FetchRequestLike {
    url: string;
    body: BodyInit;
    credentials?: RequestCredentials;
    method?: string;
    signal?: AbortSignal;
    redirect?: RequestRedirect;
}
//# sourceMappingURL=fetch.types.d.ts.map