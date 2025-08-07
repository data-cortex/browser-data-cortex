interface InitOptions {
    apiKey: string;
    orgName: string;
    appVer?: string;
    baseUrl?: string;
    deviceTag?: string;
    addErrorHandler?: boolean;
    errorLog?: (...args: unknown[]) => void;
}
interface EventProps {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
    float1?: number;
    float2?: number;
    float3?: number;
    float4?: number;
    group_tag?: string;
    event_index?: number;
    event_datetime?: string;
}
interface EconomyEventProps extends EventProps {
    spend_currency: string;
    spend_amount: number;
    spend_type?: string;
}
interface MessageSendEventProps extends EventProps {
    network?: string;
    channel?: string;
    from_tag: string;
    to_tag?: string;
    to_list?: string[];
}
interface LogEventProps {
    log_line?: string;
    hostname?: string;
    filename?: string;
    log_level?: string;
    device_tag?: string;
    user_tag?: string;
    remote_address?: string;
    event_datetime?: string;
    repsonse_bytes?: number;
    response_ms?: number;
}
declare function init(opts: InitOptions): void;
declare function isReady(): boolean;
declare function getDeviceTag(): string | null;
declare function addUserTag(userTag: string | null): void;
declare function event(props: EventProps): void;
declare function economyEvent(props: EconomyEventProps): void;
declare function messageSendEvent(props: MessageSendEventProps): void;
declare function logEvent(props: LogEventProps): void;
declare function log(...args: unknown[]): void;
declare function flush(): Promise<void>;
declare function destroy(): void;
declare const DataCortex: {
    init: typeof init;
    isReady: typeof isReady;
    getDeviceTag: typeof getDeviceTag;
    addUserTag: typeof addUserTag;
    event: typeof event;
    economyEvent: typeof economyEvent;
    messageSendEvent: typeof messageSendEvent;
    log: typeof log;
    logEvent: typeof logEvent;
    flush: typeof flush;
    destroy: typeof destroy;
};

export { addUserTag, DataCortex as default, destroy, economyEvent, event, flush, getDeviceTag, init, isReady, log, logEvent, messageSendEvent };
export type { EconomyEventProps, EventProps, InitOptions, LogEventProps, MessageSendEventProps };
