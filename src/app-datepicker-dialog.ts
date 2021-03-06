export interface DatepickerDialogClosedDetail {
  opened: boolean;
  value: AppDatepickerDialog['value'];
}

import '@material/mwc-button/mwc-button.js';
import { css, customElement, html, LitElement, property, query } from 'lit-element';

import { START_VIEW } from './app-datepicker.js';
import './app-datepicker.js';
import { WEEK_NUMBER_TYPE } from './calendar.js';
import { datepickerVariables } from './common-styles.js';
import {
  dispatchCustomEvent,
  FocusTrap,
  getResolvedDate,
  getResolvedLocale,
  KEYCODES_MAP,
  setFocusTrap,
  toFormattedDateString,
} from './datepicker-helpers.js';

const opts: KeyframeAnimationOptions = { duration: 100 };

@customElement(AppDatepickerDialog.is)
export class AppDatepickerDialog extends LitElement {
  static get is() { return 'app-datepicker-dialog'; }

  static get styles() {
    // tslint:disable: max-line-length
    return [
      datepickerVariables,
      css`
      :host {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;

        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: var(--app-datepicker-dialog-z-index, 24);
        -webkit-tap-highlight-color: rgba(0,0,0,0);

        --mdc-theme-primary: var(--app-datepicker-primary-color, #1a73e8);
      }

      .scrim,
      .content-container {
        pointer-events: auto;
      }

      .scrim {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, .25);
        visibility: hidden;
        z-index: 22;
      }

      .content-container {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: 100%;
        max-height: 100%;
        background-color: #fff;
        transform: translate3d(-50%, -50%, 0);
        border-radius: var(--app-datepicker-dialog-border-radius, 8px);
        will-change: transform, opacity;
        overflow: hidden;
        visibility: hidden;
        opacity: 0;
        z-index: 23;
      }

      .datepicker {
        --app-datepicker-border-bottom-left-radius: 0;
        --app-datepicker-border-bottom-right-radius: 0;
      }

      .actions-container {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        margin: 0;
        padding: 12px;
        background-color: inherit;
        color: var(--app-datepicker-primary-color, #1a73e8);
      }

      mwc-button + mwc-button {
        margin: 0 0 0 8px;
      }

      /**
       * NOTE: IE11-only fix via CSS hack.
       * Visit https://bit.ly/2DEUNZu|CSS for more relevant browsers' hacks.
       */
      @media screen and (-ms-high-contrast: none) {
        mwc-button[dialog-dismiss] {
          min-width: 10ch;
        }
      }
      `,
    ];
    // tslint:enable: max-line-length
  }

  @property({ type: Number, reflect: true })
  public firstDayOfWeek: number = 0;

  @property({ type: Boolean, reflect: true })
  public showWeekNumber: boolean = false;

  @property({ type: String, reflect: true })
  public weekNumberType: WEEK_NUMBER_TYPE = WEEK_NUMBER_TYPE.FIRST_4_DAY_WEEK;

  @property({ type: Boolean, reflect: true })
  public landscape: boolean = false;

  @property({ type: String, reflect: true })
  public startView: START_VIEW = START_VIEW.CALENDAR;

  @property({ type: String, reflect: true })
  public min?: string;

  @property({ type: String, reflect: true })
  public max?: string;

  @property({ type: String })
  public value?: string = toFormattedDateString(getResolvedDate());

  @property({ type: String })
  public locale: string = getResolvedLocale();

  @property({ type: String })
  public disabledDays: string = '';

  @property({ type: String })
  public disabledDates?: string;

  @property({ type: String })
  public weekLabel: string = '';

  @property({ type: Number })
  public dragRatio: number = .15;

  @property({ type: String })
  public dismissLabel: string = 'cancel';

  @property({ type: String })
  public confirmLabel: string = 'ok';

  @property({ type: Boolean })
  public noFocusTrap: boolean = false;

  @query('.scrim')
  private _scrim?: HTMLDivElement;

  @query('.content-container')
  private _contentContainer?: HTMLDivElement;

  @query('.datepicker')
  private _datepicker?: import('./app-datepicker').AppDatepicker;

