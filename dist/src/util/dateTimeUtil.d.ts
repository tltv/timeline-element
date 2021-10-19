export declare class DateTimeConstants {
    static readonly DAYS_IN_WEEK: number;
    static readonly HOURS_IN_DAY: number;
    static readonly DAY_INTERVAL: number;
    static readonly HOUR_INTERVAL: number;
}
export declare function atEndOfDay(date: Date): Date;
export declare function atStartOfDay(date: Date): Date;
export declare function atEndOfHour(date: Date): Date;
export declare function atStartOfHour(date: Date): Date;
/** Clears Daylight saving time adjustment from the given time. */
export declare function toNormalDate(zonedDate: Date, adjustment: number): Date;
export declare function adjustToMiddleOfDay(zonedDate: Date, timeZone: string): Date;
export declare function getDSTAdjustedDate(previousIsDST: boolean, zonedDate: Date, dstAdjustment: number): Date;
