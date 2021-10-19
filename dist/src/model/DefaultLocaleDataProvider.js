import { format } from 'date-fns-tz';
export class DefaultLocaleDataProvider {
    constructor(locale, timeZone, firstDayOfWeek, twelveHourClock) {
        this.locale = "en-US";
        this.timeZone = "Europe/London";
        this.twelveHourClock = false;
        this.firstDayOfWeek = 1; // sunday
        this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.weekDayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this.locale = locale;
        this.timeZone = timeZone;
        this.firstDayOfWeek = firstDayOfWeek;
        this.twelveHourClock = twelveHourClock;
    }
    getMonthNames() {
        return this.monthNames;
    }
    getWeekdayNames() {
        return this.weekDayNames;
    }
    getFirstDayOfWeek() {
        return this.firstDayOfWeek + 1;
    }
    formatDate(date, pattern) {
        return format(date, pattern, { timeZone: this.getTimeZone() });
    }
    isTwelveHourClock() {
        return this.twelveHourClock;
    }
    getLocale() {
        return this.locale;
    }
    getTimeZone() {
        return this.timeZone;
    }
    getDaylightAdjustment(zonedDate) {
        let jan = new Date(`${zonedDate.getFullYear()}-01-01T00:00:00Z`);
        let jul = new Date(`${zonedDate.getFullYear()}-07-01T00:00:00Z`);
        let janOffset = this.getTimezoneOffset(jan);
        let julOffset = this.getTimezoneOffset(jul);
        if (janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let targetOffset = this.getTimezoneOffset(zonedDate);
            if (targetOffset < maxOffset) {
                // This is Daylight saving time
                let minOffset = Math.min(janOffset, julOffset);
                return maxOffset - minOffset;
            }
        }
        return 0;
    }
    isDaylightTime(zonedDate) {
        let jan = new Date(`${zonedDate.getFullYear()}-01-01T00:00:00Z`);
        let jul = new Date(`${zonedDate.getFullYear()}-07-01T00:00:00Z`);
        let janOffset = this.getTimezoneOffset(jan);
        let julOffset = this.getTimezoneOffset(jul);
        if (janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let targetOffset = this.getTimezoneOffset(zonedDate);
            return targetOffset < maxOffset;
        }
        return false;
    }
    getTimezoneOffset(zonedDate) {
        let offset = format(zonedDate, "xxx", { timeZone: this.getTimeZone() }); // like "+01:00"
        if (offset && offset.length === 6) {
            let hour = offset[1] + offset[2];
            if (hour === '24') {
                hour = '00';
            }
            let tzOffset = (parseInt(hour) * 60) + parseInt(offset[4] + offset[5]);
            if (offset[0] === '-') {
                tzOffset = -1 * tzOffset;
            }
            return tzOffset * 60000;
        }
        return 0;
    }
}
//# sourceMappingURL=DefaultLocaleDataProvider.js.map