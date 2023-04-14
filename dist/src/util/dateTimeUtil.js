import { formatInTimeZone } from 'date-fns-tz';
export class DateTimeConstants {
}
DateTimeConstants.DAYS_IN_WEEK = 7;
DateTimeConstants.HOURS_IN_DAY = 24;
DateTimeConstants.DAY_INTERVAL = 24 * 60 * 60 * 1000;
DateTimeConstants.HOUR_INTERVAL = 60 * 60 * 1000;
export function atEndOfDay(date) {
    let endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
}
export function atStartOfDay(date) {
    let startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
}
export function atEndOfHour(date) {
    let endOfHour = new Date(date);
    endOfHour.setMinutes(59, 59, 999);
    return endOfHour;
}
export function atStartOfHour(date) {
    let startOfHour = new Date(date);
    startOfHour.setMinutes(0, 0, 0);
    return startOfHour;
}
/** Clears Daylight saving time adjustment from the given time. */
export function toNormalDate(zonedDate, adjustment) {
    return new Date(zonedDate.getTime() - adjustment);
}
export function adjustToMiddleOfDay(zonedDate, timeZone) {
    let hourStr = formatInTimeZone(zonedDate, timeZone, "HH");
    let h = parseInt(hourStr);
    let addHours = 12 - h;
    return new Date(zonedDate.getTime() + (addHours * DateTimeConstants.HOUR_INTERVAL));
}
export function getDSTAdjustedDate(previousIsDST, zonedDate, dstAdjustment) {
    // adjusts previously without dst adjusted date by dst
    // ((date + interval) - dst )
    // Note! intervals that are less or equal to dst are not supported
    // currently.
    let isDST = dstAdjustment > 0;
    if (previousIsDST && !isDST) {
        // previously added interval is shorter than the real interval.
        // with 24h interval and 1h dst: real interval is 25h.
        return new Date(zonedDate.getTime() + dstAdjustment);
    }
    else if (!previousIsDST && isDST) {
        // previously added interval is longer than the real interval.
        // with 24h interval and 1h dst: real interval is 23h.
        return new Date(zonedDate.getTime() - dstAdjustment);
    }
    return zonedDate;
}
//# sourceMappingURL=dateTimeUtil.js.map