  @query('mwc-button[dialog-confirm]')
  private _dialogConfirm?: HTMLElement;

  private _focusable?: HTMLElement;
  private _focusTrap?: FocusTrap;
  private _opened?: boolean = false;

  public open() {
    this.removeAttribute('aria-hidden');
    this.style.display = 'block';
    this._opened = true;
    this.requestUpdate();

    return this.updateComplete.then(() => {
      const contentContainer = this._contentContainer!;
      const keyframes: Keyframe[] = [
        { opacity: '0' },
        { opacity: '1' },
      ];

      this._scrim!.style.visibility = contentContainer.style.visibility = 'visible';

      const fadeInAnimationTask = new Promise(yay =>
        ((contentContainer.animate(keyframes, opts)).onfinish = yay));

      return fadeInAnimationTask.then(() => {
        contentContainer.style.opacity = '1';

        const focusable = this._focusable!;
        if (!this.noFocusTrap) {
          this._focusTrap = setFocusTrap(this, [focusable, this._dialogConfirm!])!;
        }
        focusable.focus();
        dispatchCustomEvent(this, 'datepicker-dialog-opened', { opened: true, value: this.value });
      });
    });
  }

  public close() {
    this._scrim!.style.visibility = '';

    return this.updateComplete.then(() => {
      const contentContainer = this._contentContainer!;
      const keyframes: Keyframe[] = [
        { opacity: '1' },
        { opacity: '0' },
      ];
      const fadeOutAnimationTask = new Promise(yay =>
        ((contentContainer.animate(keyframes, opts)).onfinish = yay));

      return fadeOutAnimationTask.then(() => {
        contentContainer.style.opacity = contentContainer.style.visibility = '';
        this.setAttribute('aria-hidden', 'true');
        this.style.display = 'none';

        if (!this.noFocusTrap) this._focusTrap!.disconnect();
        dispatchCustomEvent<DatepickerDialogClosedDetail>(
          this, 'datepicker-dialog-closed', { opened: false, value: this.value });
      });
    });
  }

  protected shouldUpdate() {
    return !this.hasAttribute('aria-hidden');
  }

  protected firstUpdated() {
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-label', 'datepicker');
    this.setAttribute('aria-modal', 'true');
    this.setAttribute('aria-hidden', 'true');
    this.addEventListener('keyup', (ev: KeyboardEvent) => {
      if (ev.keyCode === KEYCODES_MAP.ESCAPE) this.close();
    });

    dispatchCustomEvent(this, 'datepicker-dialog-first-updated', { value: this.value });
  }

  protected render() {
    return html`
    <div class="scrim" @click="${this.close}"></div>

    ${this._opened ? html`<div class="content-container">
    <app-datepicker class="datepicker"
      .min="${this.min}"
      .max="${this.max}"
      .firstDayOfWeek="${this.firstDayOfWeek}"
      .showWeekNumber="${this.showWeekNumber}"
      .weekNumberType="${this.weekNumberType}"
      .disabledDays="${this.disabledDays}"
      .disabledDates="${this.disabledDates}"
      .landscape="${this.landscape}"
      .locale="${this.locale}"
      .dragRatio="${this.dragRatio}"
      .startView="${this.startView}"
      .value="${this.value}"
      .weekLabel="${this.weekLabel}"
      @datepicker-first-updated="${this._setFocusable}"
      @datepicker-value-updated="${this._update}"></app-datepicker>

      <div class="actions-container">
        <mwc-button dialog-dismiss @click="${this.close}">${this.dismissLabel}</mwc-button>
        <mwc-button dialog-confirm @click="${this._update}">${this.confirmLabel}</mwc-button>
      </div>
    </div>` : null}
    `;
  }

  private _updateValue() {
    this.value = this._datepicker!.value;
  }

  private _update() {
    this._updateValue();
    this.close();
  }

  private _setFocusable(ev: CustomEvent) {
    this._focusable = ev.detail && ev.detail.firstFocusableElement;
    this._updateValue();
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'app-datepicker-dialog': AppDatepickerDialog;
  }
}
