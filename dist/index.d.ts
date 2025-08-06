export interface InitOptions {
    api_key: string;
    org_name: string;
    app_ver?: string;
    base_url?: string;
    device_tag?: string;
    add_error_handler?: boolean;
    errorLog?: (...args: any[]) => void;
}
export interface EventProps {
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
    network?: string;
    channel?: string;
    group_tag?: string;
    from_tag?: string;
    type?: string;
    event_index?: number;
    event_datetime?: string;
    to_list?: string[];
}
export interface EconomyEventProps extends EventProps {
    spend_currency: string;
    spend_amount: number;
    spend_type?: string;
}
export interface MessageSendEventProps extends EventProps {
    from_tag: string;
    to_tag?: string;
    to_list?: string[];
}
export interface LogEventProps {
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
interface InternalEvent extends EventProps {
    event_index: number;
    event_datetime: string;
    type: string;
}
declare function init(opts: InitOptions): void;
declare function isReady(): boolean;
declare function getDeviceTag(): string | false;
declare function addUserTag(userTag: string | null | undefined): void;
declare function event(props: EventProps): InternalEvent;
declare function economyEvent(props: EconomyEventProps): InternalEvent;
declare function messageSendEvent(props: MessageSendEventProps): InternalEvent;
declare function log(...args: any[]): LogEventProps;
declare function logEvent(props: LogEventProps): LogEventProps;
declare function flush(): void;
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
};
export default DataCortex;
