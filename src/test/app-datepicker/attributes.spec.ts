import { START_VIEW } from '../../app-datepicker';
import { WEEK_NUMBER_TYPE } from '../../calendar';
import { OptionsDragTo } from '../test-helpers';

import { AppDatepicker } from '../../app-datepicker';
import {
  getResolvedDate,
  hasClass,
  toFormattedDateString,
} from '../../datepicker-helpers';
import {
  date13,
  date15,
  date17,
  defaultLocale,
} from '../test-config';
import {
  dragTo,
  getComputedStylePropertyValue,
  getShadowInnerHTML,
  queryInit,
  setupDragPoint,
} from '../test-helpers';

const {
  isTrue,
  strictEqual,
  isNotNull,
} = chai.assert;

describe('app-datepicker', () => {
  describe('attributes', () => {
    let el: AppDatepicker;
    let t: ReturnType<typeof queryInit>;

    beforeEach(async () => {
      el = document.createElement('app-datepicker') as AppDatepicker;
      el.locale = defaultLocale;
      el.startView = START_VIEW.CALENDAR;

      document.body.appendChild(el);
      t = queryInit(el);

      await el.updateComplete;
    });

    afterEach(() => {
      document.body.removeChild(el);
    });

    it(`renders with correct 'min'`, async () => {
      const minVal = date15;
      const valueVal = date17;

      el.setAttribute('min', minVal);
      el.value = valueVal;
      await el.updateComplete;

      const firstSelectableDate = t.getSelectableDate('Jan 15, 2020')
      const allDisabledDates = t.getAllDisabledDates();
      const focusedDate = t.getFocusedDate();
      const lastDayBeforeMinDate = allDisabledDates.reduce((p, n) => {
        const pDay = +p.day;
        const nDay = +n.day;

        /**
         * NOTE: `15` means day of `date15`.
         */
        return nDay > pDay && nDay < 15 ? n : p;
      });

      isNotNull(firstSelectableDate, 'First selectable date not found');
      isNotNull(lastDayBeforeMinDate, `Last day before 'min' not found`);
      isNotNull(focusedDate, 'Focused date not found');

      isTrue(!hasClass(firstSelectableDate, 'day--disabled'), 'First selectable is disabled day');
      strictEqual(
        lastDayBeforeMinDate.getAttribute('aria-label'),
        'Jan 14, 2020',
        `Last day before 'min' not matched`);
      strictEqual(
        focusedDate.getAttribute('aria-label'),
        'Jan 17, 2020',
        'Focused date not matched');

      strictEqual(el.min, minVal, `'min' property not matched`);
      strictEqual(el.value, valueVal, `'value' property not matched`);
      strictEqual(el.getAttribute('min'), minVal, `'min' attribute not matched`);

      el.value = date13;
      await el.updateComplete;

      isTrue(
        !hasClass(focusedDate, 'day--focused'),
        `Focused date not matched ('value' < 'min')`);
      strictEqual(el.value, date13, `New 'value' not matched ('value' < 'min')`);

      el.setAttribute('min', ''); /** Any falsy value, but here only tests empty string */
      await el.updateComplete;

      const newFocusedDateWithoutMin = t.getFocusedDate();
      isNotNull(newFocusedDateWithoutMin, `New focused date not found`);
      strictEqual(el.min, '', `New 'min' not matched`);
      strictEqual(el.getAttribute('min'), '', `New 'min' attribute not matched`);
      strictEqual(
        newFocusedDateWithoutMin.getAttribute('aria-label'),
        'Jan 13, 2020',
        `New focused date not matched with no 'min'`);
    });

    it(`renders with correct 'max'`, async () => {
      const maxVal = date15;
      const valueVal = date13;

      el.setAttribute('max', maxVal);
      el.value = valueVal;
      await el.updateComplete;

      const lastSelectableDate = t.getSelectableDate('Jan 15, 2020');
      const allDisabledDates = t.getAllDisabledDates();
      const focusedDate = t.getFocusedDate();
      const firstDayAfterMaxDate = allDisabledDates.reduceRight((p, n) => {
        const pDay = +p.day;
        const nDay = +n.day;

        /**
         * NOTE: `15` means day of `date15`.
         */
        return nDay < pDay && nDay > 15 ? n : p;
      });

      isNotNull(lastSelectableDate, 'Last selectable date not found');
      isNotNull(firstDayAfterMaxDate, `Last day before 'min' not found`);
      isNotNull(focusedDate, 'Focused date not found');

      isTrue(!hasClass(lastSelectableDate, 'day--disabled'), 'Last selectable is disabled day');
      strictEqual(
        firstDayAfterMaxDate.getAttribute('aria-label'),
        'Jan 16, 2020',
        `First day after 'max' not matched`);
      strictEqual(
        focusedDate.getAttribute('aria-label'),
        'Jan 13, 2020',
        'Focused date not matched');

      strictEqual(el.max, maxVal, `'max' property not matched`);
      strictEqual(el.value, valueVal, `'value' property not matched`);
      strictEqual(el.getAttribute('max'), maxVal, `'max' attribute not matched`);

      el.value = date17;
      await el.updateComplete;

      isTrue(
        !hasClass(focusedDate, 'day--focused'),
        `Focused date not matched ('value' > 'max')`);
      strictEqual(el.value, date17, `New 'value' not matched ('value' > 'max')`);

      el.setAttribute('max', ''); /** Any falsy value, but here only tests empty string */
      await el.updateComplete;

      const newFocusedDateWithoutMax = t.getFocusedDate();
      isNotNull(newFocusedDateWithoutMax, `New focused date not found`);
      strictEqual(el.max, '', `New 'max' not matched`);
      strictEqual(el.getAttribute('max'), '', `New 'max' not matched`);
      strictEqual(
        newFocusedDateWithoutMax.getAttribute('aria-label'),
        'Jan 17, 2020',
        `New focused date not matched with no 'max'`);
    });

    it(`renders with correct 'value'`, async () => {
      const todayDate = getResolvedDate();

      strictEqual(
        el.value,
        toFormattedDateString(todayDate),
        `'value' does not match with today's date`);

      const val = date15;

      /** NOTE: To ensure 'min' is lesser than 'val' */
      el.min = date13;
      el.setAttribute('value', val);
      await el.updateComplete;

      strictEqual(el.value, val, `New 'value' not matched`);
      strictEqual(el.getAttribute('value'), val, `New 'value' attribute not matched`);
    });

    it(`renders with correct 'startView'`, async () => {
      /**
       * NOTE: Not testing initial `startView="yearList"`,
       * assuming that works if this test passes.
       */
      strictEqual(el.startView, START_VIEW.CALENDAR, `Incorrect initial 'startView'`);
      strictEqual(
        el.getAttribute('startview'),
        START_VIEW.CALENDAR,
        `Incorrect initial 'startview' attribute`);

      /** FIXME: Shady DOM only supports all attributs in lowercase */
      el.setAttribute('startview', START_VIEW.YEAR_LIST);
      await el.updateComplete;

      const yearListView = t.getDatepickerBodyYearListView();
      strictEqual(el.startView, START_VIEW.YEAR_LIST, `New 'startView' not matched`);
      strictEqual(
        el.getAttribute('startview'),
        START_VIEW.YEAR_LIST,
        `New 'startview' attribute not matched`);
      isNotNull(yearListView, `Year list view not found`);
    });

    it(`renders with correct 'firstDayOfWeek'`, async () => {
      strictEqual(el.firstDayOfWeek, 0, `'firstDayOfWeek' not matched`);

      /** NOTE: Ensure dates are not disabled during testings */
      el.min = date13;
      el.value = date15;
      await el.updateComplete;

      const expectedFirstDayInMonthIdx = [
        4,
        3,
        2,
        1,
        0,
        6,
        5,
        4,
        3,
        2,
      ];

      for (let i = -1; i < 9; i += 1) {
        el.setAttribute('firstdayofweek', `${i}`);
        await el.updateComplete;

        const fullCalendarDays = t.getAllCalendarDays();
        const firstDayInMonthIdx = fullCalendarDays.findIndex(n => !hasClass(n, 'day--empty'));

        strictEqual(el.firstDayOfWeek, i, `New 'firstDayOfWeek' (${i}) not matched`);
        strictEqual(
          el.getAttribute('firstdayofweek'),
          `${i}`,
          `New 'firstdayofweek' attribute (${i}) not matched`);
        strictEqual(
          firstDayInMonthIdx,
          expectedFirstDayInMonthIdx[1 + i],
          `Week index not matched with new 'firstDayOfWeek' (${i})`);
      }
    });

    it(`renders with 'showWeekNumber'`, async () => {
      isTrue(!el.showWeekNumber, `'showWeekNumber' is true`);
      isTrue(!el.hasAttribute('showweeknumber'), `'showweeknumber' attribute is set`);

      el.setAttribute('showweeknumber', '');
      await el.updateComplete;

      const weekdays = t.getAllWeekdays();
      const weekNumberLabel = weekdays && weekdays[0] && getShadowInnerHTML(weekdays[0]);

      strictEqual(weekNumberLabel, 'Wk', `Week number label not found`);
      isTrue(el.showWeekNumber, `'showWeekNumber' is false`);
      isTrue(el.hasAttribute('showweeknumber'), `'showweeknumber' attribute is not set`);
    });

    it(`renders with correct 'weekNumberType'`, async () => {
      el.min = date13;
      el.value = date15;
      el.showWeekNumber = true;
      await el.updateComplete;

      strictEqual(
        el.weekNumberType,
        WEEK_NUMBER_TYPE.FIRST_4_DAY_WEEK,
        `'weekNumberType' not matched`);
      strictEqual(
        el.getAttribute('weeknumbertype'),
        WEEK_NUMBER_TYPE.FIRST_4_DAY_WEEK,
        `'weeknumbertype' attribute not matched`);

      const allWeekNumberTypes = [
        WEEK_NUMBER_TYPE.FIRST_4_DAY_WEEK,
        WEEK_NUMBER_TYPE.FIRST_DAY_OF_YEAR,
        WEEK_NUMBER_TYPE.FIRST_FULL_WEEK,
      ];
      const expectedWeekdayLabels = [1, 1, 52];

      for (let i = 0; i < 3; i += 1) {
        const weekNumberType = allWeekNumberTypes[i];

        el.setAttribute('weeknumbertype', weekNumberType);
        await el.updateComplete;

        const firstWeekdayLabel = getShadowInnerHTML(t.getFirstWeekdayLabel());
        strictEqual(
          el.weekNumberType,
          weekNumberType,
          `'weekNumberType' not matched ('${weekNumberType}')`);
        strictEqual(
          el.getAttribute('weeknumbertype'),
          weekNumberType,
          `'weeknumbertype' attribute not matched ('${weekNumberType}')`);
        strictEqual(
          firstWeekdayLabel,
          `${expectedWeekdayLabels[i]}`,
          `First weekday label not matched ('${weekNumberType}')`);
      }
    });

    it(`renders with correct 'landscape'`, async () => {
      strictEqual(el.landscape, false, `'landscape' not matched`);
      strictEqual(
        getComputedStylePropertyValue(el, 'display'),
        'block',
        `Element has no 'display: block'`);

      el.setAttribute('landscape', '');
      await el.updateComplete;

      isTrue(el.landscape, `'landscape' not matched`);
      isTrue(el.hasAttribute('landscape'), `No 'landscape' attribute set`);
      strictEqual(
        getComputedStylePropertyValue(el, 'display'),
        'flex',
        `Element has no 'display: flex`);
    });

    it(`renders with different 'locale'`, async () => {
      const getBtnSelectorCalendarInnerHTML =
        () => getShadowInnerHTML(t.getBtnCalendarSelector());
      const getCalendarWeekdaysInnerHTML =
        () => t.getAllWeekdays().map(n => getShadowInnerHTML(n)).join(', ');

      el.min = date13;
      el.value = date15;
      el.showWeekNumber = false;
      el.firstDayOfWeek = 0;
      await el.updateComplete;

      strictEqual(el.locale, defaultLocale, `'locale' not matched`);
      strictEqual(
        getBtnSelectorCalendarInnerHTML(),
        'Wed, Jan 15',
        `Formatted date in '${defaultLocale}' not matched`);
      isTrue(
        [
          /** Safari 9 with Intl.js polyfill (andyearnshaw/Intl.js#326) */
          'Sun, Mon, Tue, Wed, Thu, Fri, Sat',
          'Su, Mo, Tu, We, Th, Fr, Sa', /** IE11 */
          'S, M, T, W, T, F, S', /** Other browsers */
        ].some(n => n === getCalendarWeekdaysInnerHTML()),
        `Formatted weekdays in '${defaultLocale}' not matched`);

      const jaJpLocale = 'ja-JP';
      el.setAttribute('locale', jaJpLocale);
      await el.updateComplete;

      strictEqual(el.locale, jaJpLocale, `'locale' not matched ('${jaJpLocale}')`);
      strictEqual(
        el.getAttribute('locale'),
        jaJpLocale,
        `'locale' attribute not matched ('${jaJpLocale}')`);
      /**
       * NOTE: In IE11, there is a whitespace in between. This checks for 2 different kinds of
       * formatting on different browsers.
       */
      isTrue(
        [
          '水, 1月15日', /** IE11 on Win7 */
          '1月15日 (水)', /** IE11 on Win10 */
          '1月15日(水)', /** Other browsers */
        ].some(n => n === getBtnSelectorCalendarInnerHTML()),
        `Formatted date in '${jaJpLocale}' not matched ('${jaJpLocale}')`);
      strictEqual(
        getCalendarWeekdaysInnerHTML(),
        '日, 月, 火, 水, 木, 金, 土',
        `Formatted weekdays in '${jaJpLocale}' not matched ('${jaJpLocale}')`);
    });

    it(`renders with different 'disabledDays'`, async () => {
      const getAllDisabledDays = () =>
        t.getAllDisabledDates().map(n => n.getAttribute('aria-label')!);

      el.value = date13;
      await el.updateComplete;

      const allDisabledDays = getAllDisabledDays();

      isTrue(
        [
          ['Jan 4, 2020', 'Jan 04, 2020'],
          ['Jan 5, 2020', 'Jan 05, 2020'],
          ['Jan 11, 2020'],
          ['Jan 12, 2020'],
          ['Jan 18, 2020'],
          ['Jan 19, 2020'],
          ['Jan 25, 2020'],
          ['Jan 26, 2020'],
        ].every((n, i) => n.some(o => o === allDisabledDays[i])),
        `All disabled days not matched`);

      /**
       * NOTE: Simple testing here instead of a full suite tests with a
       * comprehensive combination of disabled days.
       */
      el.setAttribute('disableddays', '1,3,5');
      await el.updateComplete;

      const allNewDisabledDays = getAllDisabledDays();

      strictEqual(el.disabledDays, '1,3,5', `'disabledDays' not matched`);
      strictEqual(
        el.getAttribute('disableddays'),
        '1,3,5',
        `'disableddays' attribute not matched`);
      isTrue(
        [
          ['Jan 1, 2020', 'Jan 01, 2020'],
          ['Jan 3, 2020', 'Jan 03, 2020'],
          ['Jan 6, 2020', 'Jan 06, 2020'],
          ['Jan 8, 2020', 'Jan 08, 2020'],
          ['Jan 10, 2020'],
          ['Jan 13, 2020'],
          ['Jan 15, 2020'],
          ['Jan 17, 2020'],
          ['Jan 20, 2020'],
          ['Jan 22, 2020'],
          ['Jan 24, 2020'],
          ['Jan 27, 2020'],
          ['Jan 29, 2020'],
          ['Jan 31, 2020'],
        ].every((n, i) => n.some(o => o === allNewDisabledDays[i])),
        `All new disabled days not matched (disabledDays=1,3,5)`);

      el.setAttribute('disableddays', '');
      await el.updateComplete;

      strictEqual(el.disabledDays, '', `'disabledDays' not reset`);
      strictEqual(el.getAttribute('disableddays'), '', `'disableddays' attribute not reset`);
      isTrue(
        getAllDisabledDays().length === 0,
        `All disabled days not reset`);
    });

    it(`renders with different 'disabledDates'`, async () => {
      const getAllDisabledDays = () =>
        t.getAllDisabledDates().map(n => n.getAttribute('aria-label')!);

      /**
       * NOTE: It is to ensure not other disabled days on the calendar of the datepicker.
       */
      el.value = date13;
      el.disabledDays = '';
      await el.updateComplete;

      strictEqual(el.disabledDays, '', `'disabledDays' not reset`);
      isTrue(getAllDisabledDays().length === 0, `Disabled days not reset`);

      /**
       * NOTE: Simple testing here instead of a full suite tests with a comprehensive combination
       * of disabled dates.
       */
      el.setAttribute('disableddates', '2020-01-06, 2020-01-16, 2020-01-23');
      await el.updateComplete;

      const allNewDisabledDays = getAllDisabledDays();

      strictEqual(
        el.disabledDates,
        '2020-01-06, 2020-01-16, 2020-01-23',
        `New 'disabledDates' not matched`);
      strictEqual(
        el.getAttribute('disableddates'),
        '2020-01-06, 2020-01-16, 2020-01-23',
        `New 'disableddates' attribute not matched`);
      isTrue(
        [
          ['Jan 6, 2020', 'Jan 06, 2020'],
          ['Jan 16, 2020'],
          ['Jan 23, 2020'],
        ].every((n, i) => n.some(o => o === allNewDisabledDays[i])),
        `New disabled dates not matched`);

      el.setAttribute('disableddates', '');
      await el.updateComplete;

      strictEqual(el.disabledDates, '', `'disabledDates' not reset`);
      strictEqual(el.getAttribute('disableddates'), '', `'disableddates' attribute not reset`);
      isTrue(getAllDisabledDays().length === 0, `All disabled dates not reset`);
    });

    it(`renders with optional 'weekLabel'`, async () => {
      el.locale = defaultLocale;
      el.showWeekNumber = true;
      await el.updateComplete;

      const weekLabelEl = t.getWeekLabel();
      strictEqual(el.weekLabel, '', `'weekLabel' not matched`);
      strictEqual(getShadowInnerHTML(weekLabelEl), 'Wk', `Week label not matched`);

      const newWeekLabel = '周数';
      el.setAttribute('weeklabel', newWeekLabel);
      await el.updateComplete;

      strictEqual(el.weekLabel, newWeekLabel, `New 'weekLabel' not matched`);
      strictEqual(
        el.getAttribute('weeklabel'),
        newWeekLabel,
        `New 'weeklabel' attribute not matched`);
      strictEqual(getShadowInnerHTML(weekLabelEl), newWeekLabel, `New week label not matched`);

      el.setAttribute('weeklabel', '');
      await el.updateComplete;

      strictEqual(el.weekLabel, '', `'weekLabel' not reset`);
      strictEqual(
        el.getAttribute('weeklabel'),
        '',
        `'weeklabel' attribute not reset`);
      strictEqual(getShadowInnerHTML(weekLabelEl), 'Wk', `Week label not reset`);
    });

    it(`renders with optional 'dragRatio'`, async () => {
      strictEqual(el.dragRatio, .15, `Initial 'dragRatio' not matched`);
      isTrue(!el.hasAttribute('dragratio'), `Initial 'dragratio' attribute set`);

      el.min = date13;
      el.value = date15;
      el.setAttribute('dragratio', '.5');
      await el.updateComplete;

      strictEqual(el.dragRatio, .5, `'dragRatio' not matched`);
      strictEqual(el.getAttribute('dragratio'), '.5', `'dragratio' attribute not matched`);

      const btnYearSelectorEl = t.getBtnYearSelector();
      const btnCalendarSelectorEl = t.getBtnCalendarSelector();
      const calendarViewFullCalendarEl = t.getCalendarViewFullCalendar();

      strictEqual(
        getShadowInnerHTML(btnYearSelectorEl),
        '2020',
        `First year selector text not matched`);
      strictEqual(
        getShadowInnerHTML(btnCalendarSelectorEl),
        'Wed, Jan 15',
        `First calendar selector text not matched`);

      const calendarLabel = getShadowInnerHTML(t.getCalendarLabel());
      /** NOTE: [(Safari 9), (Win10 IE 11), (Others)] */
      isTrue(
        ['Jan 2020', 'January, 2020', 'January 2020'].some(n => calendarLabel === n),
        `First calendar label not matched (${calendarLabel})`);

      const oldStartingPoint = setupDragPoint('left', el);
      const oldDragOptions: OptionsDragTo = { ...oldStartingPoint, dx: -50 };
      await dragTo(calendarViewFullCalendarEl, oldDragOptions);
      await t.waitForDragAnimationFinished();

      strictEqual(
        getShadowInnerHTML(btnYearSelectorEl),
        '2020',
        `Year selector text should not change`);
      strictEqual(
        getShadowInnerHTML(btnCalendarSelectorEl),
        'Wed, Jan 15',
        `Calendar selector text should not change`);

      const oldCalendarLabel = getShadowInnerHTML(t.getCalendarLabel());
      /** NOTE: [(Safari 9), (Win10 IE 11), (Others)] */
      isTrue(
        ['Jan 2020', 'January, 2020', 'January 2020'].some(n => oldCalendarLabel === n),
        `Calendar label should not update (${oldCalendarLabel})`);

      const startingPoint = setupDragPoint('left', el);
      const dragOptions: OptionsDragTo = { ...startingPoint, dx: -160 };
      await dragTo(calendarViewFullCalendarEl, dragOptions);
      await t.waitForDragAnimationFinished();

      strictEqual(
        getShadowInnerHTML(btnYearSelectorEl),
        '2020',
        `Year selector text should not change`);
      strictEqual(
        getShadowInnerHTML(btnCalendarSelectorEl),
        'Wed, Jan 15',
        `Calendar selector text should not change`);

      const newCalendarLabel = getShadowInnerHTML(t.getCalendarLabel());
      /** NOTE: [(Safari 9), (Win10 IE 11), (Others)] */
      isTrue(
        ['Feb 2020', 'February, 2020', 'February 2020'].some(n => newCalendarLabel === n),
        `New calendar label not updated (${newCalendarLabel})`);
    });

  });
});
