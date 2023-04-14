import { LitElement, nothing } from 'lit';
import { Resolution } from './model/Resolution';
import { Weekday } from './model/Weekday';
import { BlockRowData } from './model/blockRowData';
import { ILocaleDataProvider } from './model/ILocaleDataProvider';
import { IResolutionBlockFiller } from './model/IResolutionBlockFiller';
import { IResolutionBlockRegisterer } from './model/IResolutionBlockRegisterer';
/**
 * Scalable timeline web component that supports more than one
 * resolutions ({@link Resolution}). When timeline element doesn't overflow
 * horizontally in it's parent element, it scales the content width up to fit in
 * the space available.
 * <p>
 * When this component scales up, all widths are calculated as percentages.
 * Pixel widths are used otherwise. Some browsers may not support percentages
 * accurately enough, and for those it's best to call
 * {@link #setAlwaysCalculatePixelWidths(boolean)} with 'true' to disable
 * percentage values.
 * <p>
 * There's always a minimum width calculated and updated to the timeline
 * element. Percentage values set some limitation for the component's width.
 * Wider the component (&gt; 4000px), bigger the chance to get year, month and
 * date blocks not being vertically in-line with each others.
 * <p>
 * Supports setting a scroll left position.
 * <p>
 * After construction, attach the component to it's parent and call update
 * method with a required parameters and the timeline is ready. After that, all
 * widths are calculated and all other API methods available can be used safely.
 *
 */
