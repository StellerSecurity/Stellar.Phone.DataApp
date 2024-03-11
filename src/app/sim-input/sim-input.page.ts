import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-sim-input',
  templateUrl: './sim-input.page.html',
  styleUrls: ['./sim-input.page.scss'],
})
export class SimInputPage implements OnInit {
  public userInput: string = '';
  private sim_id: string | null = '';
  constructor(public alertController: AlertController, private navCtrl: NavController) {}

  async saveInput() {
    const alert = await this.alertController.create({
      header: 'Enter SIM ID',
      message: 'Please enter your sim id.',
      buttons: ['OK'],
    });
    this.sim_id = localStorage.getItem('sim_id');

    if (this.userInput.trim() === '') {
      await alert.present();
    }
    if (this.sim_id === null) {
      localStorage.setItem('sim_id', this.userInput);
      this.sim_id = this.userInput;
      this.navCtrl.navigateForward('/tabs/tab1');
    }
  }
  floatLabel(labelValue:any) {debugger
    const label = document.querySelector('.custom-label');
    labelValue?.classList.add('float-label');
  }
  ngOnInit() {}
}
