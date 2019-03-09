import 'axe-core/axe';
import { axeReport } from 'pwa-helpers/axe-report';

import { AppDatepicker } from '../../app-datepicker';
import { defaultLocale } from '../test-config';
import { getTestName, queryInit } from '../test-helpers';

import { START_VIEW } from '../../app-datepicker';

const { isNotNull } = chai.assert;
const name = AppDatepicker.is;

describe(getTestName(name), () => {
  describe('a11y', () => {
    let el: AppDatepicker;
    let t: ReturnType<typeof queryInit>;

    beforeEach(async () => {
      el = document.createElement(name) as AppDatepicker;
      document.body.appendChild(el);

      el.locale = defaultLocale;
      el.startView = START_VIEW.CALENDAR;
      await el.updateComplete;

      t = queryInit(el);
    });

    afterEach(() => {
      document.body.removeChild(el);
    });

    it(`is accesible (calendar view)`, async () => axeReport(el));
    it(`is accesible (year list view)`, async () => {
      el.startView = START_VIEW.YEAR_LIST;
      await el.updateComplete;

      const yearListViewFullListEl = t.getYearListViewFullList();
      isNotNull(yearListViewFullListEl, `Year list view not found`);

      return axeReport(el);
    });
  });
});