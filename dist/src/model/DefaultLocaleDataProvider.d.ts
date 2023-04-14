import { ILocaleDataProvider } from './ILocaleDataProvider';
export declare class DefaultLocaleDataProvider implements ILocaleDataProvider {
    locale: string;
    timeZone: string;
    twelveHourClock: boolean;
    firstDayOfWeek: number;
    monthNames: string[];
    weekDayNames: string[];
    browserTimeZone: string;
    _offsetCache: Map<string, number>;
    constructor(locale: string, timeZone: string, firstDayOfWeek: number, twelveHourClock: boolean);
    getMonthNames(): string[];
    getWeekdayNames(): string[];
    getFirstDayOfWeek(): number;
    formatDate(date: Date, pattern: string): string;
    formatTime(date: Date, pattern: string): string;
    isTwelveHourClock(): boolean;
    getLocale(): string;
    getTimeZone(): string;
    getDaylightAdjustment(zonedDate: Date): number;
    _getDaylightAdjustment(zonedDate: Date, timezone: string): number;
    _getDaylightSavingTime(fullYear: number, timezone: string): number;
    isDaylightTime(zonedDate: Date): boolean;
    getTimezoneOffset(zonedDate: Date): number;
    _getTimezoneOffset(zonedDate: Date, timezone: string): number;
    _getOffset(fullYear: number, month: string, cache: Map<string, number>, timezone: string): number;
}
