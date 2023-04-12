var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TimelineElement_1;
import { LitElement, html, css, nothing } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { toDate } from 'date-fns-tz';
import { Resolution } from './model/Resolution';
import { Weekday } from './model/Weekday';
import { BlockRowData } from './model/blockRowData';
import * as DateUtil from './util/dateTimeUtil';
import { DateTimeConstants } from './util/dateTimeUtil';
import * as ElementUtil from './util/elementUtil';
import { DefaultLocaleDataProvider } from './model/DefaultLocaleDataProvider';
import { getISOWeek } from 'date-fns';
import { query } from 'lit-element/decorators.js';
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
let TimelineElement = TimelineElement_1 = class TimelineElement extends LitElement {
    constructor() {
        super(...arguments);
        this.resolutionWeekDayblockWidth = 4;
        this.resolution = Resolution.Day;
        this.timeZone = "Europe/London";
        this.locale = "en-US";
        this.firstDayOfWeek = 1; // sunday;
        this.twelveHourClock = false;
        this.monthRowVisible = true;
        this.yearRowVisible = true;
        /*
         * number of blocks in resolution range. Days for Day/Week resolution, Hours
         * for hour resolution..
         */
        this.blocksInRange = 0;
        /*
         * number of elements in resolution range. Same as blocksInRange for
         * Day/Hour resolution. blocksInRange / 7 for Week resolution.
         */
        this.resolutionBlockCount = 0;
        this.firstResBlockCount = 0;
        this.lastResBlockCount = 0;
        this.spacerBlocks = [];
        this.yearRowData = new BlockRowData();
        this.monthRowData = new BlockRowData();
        // days/daysLength are needed only with resolutions smaller than Day.
        this.dayRowData = new BlockRowData();
        /*
           * Currently active widths. Updated each time when timeline column widths
           * are updated.
           */
        this.dayWidthPercentage = 0;
        this.dayOrHourWidthPx = 0;
        this.resBlockMinWidthPx = 0;
        this.resBlockWidthPx = 0;
        this.resBlockWidthPercentage = 0;
        this.minResolutionWidth = -1;
        this.calcPixels = false;
        this.positionLeft = 0;
        this.setPositionForEachBlock = false;
        this.firstWeekBlockHidden = false;
        this.ie = false; // deprecated property
        /* directlyInsideScrollContainer:
            true: timeline element is a child element inside a container with scroll bar.
            false: timeline.style.left is adjusted by scrollHandler. */
        this.directlyInsideScrollContainer = true;
        this.previousContainerScrollLeft = 0;
        this.previousContainerScrollTop = 0;
    }
    connectedCallback() {
        super.connectedCallback();
        if (this.scrollContainer && this.scrollHandler) {
            this.scrollContainer.addEventListener('scroll', this.scrollHandler);
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.scrollContainer && this.scrollHandler) {
            this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        }
    }
    static get styles() {
        return css `
      :host {
        display: block;
        overflow: hidden;
        position: relative;
        
        --no-user-select: {
					-webkit-user-select: none;
					-khtml-user-select: none;
					-moz-user-select: none;
					-ms-user-select: none;
          user-select: none;
        }
      }
      :host([hidden]) {
        display: none;
      }
      
      .year,
			.month,
			.day {
				padding-left: 2px;
				text-overflow: ellipsis;
				white-space: nowrap;
		   	border-right: 1px solid #A9A9A9;
		    box-sizing: border-box;
		    -moz-box-sizing: border-box;
		    -webkit-box-sizing: border-box;
			}
			.year.spacer,
			.month.spacer,
			.day.spacer {
				padding-left: 0px;
			}

			.month:nth-of-type(even),
			.day:nth-of-type(even) {
			    background-color: #ddd;
			}
			.col.even {
			    background-color: #ccc;
			}

			.col {
        position: var(--timeline-col-position);
				left: var(--timeline-col-left);
				height: 100%;
				float: left;
				overflow: hidden;
				border-right: 1px solid #A9A9A9;
				background-color: var(--timeline-col-background-color, #ddd);
				font-size: var(--timeline-col-font-size, 10px);
				text-align: center;
				box-sizing: border-box;
				-moz-box-sizing: border-box;
				-webkit-box-sizing: border-box;
				-webkit-touch-callout: none;
				@apply --no-user-select;
			}

      .c-col {
				width: var(--timeline-col-center-width);
			}

			.f-col {
				width: var(--timeline-col-first-width);
			}

			.l-col {
				width: var(--timeline-col-last-width);
      }
      
			.col.w {
				text-align: left;
			}

			.col.weekend {
				background-color: var(--timeline-col-weekend, #ccc);
			}

			.col.measure {
			    // Change min-width to adjust grid's cell width with day and hour-resolution.
				//min-width: 40px;
			}
			.col.w.measure {
				// Change min-width to adjust grid's cell width with week-resolution.
				//min-width: 70px;
			}

			.row {
				width: 100%;
				float: left;
				overflow: hidden;
				height: var(--timeline-row-height, 15px);
				font-size: var(--timeline-row-font-size, 10px);
				background-color: var(--timeline-row-background, #d0d0d0);
				-ms-flex-pack: justify;
				-webkit-touch-callout: none;
				@apply --no-user-select;
			}
    `;
    }
    render() {
        return html `
      ${this.yearBlocks()}
      ${this.monthBlocks()}
      ${this.dayBlocks()}
      <div id="resolutionDiv" class="row resolution"></div>`;
    }
    yearBlocks() {
        if (this.yearRowVisible) {
            return this.timelineBlocks(this.yearRowData, TimelineElement_1.STYLE_YEAR);
        }
        return nothing;
    }
    monthBlocks() {
        if (this.monthRowVisible) {
            return this.timelineBlocks(this.monthRowData, TimelineElement_1.STYLE_MONTH);
        }
        return nothing;
    }
    dayBlocks() {
        if (this.isDayRowVisible) {
            return this.timelineBlocks(this.dayRowData, TimelineElement_1.STYLE_DAY);
        }
        return nothing;
    }
    shouldUpdate(changedProperties) {
        return changedProperties.has('resolution')
            || changedProperties.has('startDateTime')
            || changedProperties.has('endDateTime')
            || changedProperties.has('locale')
            || changedProperties.has('timeZone')
            || changedProperties.has('firstDayOfWeek')
            || changedProperties.has('twelveHourClock')
            || changedProperties.has('yearRowVisible')
            || changedProperties.has('monthRowVisible')
            || changedProperties.has('monthNames')
            || changedProperties.has('weekdayNames');
    }
    willUpdate(changedProps) {
        if (changedProps.has('resolution')) {
            this.minResolutionWidth = -1;
        }
        if (changedProps.has('resolution') || changedProps.has('startDateTime')) {
            if (this.resolution === Resolution.Hour) {
                this.internalInclusiveStartDateTime = toDate(this.startDateTime);
            }
            else {
                this.internalInclusiveStartDateTime = toDate(this.startDateTime.substring(0, 10) + 'T00:00:00.000');
            }
        }
        if (changedProps.has('resolution') || changedProps.has('endDateTime')) {
            // given time must be always exact hour in millisecod accuracy 1AM means exactly "01:00:00.000".
            if (this.resolution === Resolution.Hour) {
                // convert given time to last millisecond in the given hour. 1AM becomes "01:59:59.999" set to internalEndDateTime.
                this.internalInclusiveEndDateTime = toDate(this.endDateTime.substring(0, 13) + ':59:59.999');
            }
            else {
                this.internalInclusiveEndDateTime = toDate(this.endDateTime.substring(0, 10) + 'T23:59:59.999');
            }
        }
        this.updateTimeLine(this.resolution, this.internalInclusiveStartDateTime, this.internalInclusiveEndDateTime, new DefaultLocaleDataProvider(this.locale, this.timeZone, this.firstDayOfWeek, this.twelveHourClock));
    }
    updated(changedProps) {
        if (!(this.resolution) || !this.internalInclusiveStartDateTime || !this.internalInclusiveEndDateTime) {
            return;
        }
        if (this.resolution !== Resolution.Day && this.resolution !== Resolution.Week && this.resolution !== Resolution.Hour) {
            console.log("TimelineElement resolution " + (this.resolution ? Resolution[this.resolution] : "null")
                + " is not supported");
            return;
        }
        console.log("TimelineElement Constructed content.");
        this.updateWidths();
        console.log("TimelineElement is updated for resolution " + Resolution[this.resolution] + ".");
        this.registerScrollHandler();
    }
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
    updateTimeLine(resolution, startDate, endDate, localeDataProvider) {
        if (!localeDataProvider) {
            console.log("TimelineElement requires ILocaleDataProvider. Can't complete update(...) operation.");
            return;
        }
        this.clear();
        console.log("TimelineElement content cleared.");
        if (!(resolution) || !startDate || !endDate) {
            return;
        }
        console.log("TimelineElement Updating content.");
        this.localeDataProvider = localeDataProvider;
        this.resolution = resolution;
        this.resetDateRange(startDate, endDate);
        this.lastDayOfWeek = (localeDataProvider.getFirstDayOfWeek() == 1) ? 7 : Math.max((localeDataProvider.getFirstDayOfWeek() - 1) % 8, 1);
        this.monthNames = this.monthNames || localeDataProvider.getMonthNames();
        this.weekdayNames = this.weekdayNames || localeDataProvider.getWeekdayNames();
        if (this.minResolutionWidth < 0) {
            this.minResolutionWidth = this.calculateResolutionMinWidth();
        }
        if (this.resolution === Resolution.Day || this.resolution === Resolution.Week) {
            this.prepareTimelineForDayOrWeekResolution(this.internalInclusiveStartDateTime, this.internalInclusiveEndDateTime);
        }
        else if (this.resolution === Resolution.Hour) {
            this.prepareTimelineForHourResolution(this.internalInclusiveStartDateTime, this.internalInclusiveEndDateTime);
        }
    }
    resetDateRange(startDate, endDate) {
        this.internalInclusiveStartDateTime = startDate;
        this.internalInclusiveEndDateTime = endDate;
        this.normalStartDate = this.toNormalDate(this.internalInclusiveStartDateTime);
        this.normalEndDate = this.toNormalDate(this.internalInclusiveEndDateTime);
        // Date#getDay() is zero-based: Sunday = 0, Monday = 1, ...
        // this.firstDayOfRange is 1-based (Sunday = 1).
        this.firstDayOfRange = this.firstDayOfRange || this.internalInclusiveStartDateTime.getDay() + 1;
        this.firstHourOfRange = this.firstHourOfRange || this.internalInclusiveStartDateTime.getHours();
    }
    registerScrollHandler() {
        if (this.scrollHandler) {
            return;
        }
        let timeline = this;
        this.scrollContainer = this.setupScrollContainer();
        this.scrollHandler = function (e) {
            window.requestAnimationFrame(function () {
                let container = timeline.scrollContainer;
                let sl = container.scrollLeft || container.scrollX;
                let st = container.scrollTop || container.scrollY;
                if (sl != timeline.previousContainerScrollLeft) {
                    timeline.setScrollLeft(sl);
                    timeline.previousContainerScrollLeft = sl;
                }
                if (st != timeline.previousContainerScrollTop) {
                    timeline.previousContainerScrollTop = st;
                }
            });
        };
        this.scrollContainer.addEventListener('scroll', this.scrollHandler);
    }
    setupScrollContainer() {
        let scrollContainer;
        if (this.scrollContainerId) {
            scrollContainer = this.getParentElement(this).querySelector('#' + this.scrollContainerId);
            if (!scrollContainer) {
                scrollContainer = document.querySelector('#' + this.scrollContainerId);
            }
            if (scrollContainer) {
                scrollContainer.style.overflowX = "auto";
            }
        }
        if (!scrollContainer) {
            scrollContainer = this.getParentElement(this);
            this.directlyInsideScrollContainer = true;
            if (scrollContainer === document.body) {
                return window; // window scrolls by default, not body
            }
        }
        return scrollContainer;
    }
    clear() {
        this.spacerBlocks = [];
        this.yearRowData.clear();
        this.monthRowData.clear();
        this.dayRowData.clear();
    }
    calculateResolutionMinWidth() {
        let resDivMeasure = document.createElement('div');
        resDivMeasure.classList.add(TimelineElement_1.STYLE_ROW, TimelineElement_1.STYLE_RESOLUTION);
        let resBlockMeasure = document.createElement('div');
        if (this.resolution === Resolution.Week) {
            // configurable with '.col.w.measure' selector
            resBlockMeasure.classList.add(TimelineElement_1.STYLE_COL, TimelineElement_1.STYLE_WEEK, TimelineElement_1.STYLE_MEASURE);
        }
        else {
            // measure for text 'MM'
            resBlockMeasure.innerText = "MM";
            // configurable with '.col.measure' selector
            resBlockMeasure.classList.add(TimelineElement_1.STYLE_COL, TimelineElement_1.STYLE_MEASURE);
        }
        resDivMeasure.appendChild(resBlockMeasure);
        this.shadowRoot.appendChild(resDivMeasure);
        let width = resBlockMeasure.clientWidth;
        if (this.resolution === Resolution.Week) {
            // divide given width by number of days in week
            width = width / DateTimeConstants.DAYS_IN_WEEK;
        }
        width = (width < this.resolutionWeekDayblockWidth) ? this.resolutionWeekDayblockWidth : width;
        this.shadowRoot.removeChild(resDivMeasure);
        return width;
    }
    registerHourResolutionBlock() {
        this.blocksInRange++;
        this.resolutionBlockCount++;
    }
    registerDayResolutionBlock() {
        this.blocksInRange++;
        this.resolutionBlockCount++;
    }
    registerWeekResolutionBlock(index, weekDay, lastBlock, firstWeek) {
        if (index == 0 || weekDay === Weekday.First) {
            this.resolutionBlockCount++;
        }
        if (firstWeek && (weekDay === Weekday.Last || lastBlock)) {
            this.firstResBlockCount = index + 1;
        }
        else if (lastBlock) {
            this.lastResBlockCount = (index + 1 - this.firstResBlockCount) % 7;
        }
        this.blocksInRange++;
    }
    timelineBlocks(rowData, style) {
        const itemTemplates = [];
        for (let entry of rowData.getBlockEntries()) {
            itemTemplates.push(html `${entry[1]}`);
        }
        if (this.isAlwaysCalculatePixelWidths()) {
            itemTemplates.push(html `${this.createSpacerBlock(style)}`);
        }
        return itemTemplates;
    }
    /**
   * Returns true if Widget is set to calculate widths by itself. Default is
   * false.
   *
   * @return
   */
    isAlwaysCalculatePixelWidths() {
        return this.calcPixels;
    }
    createSpacerBlock(className) {
        let block = document.createElement('div');
        block.classList.add(TimelineElement_1.STYLE_ROW, TimelineElement_1.STYLE_YEAR, TimelineElement_1.STYLE_SPACER);
        block.innerText = " ";
        block.style.display = "none"; // not visible by default
        this.spacerBlocks.push(block);
        return block;
    }
    /** Clears Daylight saving time adjustment from the given time. */
    toNormalDate(zonedDate) {
        return DateUtil.toNormalDate(zonedDate, this.localeDataProvider.getDaylightAdjustment(zonedDate));
    }
    getDSTAdjustedDate(previousIsDST, zonedDate) {
        return DateUtil.getDSTAdjustedDate(previousIsDST, zonedDate, this.localeDataProvider.getDaylightAdjustment(zonedDate));
    }
    getParentElement(node) {
        var parent = node.parentNode;
        if (!parent || parent.nodeType != 1) {
            parent = null;
        }
        return parent;
    }
    getDay(date) {
        // by adjusting the date to the middle of the day before formatting is a
        // workaround to avoid DST issues with DateTimeFormatter.
        let adjusted = DateUtil.adjustToMiddleOfDay(date, this.localeDataProvider.getLocale());
        return this.localeDataProvider.formatDate(adjusted, "d");
    }
    getYear(date) {
        return this.localeDataProvider.formatDate(date, "yyyy");
    }
    getMonth(date) {
        let m = this.localeDataProvider.formatDate(date, "M");
        return parseInt(m) - 1;
    }
    isWeekEnd(dayCounter) {
        return dayCounter == 1 || dayCounter == 7;
    }
    key(prefix, rowData) {
        return prefix + "_" + (rowData.size());
    }
    newKey(prefix, rowData) {
        return prefix + "_" + (rowData.size() + 1);
    }
    addBlock(current, target, date, rowData, operation) {
        let key;
        if (target !== current) {
            current = target;
            key = this.newKey("" + current, rowData);
            operation(target, key, date);
        }
        else {
            key = this.key("" + current, rowData);
            rowData.setBlockLength(key, rowData.getBlockLength(key) + 1);
        }
        return current;
    }
    addDayBlock(currentDay, date) {
        let day = this.getDay(date);
        return this.addBlock(currentDay, day, date, this.dayRowData, (day, key, date) => {
            this.addDayBlockElement(key, this.formatDayCaption(day, date));
        });
    }
    addMonthBlock(currentMonth, date) {
        let month = this.getMonth(date);
        return this.addBlock(currentMonth, "" + month, date, this.monthRowData, (target, key, date) => {
            this.addMonthBlockElement(key, this.formatMonthCaption(month, date));
        });
    }
    addYearBlock(currentYear, date) {
        let year = this.getYear(date);
        return this.addBlock(currentYear, year, date, this.yearRowData, (year, key, date) => {
            this.addYearBlockElement(key, this.formatYearCaption(year, date));
        });
    }
    addMonthBlockElement(key, text) {
        this.createTimelineBlock(key, text, TimelineElement_1.STYLE_MONTH, this.monthRowData);
    }
    addYearBlockElement(key, text) {
        this.createTimelineBlock(key, text, TimelineElement_1.STYLE_YEAR, this.yearRowData);
    }
    addDayBlockElement(key, text) {
        this.createTimelineBlock(key, text, TimelineElement_1.STYLE_DAY, this.dayRowData);
    }
    createTimelineBlock(key, text, styleSuffix, rowData) {
        let div = document.createElement('div');
        div.classList.add(TimelineElement_1.STYLE_ROW, styleSuffix);
        div.innerText = text;
        rowData.setBlockLength(key, 1);
        rowData.setBlock(key, div);
        return div;
    }
    formatDayCaption(day, date) {
        if (!this.dayFormat || this.dayFormat === "") {
            return day;
        }
        return this.localeDataProvider.formatDate(date, this.dayFormat);
    }
    formatYearCaption(year, date) {
        if (!this.yearFormat || this.yearFormat === "") {
            return year;
        }
        return this.localeDataProvider.formatDate(date, this.yearFormat);
    }
    formatWeekCaption(date) {
        if (!this.weekFormat || this.weekFormat === "") {
            return "" + getISOWeek(date);
        }
        return this.localeDataProvider.formatDate(date, this.weekFormat);
    }
    formatMonthCaption(month, date) {
        if (!this.monthFormat || this.monthFormat === "") {
            return this.monthNames[month];
        }
        return this.localeDataProvider.formatDate(date, this.monthFormat);
    }
    getWeekday(dayCounter) {
        if (dayCounter === this.localeDataProvider.getFirstDayOfWeek()) {
            return Weekday.First;
        }
        if (dayCounter === this.lastDayOfWeek) {
            return Weekday.Last;
        }
        return Weekday.Between;
    }
    prepareTimelineForHourResolution(startDate, endDate) {
        let timeline = this;
        this.firstDay = true;
        let hourCounter = this.firstHourOfRange;
        this.prepareTimelineForHour(DateTimeConstants.HOUR_INTERVAL, startDate, endDate, {
            registerResolutionBlock(index, date, currentYear, lastTimelineBlock) {
                timeline.registerHourResolutionBlock();
                hourCounter = Math.max((hourCounter + 1) % 25, 1);
            }
        });
    }
    prepareTimelineForHour(interval, startDate, endDate, resBlockRegisterer) {
        this.blocksInRange = 0;
        this.resolutionBlockCount = 0;
        this.firstResBlockCount = 0;
        this.lastResBlockCount = 0;
        let currentYear = null;
        let currentMonth = null;
        let currentDay = null;
        let pos = startDate;
        let end = endDate;
        let index = 0;
        let lastTimelineBlock = false;
        let date;
        while (pos.getTime() <= end.getTime()) {
            date = pos;
            let nextHour = new Date(pos.getTime() + interval);
            lastTimelineBlock = nextHour.getTime() > end.getTime();
            resBlockRegisterer.registerResolutionBlock(index, date, currentYear, lastTimelineBlock);
            if (this.yearRowVisible) {
                currentYear = this.addYearBlock(currentYear, date);
            }
            if (this.monthRowVisible) {
                currentMonth = this.addMonthBlock(currentMonth, date);
            }
            if (this.isDayRowVisible()) {
                currentDay = this.addDayBlock(currentDay, date);
            }
            pos = nextHour;
            index++;
        }
    }
    prepareTimelineForDayOrWeekResolution(startDate, endDate) {
        let timeline = this;
        let dayCounter = this.firstDayOfRange;
        let weekday;
        let firstWeek = true;
        this.prepareTimelineForDayOrWeek(DateTimeConstants.DAY_INTERVAL, startDate, endDate, {
            registerResolutionBlock: function (index, date, currentYear, lastTimelineBlock) {
                weekday = timeline.getWeekday(dayCounter);
                if (timeline.resolution === Resolution.Week) {
                    timeline.registerWeekResolutionBlock(index, weekday, lastTimelineBlock, firstWeek);
                    if (firstWeek && (weekday === Weekday.Last || lastTimelineBlock)) {
                        firstWeek = false;
                    }
                }
                else {
                    timeline.registerDayResolutionBlock();
                }
                dayCounter = Math.max((dayCounter + 1) % 8, 1);
            }
        });
    }
    prepareTimelineForDayOrWeek(interval, startDate, endDate, resBlockRegisterer) {
        this.blocksInRange = 0;
        this.resolutionBlockCount = 0;
        this.firstResBlockCount = 0;
        this.lastResBlockCount = 0;
        let currentYear = null;
        let currentMonth = null;
        let currentDay = null;
        let pos = DateUtil.adjustToMiddleOfDay(startDate, this.localeDataProvider.getLocale());
        let end = endDate;
        let index = 0;
        let lastTimelineBlock = false;
        let date;
        let isDST = false;
        let isPreviousDst = this.localeDataProvider.isDaylightTime(startDate);
        while (!lastTimelineBlock) {
            let date = DateUtil.getDSTAdjustedDate(isPreviousDst, pos, this.localeDataProvider.getDaylightAdjustment(pos));
            pos = date;
            isDST = this.localeDataProvider.isDaylightTime(date);
            let d = new Date(date.getTime() + interval);
            lastTimelineBlock = DateUtil.getDSTAdjustedDate(isDST, d, this.localeDataProvider.getDaylightAdjustment(d)).getTime() > end.getTime();
            resBlockRegisterer.registerResolutionBlock(index, date, currentYear, lastTimelineBlock);
            if (this.yearRowVisible) {
                currentYear = this.addYearBlock(currentYear, date);
            }
            if (this.monthRowVisible) {
                currentMonth = this.addMonthBlock(currentMonth, date);
            }
            if (this.isDayRowVisible()) {
                currentDay = this.addDayBlock(currentDay, date);
            }
            isPreviousDst = isDST;
            pos = new Date(pos.getTime() + interval);
            index++;
        }
    }
    isDayRowVisible() {
        return this.resolution === Resolution.Hour;
    }
    /**
   * Get actual width of the timeline.
   *
   * @return
   */
    getResolutionWidth() {
        if (!this.isTimelineOverflowingHorizontally()) {
            return this.calculateTimelineWidth();
        }
        let width = this.getResolutionDivWidth();
        if (this.isAlwaysCalculatePixelWidths() && this.containsResBlockSpacer()) {
            width = width - ElementUtil.getWidth(this.resSpacerDiv);
        }
        return width;
    }
    /**
   * Calculate the exact width of the timeline. Excludes any spacers in the
   * end.
   *
   * @return
   */
    calculateTimelineWidth() {
        let last = this.getLastResolutionElement();
        if (last === null) {
            return 0.0;
        }
        let r = ElementUtil.getRight(last);
        let l = ElementUtil.getLeft(this.getFirstResolutionElement());
        let timelineRealWidth = r - l;
        return timelineRealWidth;
    }
    /*
     * Get width of the resolution div element.
     */
    getResolutionDivWidth() {
        if (!this.isTimelineOverflowingHorizontally()) {
            return ElementUtil.getWidth(this.resolutionDiv);
        }
        return this.blocksInRange * this.minResolutionWidth;
    }
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
    getLeftPositionPercentageForDate(date, contentWidth) {
        let timelineLeft = this.getLeftPositionForDate(date);
        let relativeLeft = this.convertRelativeLeftPosition(timelineLeft, contentWidth);
        let width = this.getResolutionWidth();
        return (100.0 / width) * relativeLeft;
    }
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
    getLeftPositionPercentageStringForDate(date, contentWidth) {
        let timelineLeft = this.getLeftPositionForDate(date);
        let relativeLeft = this.convertRelativeLeftPosition(timelineLeft, contentWidth);
        let width = this.getResolutionWidth();
        let calc = this.createCalcCssValue(width, relativeLeft);
        if (calc != null) {
            return calc;
        }
        return (100.0 / width) * relativeLeft + "%";
    }
    getLeftPositionPercentageStringForDateRange(date, rangeWidth, rangeStartDate, rangeEndDate) {
        let rangeLeft = this.getLeftPositionForDateRange(date, rangeWidth, rangeStartDate, rangeEndDate);
        let width = rangeWidth;
        let calc = this.createCalcCssValue(width, rangeLeft);
        if (calc != null) {
            return calc;
        }
        return (100.0 / width) * rangeLeft + "%";
    }
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
    getWidthPercentageStringForDateInterval(interval) {
        let range = this.internalInclusiveEndDateTime.getTime() - this.internalInclusiveStartDateTime.getTime();
        return this.getWidthPercentageStringForDateIntervalForRange(interval, range);
    }
    /** @see #getWidthPercentageStringForDateInterval(long) */
    getWidthPercentageStringForDateIntervalForRange(interval, range) {
        let calc = this.createCalcCssValue(range, interval);
        if (calc != null) {
            return calc;
        }
        return (100.0 / range) * interval + "%";
    }
    /**
     * Calculate matching left offset in pixels for a date (
     * {@link Date#getTime()}).
     *
     * @param date
     *            Target date in milliseconds.
     * @return Left offset in pixels.
     */
    getLeftPositionForDate(date) {
        return this.getLeftPositionForDateRange(date, this.getResolutionWidth(), this.internalInclusiveStartDateTime, this.internalInclusiveEndDateTime);
    }
    getLeftPositionForDateRange(date, rangeWidth, rangeStartDate, rangeEndDate) {
        let width = rangeWidth;
        let range = rangeEndDate.getTime() - rangeStartDate.getTime();
        if (range <= 0) {
            return 0;
        }
        let p = width / range;
        let offset = date.getTime() - rangeStartDate.getTime();
        let left = p * offset;
        return left;
    }
    /**
     * Calculate matching date ({@link Date#getTime()}) for the target left
     * pixel offset.
     *
     * @param left
     *            Left offset in pixels.
     * @return Date in a milliseconds or null if timeline width is invalid (<=0).
     */
    getDateForLeftPosition(left) {
        return this.getDateForLeftPositionNoticeDST(left, this.resolution === Resolution.Hour);
    }
    getDateForLeftPositionNoticeDST(left, noticeDST) {
        let width = this.getResolutionWidth();
        if (width <= 0) {
            return null;
        }
        let range = this.normalEndDate.getTime() - this.normalStartDate.getTime();
        if (noticeDST) {
            range = this.adjustDateRangeByDST(range);
        }
        let p = range / width;
        let offset = p * left;
        let date = new Date(this.internalInclusiveStartDateTime.getTime() + offset);
        console.log("Zoned: " + this.localeDataProvider.formatDate(date, "dd. HH:mm") + "  DST: "
            + this.localeDataProvider.getDaylightAdjustment(date) / 60000);
        return date;
    }
    /**
     * Convert left position for other relative target width.
     *
     * @param left
     * @param contentWidthToConvertFor
     * @return
     */
    convertRelativeLeftPosition(left, contentWidthToConvertFor) {
        let width = this.getResolutionWidth();
        if (width <= 0 || contentWidthToConvertFor <= 0) {
            return 0;
        }
        let relativePosition = (1.0 / contentWidthToConvertFor) * left;
        let timelineLeft = relativePosition * width;
        return timelineLeft;
    }
    adjustDateRangeByDST(range) {
        /*
         * Notice extra block(s) or missing block(s) in range when start time is
         * in DST and end time is not, or vice versa.
         */
        let dstStart = this.localeDataProvider.getDaylightAdjustment(this.internalInclusiveStartDateTime);
        let dstEnd = this.localeDataProvider.getDaylightAdjustment(this.internalInclusiveEndDateTime);
        if (dstStart > dstEnd) {
            range -= Math.abs(dstStart - dstEnd);
        }
        else if (dstEnd > dstStart) {
            range += Math.abs(dstEnd - dstStart);
        }
        return range;
    }
    /**
     * Set horizontal scroll position for the time-line.
     *
     * @param left
     *            Scroll position in pixels.
     */
    setScrollLeft(left) {
        if (this.positionLeft === left) {
            return;
        }
        this.positionLeft = left || 0;
        if (!this.directlyInsideScrollContainer) {
            this.style.left = -this.positionLeft + "px";
        }
        this.lazyResolutionPaint = setTimeout(() => this.fillVisibleTimeline(), 20);
    }
    /**
     * Re-calculates required widths for this widget.
     * <p>
     * Re-creates and fills the visible part of the resolution element.
     */
    updateWidths() {
        if (this.resolutionDiv == null) {
            console.log("TimelineElement is not ready for updateWidths() call. Call update(...) instead.");
            return;
        }
        console.log("TimelineElement Started updating widths.");
        // start by clearing old content in resolution element
        while (this.resolutionDiv.firstChild) {
            this.resolutionDiv.removeChild(this.resolutionDiv.lastChild);
        }
        this.setMinWidth(this.blocksInRange * this.minResolutionWidth);
        // update horizontal overflow state here, after min-width is updated.
        this.updateTimelineOverflowingHorizontally();
        this.createTimelineElementsOnVisibleArea();
        // fill timeline
        this.fillVisibleTimeline();
        // remove spacer block if it exist
        this.removeResolutionSpacerBlock();
        // calculate new block width for day-resolution.
        // Year and month blocks are vertically in-line with days.
        this.dayWidthPercentage = 100.0 / this.blocksInRange;
        this.dayOrHourWidthPx = this.calculateDayOrHourResolutionBlockWidthPx(this.blocksInRange);
        // calculate block width for currently selected resolution
        // (day,week,...)
        // resolution div's content may not be vertically in-line with
        // year/month blocks. This is the case for example with Week resolution.
        this.resBlockMinWidthPx = this.minResolutionWidth;
        this.resBlockWidthPx = this.calculateActualResolutionBlockWidthPx(this.dayOrHourWidthPx);
        this.resBlockWidthPercentage = 100.0 / this.resolutionBlockCount;
        let pct = this.createCalcCssValue(this.resolutionBlockCount, null);
        if (this.resolution === Resolution.Week) {
            this.resBlockMinWidthPx = DateTimeConstants.DAYS_IN_WEEK * this.minResolutionWidth;
            this.resBlockWidthPercentage = this.dayWidthPercentage * DateTimeConstants.DAYS_IN_WEEK;
            pct = this.createCalcCssValue(this.blocksInRange, DateTimeConstants.DAYS_IN_WEEK);
        }
        // update resolution block widths
        this.updateResolutionBlockWidths(pct);
        if (this.yearRowVisible) {
            // update year block widths
            this.updateBlockWidths(this.yearRowData);
        }
        if (this.monthRowVisible) {
            // update month block widths
            this.updateBlockWidths(this.monthRowData);
        }
        if (this.isDayRowVisible()) {
            this.updateBlockWidths(this.dayRowData);
        }
        if (this.isAlwaysCalculatePixelWidths()) {
            this.updateSpacerBlocks(this.dayOrHourWidthPx);
        }
        console.log("TimelineElement Widths are updated.");
    }
    updateBlockWidths(rowData) {
        for (let entry of rowData.getBlockEntries()) {
            this.setWidth(entry[1], rowData.getBlockLength(entry[0]));
        }
    }
    updateSpacerBlocks(dayWidthPx) {
        let spaceLeft = this.getResolutionDivWidth() - (this.blocksInRange * dayWidthPx);
        if (spaceLeft > 0) {
            for (let e of this.spacerBlocks) {
                e.style.removeProperty("display");
                e.style.width = spaceLeft + "px";
            }
            this.resSpacerDiv = this.createResolutionBlock();
            this.resSpacerDiv.classList.add(TimelineElement_1.STYLE_SPACER);
            this.resSpacerDiv.style.width = spaceLeft + "px";
            this.resSpacerDiv.innerText = " ";
            this.resolutionDiv.appendChild(this.resSpacerDiv);
        }
        else {
            this.hideSpacerBlocks();
        }
    }
    hideSpacerBlocks() {
        for (let e of this.spacerBlocks) {
            e.style.display = "none";
        }
    }
    /**
     * Set minimum width (pixels) of this widget's root DIV element. Default is
     * -1. Notice that
     * {@link #update(Resolution, long, long, int, int, LocaleDataProvider)}
     * will calculate min-width and call this internally.
     *
     * @param minWidth
     *            Minimum width in pixels.
     */
    setMinWidth(minWidth) {
        this.minWidth = minWidth;
        this.style.minWidth = this.minWidth + "px";
        this.resolutionDiv.style.minWidth = this.minWidth + "px";
    }
    /**
     * Returns true if the timeline is overflowing the parent's width. This
     * works only when this widget is attached to some parent.
     *
     * @return True when timeline width is more than the parent's width (@see
     *         {@link Element#getClientWidth()}).
     */
    isTimelineOverflowingHorizontally() {
        return this.timelineOverflowingHorizontally;
    }
    /**
    * Update horizontal overflow state.
    */
    updateTimelineOverflowingHorizontally() {
        this.timelineOverflowingHorizontally = (ElementUtil.getWidth(this.resolutionDiv) > ElementUtil.getWidth(this.getParentElement(this)));
    }
    createTimelineElementsOnVisibleArea() {
        // create place holder elements that represents weeks/days/hours
        // depending on the resolution in the timeline.
        // Only visible blocks are created, and only once, content will change
        // on scroll.
        // first: detect how many blocks we can fit in the screen
        let blocks = this.resolutionBlockCount;
        if (this.isTimelineOverflowingHorizontally()) {
            blocks = Math.floor((ElementUtil.getWidth(this.getParentElement(this))
                / this.calculateMinimumResolutionBlockWidth()));
            if (this.resolutionBlockCount < blocks) {
                // blocks need to be scaled up to fit the screen
                blocks = this.resolutionBlockCount;
            }
            else {
                blocks += 2;
            }
        }
        let element = null;
        for (let i = 0; i < blocks; i++) {
            switch (this.resolution) {
                case Resolution.Hour:
                    element = this.createHourResolutionBlock();
                    break;
                case Resolution.Day:
                    element = this.createDayResolutionBlock();
                    break;
                case Resolution.Week:
                    element = this.createWeekResolutionBlock();
                    break;
            }
            this.resolutionDiv.appendChild(element);
        }
        console.log(`TimelineElement Added ${blocks} visible timeline elements for resolution ${Resolution[this.resolution]}`);
    }
    calculateMinimumResolutionBlockWidth() {
        if (this.resolution === Resolution.Week) {
            return DateTimeConstants.DAYS_IN_WEEK * this.minResolutionWidth;
        }
        return this.minResolutionWidth;
    }
    createResolutionBlock() {
        let resBlock = document.createElement('div');
        resBlock.classList.add("col");
        return resBlock;
    }
    createHourResolutionBlock() {
        let resBlock = this.createResolutionBlock();
        resBlock.classList.add("h", TimelineElement_1.STYLE_CENTER);
        return resBlock;
    }
    createDayResolutionBlock() {
        let resBlock = this.createResolutionBlock();
        resBlock.classList.add(TimelineElement_1.STYLE_CENTER);
        return resBlock;
    }
    createWeekResolutionBlock() {
        let resBlock = this.createResolutionBlock();
        resBlock.classList.add("w", TimelineElement_1.STYLE_CENTER);
        return resBlock;
    }
    fillVisibleTimeline() {
        if (this.isTimelineOverflowingHorizontally()) {
            this.showResolutionBlocksOnView();
        }
        else {
            this.showAllResolutionBlocks();
        }
    }
    showResolutionBlocksOnView() {
        let positionLeftSnapshot = this.positionLeft;
        let datePos = positionLeftSnapshot;
        this.firstWeekBlockHidden = false;
        let left = Math.floor(positionLeftSnapshot);
        if (positionLeftSnapshot > 0 && this.resBlockWidthPx > 0) {
            let overflow = 0.0;
            let firstResBlockShort = this.isFirstResBlockShort();
            overflow = this.getScrollOverflowForResolutionBlock(positionLeftSnapshot, left, firstResBlockShort);
            left = Math.floor(positionLeftSnapshot - overflow);
            datePos = this.adjustLeftPositionForDateDetection(left);
        }
        if (datePos < 0.0) {
            datePos = positionLeftSnapshot;
        }
        let leftDate;
        let noticeDst = this.resolution === Resolution.Hour;
        leftDate = this.getDateForLeftPositionNoticeDST(datePos, noticeDst);
        let containerWidth = ElementUtil.getWidth(this.getParentElement(this));
        this.fillTimelineForResolution(leftDate, new Date(Math.min(this.internalInclusiveEndDateTime.getTime(), this.getDateForLeftPositionNoticeDST(datePos + containerWidth, noticeDst).getTime())), left);
        this.style.setProperty("--timeline-col-position", "relative");
        this.style.setProperty("--timeline-col-left", left + "px");
        console.log(`TimelineElement Updated visible timeline elements for horizontal scroll position ${left} (plus ${datePos - left} to center-of-first-block)`);
    }
    showAllResolutionBlocks() {
        this.style.setProperty("--timeline-col-position", "relative");
        this.style.setProperty("--timeline-col-left", "0px");
        this.fillTimelineForResolution(this.internalInclusiveStartDateTime, this.internalInclusiveEndDateTime, 0);
    }
    fillTimelineForResolution(startDate, endDate, left) {
        if (this.resolution === Resolution.Day || this.resolution === Resolution.Week) {
            this.fillTimelineForDayResolution(startDate, endDate, left);
        }
        else if (this.resolution == Resolution.Hour) {
            this.fillTimelineForHourResolution(startDate, endDate, left);
        }
        else {
            console.log("TimelineElement resolution " + (this.resolution != null ? Resolution[this.resolution] : "null")
                + " is not supported");
            return;
        }
        console.log("TimelineElement Filled new data and styles to visible timeline elements");
    }
    isFirstResBlockShort() {
        return this.firstResBlockCount > 0 && ((this.resolution === Resolution.Week && this.firstResBlockCount < DateTimeConstants.DAYS_IN_WEEK));
    }
    isLastResBlockShort() {
        return this.lastResBlockCount > 0 && ((this.resolution === Resolution.Week && this.lastResBlockCount < DateTimeConstants.DAYS_IN_WEEK));
    }
    getScrollOverflowForResolutionBlock(positionLeftSnapshot, left, firstResBlockShort) {
        let overflow;
        if (firstResBlockShort && left <= this.getFirstResolutionElementWidth()) {
            overflow = this.getScrollOverflowForShortFirstResolutionBlock(positionLeftSnapshot);
        }
        else {
            overflow = this.getScrollOverflowForRegularResoultionBlock(positionLeftSnapshot, firstResBlockShort);
        }
        return overflow;
    }
    getScrollOverflowForRegularResoultionBlock(positionLeftSnapshot, firstResBlockShort) {
        let overflow;
        let firstBlockWidth = this.getFirstResolutionElementWidth();
        let positionLeft = (positionLeftSnapshot - (firstResBlockShort ? firstBlockWidth : 0));
        overflow = positionLeft % this.resBlockWidthPx;
        if (firstResBlockShort) {
            overflow += firstBlockWidth;
            this.firstWeekBlockHidden = true;
        }
        return overflow;
    }
    getScrollOverflowForShortFirstResolutionBlock(positionLeftSnapshot) {
        let overflow;
        // need to notice a short resolution block due to timeline's
        // start date which is in middle of a week.
        overflow = positionLeftSnapshot % this.getFirstResolutionElementWidth();
        if (overflow == 0.0) {
            overflow = this.getFirstResolutionElementWidth();
        }
        return overflow;
    }
    /**
     * Returns a width of the first resolution block.
     *
     * @return
     */
    getFirstResolutionElementWidth() {
        if (this.isFirstResBlockShort()) {
            if (this.isTimelineOverflowingHorizontally()) {
                return this.firstResBlockCount * this.minResolutionWidth;
            }
            else {
                return ElementUtil.getWidth(this.getFirstResolutionElement());
            }
        }
        else {
            if (this.isTimelineOverflowingHorizontally()) {
                return this.resBlockMinWidthPx;
            }
            else {
                return ElementUtil.getWidth(this.getFirstResolutionElement());
            }
        }
    }
    getFirstResolutionElement() {
        if (this.resolutionDiv.hasChildNodes()) {
            return this.resolutionDiv.firstElementChild;
        }
        return null;
    }
    getLastResolutionElement() {
        let div = this.resolutionDiv;
        if (!div) {
            return null;
        }
        let nodeList = div.childNodes;
        if (!nodeList) {
            return null;
        }
        let blockCount = nodeList.length;
        if (blockCount < 1) {
            return null;
        }
        if (this.containsResBlockSpacer()) {
            let index = blockCount - 2;
            if (blockCount > 1 && index >= 0) {
                return this.resolutionDiv.childNodes.item(index);
            }
            return null;
        }
        return this.resolutionDiv.lastChild;
    }
    containsResBlockSpacer() {
        return this.resSpacerDiv != null && this.resSpacerDiv.parentElement
            && this.resSpacerDiv.parentElement === this.resolutionDiv;
    }
    removeResolutionSpacerBlock() {
        if (this.containsResBlockSpacer()) {
            this.resSpacerDiv.parentNode.removeChild(this.resSpacerDiv);
        }
    }
    /*
   * Calculates either day or hour resolution block width depending on the
   * current resolution.
   */
    calculateDayOrHourResolutionBlockWidthPx(blockCount) {
        let dayOrHourWidthPx = Math.round(this.resolutionDiv.clientWidth / blockCount);
        while ((blockCount * dayOrHourWidthPx) < this.resolutionDiv.clientWidth) {
            dayOrHourWidthPx++;
        }
        return dayOrHourWidthPx;
    }
    /*
   * Calculates the actual width of one resolution block element. For example:
   * week resolution will return 7 * dayOrHourBlockWidthPx.
   */
    calculateActualResolutionBlockWidthPx(dayOrHourBlockWidthPx) {
        if (this.resolution === Resolution.Week) {
            return DateTimeConstants.DAYS_IN_WEEK * dayOrHourBlockWidthPx;
        }
        return dayOrHourBlockWidthPx;
    }
    /**
   * Adjust left position for optimal position to detect accurate date with
   * the current resolution.
   */
    adjustLeftPositionForDateDetection(left) {
        let datePos;
        if (this.resolution === Resolution.Week) {
            // detect date from the center of the first day block inside the
            // week block.
            datePos = left + this.dayOrHourWidthPx / 2;
        }
        else {
            // detect date from the center of the block (day/hour)
            datePos = left + this.resBlockWidthPx / 2;
        }
        return datePos;
    }
    createCalcCssValue(v, multiplier) {
        if (this.ie) {
            // see comments in createCalcCssValue(int, Integer)
            let percents = 100.0 / v * multiplier;
            return "calc(" + percents + "%)";
        }
        return null;
    }
    updateResolutionBlockWidths(pct) {
        if (this.setPositionForEachBlock) {
            if (!this.isTimelineOverflowingHorizontally()) {
                this.resolutionDiv.style.display = "flex";
            }
            else {
                this.resolutionDiv.style.removeProperty("display");
            }
            let firstResBlockIsShort = this.isFirstResBlockShort();
            let lastResBlockIsShort = this.isLastResBlockShort();
            // when setPositionForEachBlock is true, set width for each block explicitly.
            let count = this.resolutionDiv.childElementCount;
            if (this.containsResBlockSpacer()) {
                count--;
            }
            let lastIndex = count - 1;
            let i;
            let resBlock;
            for (i = 0; i < count; i++) {
                resBlock = this.resolutionDiv.childNodes.item(i);
                // first and last week blocks may be thinner than other
                // resolution blocks.
                if (firstResBlockIsShort && i == 0) {
                    this.setWidth(resBlock, this.firstResBlockCount);
                }
                else if (lastResBlockIsShort && i == lastIndex) {
                    this.setWidth(resBlock, this.lastResBlockCount);
                }
                else {
                    this.setWidthPct(this.resBlockWidthPx, pct, resBlock);
                }
            }
        }
        else {
            // set widths by updating injected styles in one place. Faster than
            // setting widths explicitly for each element.
            let center = this.getWidthStyleValue(pct);
            let first = center;
            let last = center;
            if (this.isFirstResBlockShort()) {
                first = this.getWidth(this.firstResBlockCount);
            }
            if (this.isLastResBlockShort()) {
                last = this.getWidth(this.lastResBlockCount);
            }
            this.style.setProperty("--timeline-col-center-width", center);
            this.style.setProperty("--timeline-col-first-width", first);
            this.style.setProperty("--timeline-col-last-width", last);
        }
    }
    getWidth(multiplier) {
        if (this.isTimelineOverflowingHorizontally()) {
            return (multiplier * this.minResolutionWidth) + "px";
        }
        else {
            if (this.isAlwaysCalculatePixelWidths()) {
                return multiplier * this.dayOrHourWidthPx + "px";
            }
            else {
                return this.getCssPercentageWidth(this.blocksInRange, this.dayWidthPercentage, multiplier);
            }
        }
    }
    setWidth(element, multiplier) {
        if (this.isTimelineOverflowingHorizontally()) {
            element.style.width = (multiplier * this.minResolutionWidth) + "px";
        }
        else {
            if (this.isAlwaysCalculatePixelWidths()) {
                element.style.width = (multiplier * this.dayOrHourWidthPx) + "px";
            }
            else {
                this.setCssPercentageWidth(element, this.blocksInRange, this.dayWidthPercentage, multiplier);
            }
        }
    }
    setWidthPct(resBlockWidthPx, pct, element) {
        if (this.isTimelineOverflowingHorizontally()) {
            element.style.width = this.resBlockMinWidthPx + "px";
        }
        else {
            if (this.isAlwaysCalculatePixelWidths()) {
                element.style.width = resBlockWidthPx + "px";
            }
            else {
                if (this.ie) {
                    element.style.flex = "1";
                }
                this.setCssPercentageWidthFor(element, this.resBlockWidthPercentage, pct);
            }
        }
    }
    setCssPercentageWidth(element, daysInRange, width, position) {
        let pct = this.createCalcCssValue(daysInRange, position);
        this.setCssPercentageWidthFor(element, position * width, pct);
    }
    getCssPercentageWidth(daysInRange, width, position) {
        let pct = this.createCalcCssValue(daysInRange, position);
        return this.getPercentageWidthString(position * width, pct);
    }
    setCssPercentageWidthFor(element, nValue, pct) {
        if (pct) {
            element.style.width = pct;
        }
        else {
            element.style.width = nValue + "%";
        }
    }
    getPercentageWidthString(nValue, pct) {
        if (pct) {
            return pct;
        }
        else {
            return nValue + "%";
        }
    }
    getWidthStyleValue(pct) {
        if (this.isTimelineOverflowingHorizontally()) {
            return this.resBlockMinWidthPx + "px";
        }
        else {
            if (this.isAlwaysCalculatePixelWidths()) {
                return this.resBlockWidthPx + "px";
            }
            else {
                return this.getPercentageWidthString(this.resBlockWidthPercentage, pct);
            }
        }
    }
    fillTimelineForHourResolution(startDate, endDate, left) {
        let timeline = this;
        this.firstDay = true;
        let hourCounter;
        let even;
        this.fillTimelineForHour(DateTimeConstants.HOUR_INTERVAL, startDate, endDate, {
            setup() {
                hourCounter = this.getFirstHourOfVisibleRange(startDate);
                even = this.isEven(startDate);
            },
            fillResolutionBlock(index, date, currentYear, lastTimelineBlock) {
                let childCount = timeline.resolutionDiv.childElementCount;
                if (timeline.isValidChildIndex(index, childCount)) {
                    let resBlock = timeline.resolutionDiv.childNodes.item(index);
                    timeline.fillHourResolutionBlock(resBlock, date, index, hourCounter, lastTimelineBlock, left, even);
                    hourCounter = (hourCounter + 1) % 24;
                    even = !even;
                }
                else {
                    timeline.logIndexOutOfBounds("hour", index, childCount);
                    return;
                }
            },
            isEven(startDate) {
                let normalDate = timeline.toNormalDate(startDate);
                if (timeline.normalStartDate.getTime() < normalDate.getTime()) {
                    let hours = Math.floor(((normalDate.getTime() - timeline.normalStartDate.getTime()) / DateTimeConstants.HOUR_INTERVAL));
                    return (hours % 2) == 1;
                }
                return false;
            },
            getFirstHourOfVisibleRange(startDate) {
                let normalDate = timeline.toNormalDate(startDate);
                if (timeline.normalStartDate.getTime() < normalDate.getTime()) {
                    let hours = Math.floor(((normalDate.getTime() - timeline.normalStartDate.getTime()) / DateTimeConstants.HOUR_INTERVAL));
                    return ((timeline.firstHourOfRange + hours) % 24);
                }
                return timeline.firstHourOfRange;
            }
        });
    }
    fillTimelineForDayResolution(startDate, endDate, left) {
        let timeline = this;
        let dayCounter;
        let even;
        let firstWeek = true;
        let weekIndex = 0;
        let weekday;
        this.fillTimelineForDayOrWeek(DateTimeConstants.DAY_INTERVAL, startDate, endDate, {
            setup: function () {
                dayCounter = this.getFirstDayOfVisibleRange(startDate);
                even = this.isEven(startDate, timeline.firstDayOfRange);
            },
            fillResolutionBlock: function (index, date, currentYear, lastTimelineBlock) {
                try {
                    weekday = timeline.getWeekday(dayCounter);
                    if (timeline.resolution === Resolution.Week) {
                        this.fillWeekBlock(left, index, date, lastTimelineBlock);
                    }
                    else {
                        this.fillDayBlock(left, index, date);
                    }
                }
                finally {
                    dayCounter = Math.max((dayCounter + 1) % 8, 1);
                }
            },
            fillDayBlock: function (left, index, date) {
                let childCount = timeline.resolutionDiv.childElementCount;
                if (timeline.isValidChildIndex(index, childCount)) {
                    let resBlock = timeline.resolutionDiv.childNodes.item(index);
                    timeline.fillDayResolutionBlock(resBlock, date, index, timeline.isWeekEnd(dayCounter), left);
                }
                else {
                    timeline.logIndexOutOfBounds("day", index, childCount);
                    return;
                }
            },
            fillWeekBlock: function (left, index, date, lastTimelineBlock) {
                let resBlock = null;
                if (index > 0 && weekday == Weekday.First) {
                    weekIndex++;
                    firstWeek = false;
                    even = !even;
                }
                if (index == 0 || weekday == Weekday.First) {
                    let childCount = timeline.resolutionDiv.childElementCount;
                    if (timeline.isValidChildIndex(weekIndex, childCount)) {
                        resBlock = timeline.resolutionDiv.childNodes.item(weekIndex);
                    }
                    else {
                        timeline.logIndexOutOfBounds("week", weekIndex, childCount);
                        return;
                    }
                }
                timeline.fillWeekResolutionBlock(resBlock, date, weekIndex, weekday, firstWeek, lastTimelineBlock, left, even);
            },
            calcDaysLeftInFirstWeek: function (startDay) {
                let daysLeftInWeek = 0;
                if (startDay != timeline.firstDayOfWeek) {
                    for (let i = startDay;; i++) {
                        daysLeftInWeek++;
                        if (Math.max(i % 8, 1) === timeline.lastDayOfWeek) {
                            break;
                        }
                    }
                }
                return daysLeftInWeek;
            },
            isEven: function (startDate, startDay) {
                let visibleRangeNormalStartDate = timeline.toNormalDate(startDate);
                if (timeline.normalStartDate.getTime() < visibleRangeNormalStartDate.getTime()) {
                    let daysHidden = Math.floor(((visibleRangeNormalStartDate.getTime() - timeline.normalStartDate.getTime()) / DateTimeConstants.DAY_INTERVAL));
                    console.log("Days hidden: " + daysHidden);
                    console.log("firstWeekBlockHidden = " + timeline.firstWeekBlockHidden);
                    if (daysHidden === 0) {
                        return false;
                    }
                    let daysLeftInFirstWeek = this.calcDaysLeftInFirstWeek(startDay);
                    if (daysHidden > daysLeftInFirstWeek) {
                        daysHidden -= daysLeftInFirstWeek;
                    }
                    let weeks = daysHidden / DateTimeConstants.DAYS_IN_WEEK;
                    let even = (weeks % 2) === 1;
                    return (timeline.firstWeekBlockHidden) ? !even : even;
                }
                return false;
            },
            getFirstDayOfVisibleRange: function (startDate) {
                let visibleRangeNormalStartDate = timeline.toNormalDate(startDate);
                if (timeline.normalStartDate.getTime() < visibleRangeNormalStartDate.getTime()) {
                    let days = Math.floor(((visibleRangeNormalStartDate.getTime() - timeline.normalStartDate.getTime()) / DateTimeConstants.DAY_INTERVAL));
                    return ((timeline.firstDayOfRange - 1 + days) % 7) + 1;
                }
                return timeline.firstDayOfRange;
            }
        });
    }
    logIndexOutOfBounds(indexName, index, childCount) {
        console.log("${indexName} index ${index} out of bounds with childCount ${childCount}. Can't fill content.");
    }
    fillTimelineForHour(interval, startDate, endDate, resBlockFiller) {
        let currentYear = null;
        let pos = startDate;
        let end = endDate;
        let index = 0;
        let lastTimelineBlock = false;
        let date;
        resBlockFiller.setup();
        while (pos <= end) {
            date = pos;
            let nextHour = new Date(pos.getTime() + interval);
            lastTimelineBlock = nextHour.getTime() > end.getTime();
            resBlockFiller.fillResolutionBlock(index, date, currentYear, lastTimelineBlock);
            pos = nextHour;
            index++;
        }
    }
    fillTimelineForDayOrWeek(interval, startDate, endDate, resBlockFiller) {
        let currentYear = null;
        let pos = startDate;
        pos = DateUtil.adjustToMiddleOfDay(pos, this.localeDataProvider.getLocale());
        let end = endDate;
        let index = 0;
        let lastTimelineBlock = false;
        let date;
        let isDST = false;
        let previousIsDST = this.localeDataProvider.isDaylightTime(startDate);
        resBlockFiller.setup();
        while (!lastTimelineBlock) {
            let dstAdjusted = this.getDSTAdjustedDate(previousIsDST, pos);
            date = dstAdjusted;
            pos = dstAdjusted;
            isDST = this.localeDataProvider.isDaylightTime(date);
            lastTimelineBlock = this.getDSTAdjustedDate(isDST, new Date(date.getTime() + interval)).getTime() > end.getTime();
            resBlockFiller.fillResolutionBlock(index, date, currentYear, lastTimelineBlock);
            previousIsDST = isDST;
            pos = new Date(pos.getTime() + interval);
            index++;
        }
    }
    isValidChildIndex(index, childCount) {
        return (index >= 0) && (index < childCount);
    }
    fillDayResolutionBlock(resBlock, date, index, weekend, left) {
        resBlock.innerText = this.localeDataProvider.formatDate(date, "d");
        if (weekend) {
            resBlock.classList.add(TimelineElement_1.STYLE_WEEKEND);
        }
        else {
            resBlock.classList.remove(TimelineElement_1.STYLE_WEEKEND);
        }
        if (this.setPositionForEachBlock && this.isTimelineOverflowingHorizontally()) {
            resBlock.style.position = "relative";
            resBlock.style.left = left + "px";
        }
    }
    fillWeekResolutionBlock(resBlock, date, index, weekDay, firstWeek, lastBlock, left, even) {
        if (resBlock != null) {
            resBlock.innerText = this.formatWeekCaption(date);
            if (even) {
                resBlock.classList.add(TimelineElement_1.STYLE_EVEN);
            }
            else {
                resBlock.classList.remove(TimelineElement_1.STYLE_EVEN);
            }
            if (this.setPositionForEachBlock && this.isTimelineOverflowingHorizontally()) {
                resBlock.style.position = "relative";
                resBlock.style.left = left + "px";
            }
            resBlock.classList.remove(TimelineElement_1.STYLE_FIRST, TimelineElement_1.STYLE_LAST);
        }
        if (firstWeek && (weekDay === Weekday.Last || lastBlock)) {
            let firstEl = this.resolutionDiv.firstElementChild;
            if (!firstEl.classList.contains(TimelineElement_1.STYLE_FIRST)) {
                firstEl.classList.add(TimelineElement_1.STYLE_FIRST);
            }
        }
        else if (lastBlock) {
            let lastEl = this.resolutionDiv.lastChild;
            if (!lastEl.classList.contains(TimelineElement_1.STYLE_LAST)) {
                lastEl.classList.add(TimelineElement_1.STYLE_LAST);
            }
        }
    }
    fillHourResolutionBlock(resBlock, date, index, hourCounter, lastBlock, left, even) {
        if (this.localeDataProvider.isTwelveHourClock()) {
            resBlock.innerText = this.localeDataProvider.formatDate(date, "h");
        }
        else {
            resBlock.innerText = this.localeDataProvider.formatDate(date, "HH");
        }
        if (even) {
            resBlock.classList.add(TimelineElement_1.STYLE_EVEN);
        }
        else {
            resBlock.classList.remove(TimelineElement_1.STYLE_EVEN);
        }
        if (this.firstDay && (hourCounter == 24 || lastBlock)) {
            this.firstDay = false;
            this.firstResBlockCount = index + 1;
        }
        else if (lastBlock) {
            this.lastResBlockCount = (index + 1 - this.firstResBlockCount) % 24;
        }
        if (this.setPositionForEachBlock && this.isTimelineOverflowingHorizontally()) {
            resBlock.style.position = "relative";
            resBlock.style.left = left + "px";
        }
    }
};
TimelineElement.STYLE_ROW = "row";
TimelineElement.STYLE_COL = "col";
TimelineElement.STYLE_MONTH = "month";
TimelineElement.STYLE_YEAR = "year";
TimelineElement.STYLE_DAY = "day";
TimelineElement.STYLE_WEEK = "w";
TimelineElement.STYLE_RESOLUTION = "resolution";
TimelineElement.STYLE_EVEN = "even";
TimelineElement.STYLE_WEEKEND = "weekend";
TimelineElement.STYLE_SPACER = "spacer";
TimelineElement.STYLE_FIRST = "f-col";
TimelineElement.STYLE_CENTER = "c-col";
TimelineElement.STYLE_LAST = "l-col";
TimelineElement.STYLE_MEASURE = "measure";
__decorate([
    property({
        reflect: true,
        converter: {
            fromAttribute: (value, type) => {
                return Resolution[value];
            },
            toAttribute: (value, type) => {
                return Resolution[value];
            }
        }
    })
], TimelineElement.prototype, "resolution", void 0);
__decorate([
    property({
        reflect: true,
        converter: {
            fromAttribute: (value, type) => {
                return (value) ? (value.length > 13) ? value.substring(0, 13) : value : value;
            },
        }
    })
], TimelineElement.prototype, "startDateTime", void 0);
__decorate([
    property({
        reflect: true,
        converter: {
            fromAttribute: (value, type) => {
                return (value) ? (value.length > 13) ? value.substring(0, 13) : value : value;
            },
        }
    })
], TimelineElement.prototype, "endDateTime", void 0);
__decorate([
    property({ reflect: true })
], TimelineElement.prototype, "timeZone", void 0);
__decorate([
    property({ reflect: true })
], TimelineElement.prototype, "locale", void 0);
__decorate([
    property({ reflect: true })
], TimelineElement.prototype, "firstDayOfWeek", void 0);
__decorate([
    property({ reflect: true })
], TimelineElement.prototype, "twelveHourClock", void 0);
__decorate([
    property()
], TimelineElement.prototype, "minWidth", void 0);
__decorate([
    property()
], TimelineElement.prototype, "normalStartDate", void 0);
__decorate([
    property()
], TimelineElement.prototype, "normalEndDate", void 0);
__decorate([
    property()
], TimelineElement.prototype, "lastDayOfWeek", void 0);
__decorate([
    property()
], TimelineElement.prototype, "firstDayOfRange", void 0);
__decorate([
    property()
], TimelineElement.prototype, "firstHourOfRange", void 0);
__decorate([
    property({ reflect: true })
], TimelineElement.prototype, "scrollContainerId", void 0);
__decorate([
    property()
], TimelineElement.prototype, "monthRowVisible", void 0);
__decorate([
    property()
], TimelineElement.prototype, "yearRowVisible", void 0);
__decorate([
    property()
], TimelineElement.prototype, "monthNames", void 0);
__decorate([
    property()
], TimelineElement.prototype, "weekdayNames", void 0);
__decorate([
    query('#resolutionDiv')
], TimelineElement.prototype, "resolutionDiv", void 0);
TimelineElement = TimelineElement_1 = __decorate([
    customElement('timeline-element')
], TimelineElement);
export { TimelineElement };
//# sourceMappingURL=timeline-element.js.map