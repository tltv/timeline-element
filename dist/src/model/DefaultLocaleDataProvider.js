import { formatInTimeZone } from 'date-fns-tz';
export class DefaultLocaleDataProvider {
    constructor(locale, timeZone, firstDayOfWeek, twelveHourClock) {
        this.locale = "en-US";
        this.timeZone = "Europe/London";
        this.twelveHourClock = false;
        this.firstDayOfWeek = 1; // sunday
        this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.weekDayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this._offsetCache = new Map();
        this.locale = locale;
        this.timeZone = timeZone;
        this.firstDayOfWeek = firstDayOfWeek;
        this.twelveHourClock = twelveHourClock;
        this.browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    getMonthNames() {
        return this.monthNames;
    }
    getWeekdayNames() {
        return this.weekDayNames;
    }
    getFirstDayOfWeek() {
        return this.firstDayOfWeek;
    }
    formatDate(date, pattern) {
        return formatInTimeZone(date, this.getTimeZone(), pattern);
    }
    formatTime(date, pattern) {
        // formatInTimeZone is not working in all cases (date-fns-tz 2.0.0). 
        // E.g. following returns wrong hour when run in Browser with "Europe/Helsinki" timezone: 
        // console.log(formatInTimeZone(new Date("2020-03-29T01:00:00Z"), "Europe/Berlin", "HH:mm:ss XXX"));
        //  Returns "04:00:00 +02:00". Should be "03:00:00 +02:00".
        return formatInTimeZone(date, this.getTimeZone(), pattern);
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
        return this._getDaylightAdjustment(zonedDate, this.getTimeZone());
    }
    _getDaylightAdjustment(zonedDate, timezone) {
        let fullYear = zonedDate.getFullYear();
        let janOffset = this._getOffset(fullYear, "01", this._offsetCache, timezone);
        let julOffset = this._getOffset(fullYear, "07", this._offsetCache, timezone);
        if (janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let targetOffset = this._getTimezoneOffset(zonedDate, timezone);
            if (targetOffset < maxOffset) {
                // This is Daylight saving time
                let minOffset = Math.min(janOffset, julOffset);
                return maxOffset - minOffset;
            }
        }
        return 0;
    }
    _getDaylightSavingTime(fullYear, timezone) {
        let janOffset = this._getOffset(fullYear, "01", this._offsetCache, timezone);
        let julOffset = this._getOffset(fullYear, "07", this._offsetCache, timezone);
        if (janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let minOffset = Math.min(janOffset, julOffset);
            return maxOffset - minOffset;
        }
        return 0;
    }
    isDaylightTime(zonedDate) {
        let fullYear = zonedDate.getFullYear();
        let janOffset = this._getOffset(fullYear, "01", this._offsetCache, this.getTimeZone());
        let julOffset = this._getOffset(fullYear, "07", this._offsetCache, this.getTimeZone());
        if (janOffset !== julOffset) {
            let maxOffset = Math.max(janOffset, julOffset);
            let targetOffset = this.getTimezoneOffset(zonedDate);
            return targetOffset < maxOffset;
        }
        return false;
    }
    getTimezoneOffset(zonedDate) {
        return this._getTimezoneOffset(zonedDate, this.getTimeZone());
    }
    _getTimezoneOffset(zonedDate, timezone) {
        let offset = formatInTimeZone(zonedDate, timezone, "xxx"); // like "+01:00"
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
    _getOffset(fullYear, month, cache, timezone) {
        const key = `${fullYear}-${month}-${timezone}`;
        if (!cache.has(key)) {
            let targetDate = new Date(`${fullYear}-${month}-01T00:00:00Z`);
            cache.set(key, this._getTimezoneOffset(targetDate, timezone));
        }
        return cache.get(key);
    }
}
//# sourceMappingURL=DefaultLocaleDataProvider.js.map