export declare class TimelineElement extends LitElement {
    private static readonly STYLE_ROW;
    private static readonly STYLE_COL;
    private static readonly STYLE_MONTH;
    private static readonly STYLE_YEAR;
    private static readonly STYLE_DAY;
    private static readonly STYLE_WEEK;
    private static readonly STYLE_RESOLUTION;
    private static readonly STYLE_EVEN;
    private static readonly STYLE_WEEKEND;
    private static readonly STYLE_SPACER;
    private static readonly STYLE_FIRST;
    private static readonly STYLE_CENTER;
    private static readonly STYLE_LAST;
    private static readonly STYLE_MEASURE;
    private readonly resolutionWeekDayblockWidth;
    resolution: Resolution;
    startDateTime: string;
    endDateTime: string;
    /** Start Date of the timeline. Native Date object can be in "wrong" time zone, as it matches browser's time zone. */
    internalInclusiveStartDateTime: Date;
    /** End Date of the timeline. */
    internalInclusiveEndDateTime: Date;
    /** Timezone for date and time formatting. Doesn't match with actual start and end Date object's time zone. */
    timeZone: string;
    locale: string;
    firstDayOfWeek: number;
    twelveHourClock: boolean;
    minWidth: number;
    normalStartDate: Date;
    normalEndDate: Date;
    lastDayOfWeek: number;
    firstDayOfRange: number;
    firstHourOfRange: number;
    scrollContainerId: string;
    monthRowVisible: boolean;
    yearRowVisible: boolean;
    monthNames: string[];
    weekdayNames: string[];
    private localeDataProvider;
    private blocksInRange;
    private resolutionBlockCount;
    private firstResBlockCount;
    private lastResBlockCount;
    private firstDay;
    private timelineOverflowingHorizontally;
    private monthFormat;
    private yearFormat;
    private weekFormat;
    private dayFormat;
    resolutionDiv: HTMLDivElement;
    private resSpacerDiv;
    private spacerBlocks;
    private yearRowData;
    private monthRowData;
    private dayRowData;
    private dayWidthPercentage;
    private dayOrHourWidthPx;
    private resBlockMinWidthPx;
    private resBlockWidthPx;
    private resBlockWidthPercentage;
    private minResolutionWidth;
    private calcPixels;
    private positionLeft;
    private setPositionForEachBlock;
    private firstWeekBlockHidden;
    private ie;
    private lazyResolutionPaint;
    private directlyInsideScrollContainer;
    private scrollHandler;
    private scrollContainer;
    private previousContainerScrollLeft;
    private previousContainerScrollTop;
    connectedCallback(): void;
    disconnectedCallback(): void;
    static get styles(): import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    yearBlocks(): typeof nothing | import("lit-html").TemplateResult<1>[];
    monthBlocks(): typeof nothing | import("lit-html").TemplateResult<1>[];
    dayBlocks(): typeof nothing | import("lit-html").TemplateResult<1>[];
    shouldUpdate(changedProperties: any): any;
    willUpdate(changedProps: any): void;
    protected updated(changedProps: any): void;
    /**
     * <p>
     * Updates the content of this component. Builds the time-line and calculates
     * width and heights for the content (calls in the end
     * {@link #updateWidths()}). This should be called explicitly. Otherwise the
     * component will be empty.
     * <p>
     * Date values should always follow specification in {@link Date#getTime()}.
     * Start and end date is always required.
     *
     * @param resolution
     *            Resolution enum (not null)
     * @param startDate
     *            Time-line's start date. (inclusive; not null)
     * @param endDate
     *            Time-line's end date. (inclusive; not null)
     * @param localeDataProvider
     *            Data provider for locale specific data. month names, first day
     *            of week etc.
     *
     */
    updateTimeLine(resolution: Resolution, startDate: Date, endDate: Date, localeDataProvider: ILocaleDataProvider): void;
    resetDateRange(startDate: Date, endDate: Date): void;
    registerScrollHandler(): void;
    setupScrollContainer(): HTMLElement | Window;
    clear(): void;
    calculateResolutionMinWidth(): number;
    registerHourResolutionBlock(): void;
    registerDayResolutionBlock(): void;
    registerWeekResolutionBlock(index: number, weekDay: Weekday, lastBlock: boolean, firstWeek: boolean): void;
    timelineBlocks(rowData: BlockRowData, style: string): import("lit-html").TemplateResult<1>[];
    /**
   * Returns true if Widget is set to calculate widths by itself. Default is
   * false.
   *
   * @return
   */
    isAlwaysCalculatePixelWidths(): boolean;
    createSpacerBlock(className: string): HTMLDivElement;
    /** Clears Daylight saving time adjustment from the given time. */
    toNormalDate(zonedDate: Date): Date;
    getDSTAdjustedDate(previousIsDST: boolean, zonedDate: Date): Date;
    getParentElement(node: any): any;
    getDay(date: Date): string;
    getYear(date: Date): string;
    getMonth(date: Date): number;
    isWeekEnd(dayCounter: number): boolean;
    key(prefix: string, rowData: BlockRowData): string;
    newKey(prefix: string, rowData: BlockRowData): string;
    addBlock(current: string, target: string, date: Date, rowData: BlockRowData, operation: (target: string, value: string, date: Date) => void): string;
    addDayBlock(currentDay: string, date: Date): string;
    addMonthBlock(currentMonth: string, date: Date): string;
    addYearBlock(currentYear: string, date: Date): string;
    addMonthBlockElement(key: string, text: string): void;
    addYearBlockElement(key: string, text: string): void;
    addDayBlockElement(key: string, text: string): void;
    createTimelineBlock(key: string, text: string, styleSuffix: string, rowData: BlockRowData): HTMLDivElement;
    formatDayCaption(day: string, date: Date): string;
    formatYearCaption(year: string, date: Date): string;
    formatWeekCaption(date: Date): string;
    formatMonthCaption(month: number, date: Date): string;
    getWeekday(dayCounter: number): Weekday;
    prepareTimelineForHourResolution(startDate: Date, endDate: Date): void;
    prepareTimelineForHour(interval: number, startDate: Date, endDate: Date, resBlockRegisterer: IResolutionBlockRegisterer): void;
    prepareTimelineForDayOrWeekResolution(startDate: Date, endDate: Date): void;
    prepareTimelineForDayOrWeek(interval: number, startDate: Date, endDate: Date, resBlockRegisterer: IResolutionBlockRegisterer): void;
    isDayRowVisible(): boolean;
    /**
   * Get actual width of the timeline.
   *
   * @return
   */
    getResolutionWidth(): number;
    /**
   * Calculate the exact width of the timeline. Excludes any spacers in the
   * end.
   *
   * @return
   */
    calculateTimelineWidth(): number;
    private getResolutionDivWidth;
    /**
   * Calculate matching left offset in percentage for a date (
   * {@link Date#getTime()}).
   *
   * @param date
   *            Target date in milliseconds.
   * @param contentWidth
   *            Width of the content that the given 'date' is relative to.
   * @return Left offset in percentage.
   */
    getLeftPositionPercentageForDate(date: Date, contentWidth: number): number;
    /**
     * Calculate CSS value for 'left' property matching left offset in
     * percentage for a date ( {@link Date#getTime()}).
     * <p>
     * May return '2.123456%' or 'calc(2.123456%)' if IE;
     *
     * @param date
     *            Target date in milliseconds.
     * @param contentWidth
     *            Width of the content that the given 'date' is relative to.
     * @return Left offset as a String value.
     */
    getLeftPositionPercentageStringForDate(date: Date, contentWidth: number): string;
    getLeftPositionPercentageStringForDateRange(date: Date, rangeWidth: number, rangeStartDate: Date, rangeEndDate: Date): string;
    /**
     * Calculate CSS value for 'width' property matching date interval inside
     * the time-line. Returns percentage value. Interval is in milliseconds.
     * <p>
     * May return '2.123456%' or 'calc(2.123456%)' if IE;
     *
     * @param interval
     *            Date interval in milliseconds.
     * @return
     */
    getWidthPercentageStringForDateInterval(interval: number): string;
    /** @see #getWidthPercentageStringForDateInterval(long) */
    getWidthPercentageStringForDateIntervalForRange(interval: number, range: number): string;
    /**
     * Calculate matching left offset in pixels for a date (
     * {@link Date#getTime()}).
     *
     * @param date
     *            Target date in milliseconds.
     * @return Left offset in pixels.
     */
    getLeftPositionForDate(date: Date): number;
    getLeftPositionForDateRange(date: Date, rangeWidth: number, rangeStartDate: Date, rangeEndDate: Date): number;
    /**
     * Calculate matching date ({@link Date#getTime()}) for the target left
     * pixel offset.
     *
     * @param left
     *            Left offset in pixels.
     * @return Date in a milliseconds or null if timeline width is invalid (<=0).
     */
    getDateForLeftPosition(left: number): Date;
    getDateForLeftPositionNoticeDST(left: number, noticeDST: boolean): Date;
    /**
     * Convert left position for other relative target width.
     *
     * @param left
     * @param contentWidthToConvertFor
     * @return
     */
    convertRelativeLeftPosition(left: number, contentWidthToConvertFor: number): number;
    adjustDateRangeByDST(range: number): number;
    /**
     * Set horizontal scroll position for the time-line.
     *
     * @param left
     *            Scroll position in pixels.
     */
    setScrollLeft(left: number): void;
    /**
     * Re-calculates required widths for this widget.
     * <p>
     * Re-creates and fills the visible part of the resolution element.
     */
    updateWidths(): void;
    updateBlockWidths(rowData: BlockRowData): void;
    updateSpacerBlocks(dayWidthPx: number): void;
    hideSpacerBlocks(): void;
    /**
     * Set minimum width (pixels) of this widget's root DIV element. Default is
     * -1. Notice that
     * {@link #update(Resolution, long, long, int, int, LocaleDataProvider)}
     * will calculate min-width and call this internally.
     *
     * @param minWidth
     *            Minimum width in pixels.
     */
    setMinWidth(minWidth: number): void;
    /**
     * Returns true if the timeline is overflowing the parent's width. This
     * works only when this widget is attached to some parent.
     *
     * @return True when timeline width is more than the parent's width (@see
     *         {@link Element#getClientWidth()}).
     */
    isTimelineOverflowingHorizontally(): boolean;
    /**
    * Update horizontal overflow state.
    */
    updateTimelineOverflowingHorizontally(): void;
    createTimelineElementsOnVisibleArea(): void;
    calculateMinimumResolutionBlockWidth(): number;
    createResolutionBlock(): HTMLDivElement;
    createHourResolutionBlock(): HTMLDivElement;
    createDayResolutionBlock(): HTMLDivElement;
    createWeekResolutionBlock(): HTMLDivElement;
    fillVisibleTimeline(): void;
    showResolutionBlocksOnView(): void;
    showAllResolutionBlocks(): void;
    fillTimelineForResolution(startDate: Date, endDate: Date, left: number): void;
    isFirstResBlockShort(): boolean;
    isLastResBlockShort(): boolean;
    getScrollOverflowForResolutionBlock(positionLeftSnapshot: number, left: number, firstResBlockShort: boolean): number;
    getScrollOverflowForRegularResoultionBlock(positionLeftSnapshot: number, firstResBlockShort: boolean): number;
    getScrollOverflowForShortFirstResolutionBlock(positionLeftSnapshot: number): number;
    /**
     * Returns a width of the first resolution block.
     *
     * @return
     */
    getFirstResolutionElementWidth(): number;
    getFirstResolutionElement(): HTMLElement;
    getLastResolutionElement(): HTMLElement;
    containsResBlockSpacer(): boolean;
    removeResolutionSpacerBlock(): void;
    calculateDayOrHourResolutionBlockWidthPx(blockCount: number): number;
    calculateActualResolutionBlockWidthPx(dayOrHourBlockWidthPx: number): number;
    /**
   * Adjust left position for optimal position to detect accurate date with
   * the current resolution.
   */
    adjustLeftPositionForDateDetection(left: number): number;
    createCalcCssValue(v: number, multiplier: number): string;
    updateResolutionBlockWidths(pct: string): void;
    getWidth(multiplier: number): string;
    setWidth(element: HTMLElement, multiplier: number): void;
    setWidthPct(resBlockWidthPx: number, pct: string, element: HTMLElement): void;
    setCssPercentageWidth(element: HTMLElement, daysInRange: number, width: number, position: number): void;
    getCssPercentageWidth(daysInRange: number, width: number, position: number): string;
    setCssPercentageWidthFor(element: HTMLElement, nValue: number, pct: string): void;
    getPercentageWidthString(nValue: number, pct: string): string;
    getWidthStyleValue(pct: string): string;
    fillTimelineForHourResolution(startDate: Date, endDate: Date, left: number): void;
    fillTimelineForDayResolution(startDate: Date, endDate: Date, left: number): void;
    logIndexOutOfBounds(indexName: string, index: number, childCount: number): void;
    fillTimelineForHour(interval: number, startDate: Date, endDate: Date, resBlockFiller: IResolutionBlockFiller): void;
    fillTimelineForDayOrWeek(interval: number, startDate: Date, endDate: Date, resBlockFiller: IResolutionBlockFiller): void;
    isValidChildIndex(index: number, childCount: number): boolean;
    fillDayResolutionBlock(resBlock: HTMLDivElement, date: Date, index: number, weekend: boolean, left: number): void;
    fillWeekResolutionBlock(resBlock: HTMLDivElement, date: Date, index: number, weekDay: Weekday, firstWeek: boolean, lastBlock: boolean, left: number, even: boolean): void;
    fillHourResolutionBlock(resBlock: HTMLDivElement, date: Date, index: number, hourCounter: number, lastBlock: boolean, left: number, even: boolean): void;
}
