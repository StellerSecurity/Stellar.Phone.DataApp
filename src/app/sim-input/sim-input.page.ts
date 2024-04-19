import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import {TranslateService} from "@ngx-translate/core";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-sim-input',
  templateUrl: './sim-input.page.html',
  styleUrls: ['./sim-input.page.scss'],
})
export class SimInputPage implements OnInit {
  public userInput: string = '';
  private sim_id: string | null = '';


  public HOME_WELCOME = "";
  public HOME_ENTER_SIM_ID = "";
  public HOME_INPUT = "";
  public HOME_BUTTON_LOGIN = "";
  public HOME_HELP = "";
  public HOME_HELP_CONTACT_LINK = "";

  constructor(public alertController: AlertController, private navCtrl: NavController, public _translate: TranslateService, private route: ActivatedRoute) {
    this._language();
    this.route.queryParams.subscribe(params => {
        if(params != null) {
          if(params['clear'] == 1) {
            window.location.href = '/sim-input';
          }
        }
    });
  }

  async saveInput() {debugger
    const alert = await this.alertController.create({
      header: 'Enter SIM ID',
      message: 'Please enter your sim id.',
      buttons: ['OK'],
      cssClass: 'general-popup',
    });
    this.sim_id = localStorage.getItem('sim_id');

    if (this.userInput.trim() === '') {
      await alert.present();
      return
    }
    if (this.sim_id === null) {
      localStorage.setItem('sim_id', this.userInput);
      this.sim_id = this.userInput;

    }
    this.navCtrl.navigateForward('/tabs/tab1');
  }
  floatLabel(labelValue:any) {debugger
    const label = document.querySelector('.custom-label');
    labelValue?.classList.add('float-label');
  }
  ngOnInit() {}

  _language() {




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
