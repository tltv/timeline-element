import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { ILocaleDataProvider } from './ILocaleDataProvider';

export class DefaultLocaleDataProvider implements ILocaleDataProvider {

    public locale: string = "en-US";
    public timeZone: string = "Europe/London";
    public twelveHourClock: boolean = false;
    public firstDayOfWeek: number = 1; // sunday
    public monthNames: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    public weekDayNames: string[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    _offsetCache: Map<string, number> = new Map();

    constructor(locale: string, timeZone: string, firstDayOfWeek: number, twelveHourClock: boolean) {
        this.locale = locale;
        this.timeZone = timeZone;
        this.firstDayOfWeek = firstDayOfWeek;
        this.twelveHourClock = twelveHourClock;
    }

    getMonthNames(): string[] {
        return this.monthNames;
    }
    getWeekdayNames(): string[] {
        return this.weekDayNames;
    }
    getFirstDayOfWeek(): number {
        return this.firstDayOfWeek;
    }
    formatDate(date: Date, pattern: string): string {
        return format(date, pattern, { timeZone: this.getTimeZone() });
    }
    isTwelveHourClock(): boolean {
        return this.twelveHourClock;
    }
    getLocale(): string {
        return this.locale;
    }
    getTimeZone(): string {
        return this.timeZone;
    }
    getDaylightAdjustment(zonedDate: Date): number {
        let fullYear = zonedDate.getFullYear();
        let janOffset = this._getOffset(fullYear, "01", this._offsetCache);
        let julOffset = this._getOffset(fullYear, "07", this._offsetCache);
        if(janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let targetOffset = this.getTimezoneOffset(zonedDate);
            if(targetOffset < maxOffset) {
                // This is Daylight saving time
                let minOffset = Math.min(janOffset, julOffset);
                return maxOffset - minOffset;
            }
        }
        return 0;
    }
    isDaylightTime(zonedDate: Date): boolean {
        let fullYear = zonedDate.getFullYear();
        let janOffset = this._getOffset(fullYear, "01", this._offsetCache);
        let julOffset = this._getOffset(fullYear, "07", this._offsetCache);
        if(janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let targetOffset = this.getTimezoneOffset(zonedDate);
            return targetOffset < maxOffset;
        }
        return false;
    }
    getTimezoneOffset(zonedDate: Date): number {
        let offset: string = format(zonedDate, "xxx", { timeZone: this.getTimeZone() }); // like "+01:00"
        if (offset && offset.length === 6) {
            let hour = offset[1] + offset[2];
            if(hour === '24') {
                hour = '00';
            }
            let tzOffset = (parseInt(hour) * 60) + parseInt(offset[4] + offset[5]);
            if (offset[0] === '-') {
                tzOffset = -1*tzOffset;
            }
            return tzOffset * 60000;
        }
        return 0;
    }
    _getOffset(fullYear: number, month: string, cache: Map<string, number>): number {
        const key = `${fullYear}-${month}`;
        if(!cache.get(key)) {
            let jan = new Date(`${fullYear}-${month}-01T00:00:00Z`);
            cache.set(key, this.getTimezoneOffset(jan));
        }
        return cache.get(key);
    }
}