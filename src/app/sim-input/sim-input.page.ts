import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonContent, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-sim-input',
  templateUrl: './sim-input.page.html',
  styleUrls: ['./sim-input.page.scss'],
})
export class SimInputPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content?: IonContent;

  public userInput = '';
  public isSubmitting = false;
  public validationMessage = '';

  private sim_id: string | null = '';

  public HOME_WELCOME = '';
  public HOME_ENTER_SIM_ID = '';
  public HOME_INPUT = '';
  public HOME_BUTTON_LOGIN = '';
  public HOME_HELP = '';
  public HOME_HELP_CONTACT_LINK = '';
  public HOME_INPUT_HINT = '';
  public HOME_INPUT_ERROR = '';
  public HOME_CONTINUE_SAVED = '';
  public HOME_USE_DIFFERENT = '';
  public HOME_SAVED_SIM = '';
  public HOME_EMPTY_ALERT_TITLE = '';
  public HOME_EMPTY_ALERT_MESSAGE = '';
  public HOME_OK = '';

  public savedSimId: string | null = null;

  constructor(
    public alertController: AlertController,
    private navCtrl: NavController,
    public _translate: TranslateService,
    private route: ActivatedRoute
  ) {
    this.bindTranslations();

    this.route.queryParams.subscribe((params) => {
      if (params && params['clear'] == 1) {
        localStorage.removeItem('sim_id');
        localStorage.removeItem('stored_data');
        this.savedSimId = null;
        this.userInput = '';
        this.validationMessage = '';
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.savedSimId = localStorage.getItem('sim_id');
    if (this.savedSimId) {
      this.userInput = this.savedSimId;
    }
  }

  get isValidInput(): boolean {
    return this.getNormalizedSimId(this.userInput).length >= 4;
  }

  get hasSavedSim(): boolean {
    return !!this.savedSimId;
  }

  async scrollFocusedIntoView(): Promise<void> {
    setTimeout(async () => {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return;

        const item = (active.closest('ion-item') as HTMLElement | null) ?? active;
        const rect = item.getBoundingClientRect();
        const targetY = rect.top + window.scrollY - 140;

        if (this.content) {
          await this.content.scrollToPoint(0, Math.max(0, targetY), 250);
        } else {
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      } catch {
        // ignore
      }
    }, 50);
  }

  onInputChange(value: string | number | null | undefined): void {
    this.userInput = String(value ?? '');
    this.validationMessage = '';

    if (this.userInput.trim().length > 0 && !this.isValidInput) {
      this.validationMessage = this.HOME_INPUT_ERROR;
    }
  }

  async useSavedSim(): Promise<void> {
    if (!this.savedSimId) return;
    await this.navCtrl.navigateRoot('/tabs/tab1');
  }

  useDifferentSim(): void {
    this.userInput = '';
    this.validationMessage = '';
    this.savedSimId = null;
    localStorage.removeItem('sim_id');
    localStorage.removeItem('stored_data');
  }

  async saveInput(): Promise<void> {
    const trimmed = this.getNormalizedSimId(this.userInput);

    if (trimmed === '') {
      const alert = await this.alertController.create({
        header: this.HOME_EMPTY_ALERT_TITLE,
        message: this.HOME_EMPTY_ALERT_MESSAGE,
        buttons: [this.HOME_OK],
        cssClass: 'general-popup',
      });
      await alert.present();
      return;
    }

    if (!this.isValidInput) {
      this.validationMessage = this.HOME_INPUT_ERROR;
      return;
    }

    this.isSubmitting = true;

    try {
      this.sim_id = localStorage.getItem('sim_id');

      if (this.sim_id !== trimmed) {
        localStorage.setItem('sim_id', trimmed);
        localStorage.removeItem('stored_data');
      }

      await Preferences.set({
        key: 'sim_id',
        value: trimmed,
      });

      await this.navCtrl.navigateRoot('/tabs/tab1');
    } finally {
      this.isSubmitting = false;
    }
  }

  private getNormalizedSimId(value: string): string {
    return (value || '').trim();
  }

  private bindTranslations(): void {
    this._translate
      .stream([
        'HOME_WELCOME',
        'HOME_ENTER_SIM_ID',
        'HOME_INPUT',
        'HOME_BUTTON_LOGIN',
        'HOME_HELP',
        'HOME_HELP_CONTACT_LINK',
        'HOME_INPUT_HINT',
        'HOME_INPUT_ERROR',
        'HOME_CONTINUE_SAVED',
        'HOME_USE_DIFFERENT',
        'HOME_SAVED_SIM',
        'HOME_EMPTY_ALERT_TITLE',
        'HOME_EMPTY_ALERT_MESSAGE',
        'HOME_OK',
      ])
      .subscribe((t: any) => {
        this.HOME_WELCOME = t.HOME_WELCOME;
        this.HOME_ENTER_SIM_ID = t.HOME_ENTER_SIM_ID;
        this.HOME_INPUT = t.HOME_INPUT;
        this.HOME_BUTTON_LOGIN = t.HOME_BUTTON_LOGIN;
        this.HOME_HELP = t.HOME_HELP;
        this.HOME_HELP_CONTACT_LINK = t.HOME_HELP_CONTACT_LINK;
        this.HOME_INPUT_HINT = t.HOME_INPUT_HINT;
        this.HOME_INPUT_ERROR = t.HOME_INPUT_ERROR;
        this.HOME_CONTINUE_SAVED = t.HOME_CONTINUE_SAVED;
        this.HOME_USE_DIFFERENT = t.HOME_USE_DIFFERENT;
        this.HOME_SAVED_SIM = t.HOME_SAVED_SIM;
        this.HOME_EMPTY_ALERT_TITLE = t.HOME_EMPTY_ALERT_TITLE;
        this.HOME_EMPTY_ALERT_MESSAGE = t.HOME_EMPTY_ALERT_MESSAGE;
        this.HOME_OK = t.HOME_OK;
      });
  }
}
