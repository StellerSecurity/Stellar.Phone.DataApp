import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonContent, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sim-input',
  templateUrl: './sim-input.page.html',
  styleUrls: ['./sim-input.page.scss'],
})
export class SimInputPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content?: IonContent;

  public userInput: string = '';
  private sim_id: string | null = '';

  public HOME_WELCOME = '';
  public HOME_ENTER_SIM_ID = '';
  public HOME_INPUT = '';
  public HOME_BUTTON_LOGIN = '';
  public HOME_HELP = '';
  public HOME_HELP_CONTACT_LINK = '';

  constructor(
    public alertController: AlertController,
    private navCtrl: NavController,
    public _translate: TranslateService,
    private route: ActivatedRoute
  ) {
    this._language();

    this.route.queryParams.subscribe((params) => {
      if (params && params['clear'] == 1) {
        window.location.href = '/sim-input';
      }
    });
  }

  ngOnInit() {}

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

  async saveInput(): Promise<void> {
    const trimmed = (this.userInput || '').trim();

    if (trimmed === '') {
      const alert = await this.alertController.create({
        header: 'Enter SIM ID',
        message: 'Please enter your sim id.',
        buttons: ['OK'],
        cssClass: 'general-popup',
      });
      await alert.present();
      return;
    }

    this.sim_id = localStorage.getItem('sim_id');

    if (this.sim_id === null) {
      localStorage.setItem('sim_id', trimmed);
      this.sim_id = trimmed;
    }

    await this.navCtrl.navigateForward('/tabs/tab1');
  }

  _language(): void {
    this._translate.get('HOME_WELCOME').subscribe((res: string) => {
      this.HOME_WELCOME = res;
    });

    this._translate.get('HOME_ENTER_SIM_ID').subscribe((res: string) => {
      this.HOME_ENTER_SIM_ID = res;
    });

    this._translate.get('HOME_INPUT').subscribe((res: string) => {
      this.HOME_INPUT = res;
    });

    this._translate.get('HOME_HELP').subscribe((res: string) => {
      this.HOME_HELP = res;
    });

    this._translate.get('HOME_BUTTON_LOGIN').subscribe((res: string) => {
      this.HOME_BUTTON_LOGIN = res;
    });

    this._translate.get('HOME_HELP_CONTACT_LINK').subscribe((res: string) => {
      this.HOME_HELP_CONTACT_LINK = res;
    });
  }
}
