import { Component } from '@angular/core';
import {DataServiceAPIService} from "../services/data-service-api.service";
import {LoadingController, ToastController} from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  public data: any = null;

  public locations: any = null;

  private sim_id = "";

  constructor(private toastController: ToastController, public dataServiceAPIService: DataServiceAPIService, private loadingCtrl: LoadingController) {

    // @ts-ignore
    //this.sim_id = localStorage.getItem("sim_id");

    this.sim_id = "9877s";

  }

  handleRefresh(event: any) {
    this.getData();
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 2000);
  }

  ionViewWillEnter() {
    this.getData();
  }

  public async copy() {
    const writeToClipboard = async () => {
      await Clipboard.write({
        string: this.sim_id
      });
    };
    const toast = await this.toastController.create({
      message: 'Sim ID has been copied.',
      duration: 2500,
      position: 'bottom',
    });

    await toast.present();
  }

  public upgradePlan() {
    //const url =`https://stellarsecurity.com/simcard/change?sim_id=${this.sim_id}`
    const url = 'https://stellarsecurity.com/contact-us';
    window.open(url, '_blank');
  }

  private async getData() {

    let stored_data = localStorage.getItem("stored_data");

    if(stored_data !== null) {
      this.format(JSON.parse(stored_data));
      this.data = JSON.parse(stored_data);
    }

    let loading: HTMLIonLoadingElement | null = null;
    if (this.data === null) {
      loading = await this.loadingCtrl.create({
        message: 'Getting data info...',
      });
      await loading.present();
    }

    this.dataServiceAPIService.getOverview(this.sim_id).subscribe({
      next: (response) => {
        if(loading !== null) {
          loading.dismiss();
        }
        this.data = response;
        localStorage.setItem("stored_data",  JSON.stringify(response));

        this.format(this.data);


      },
      error: (error) => {
        if(loading !== null) {
          loading.dismiss();
        }
        alert('Check your internet connection..');
        setTimeout(() => {
          this.getData();
        }, 2000);
      }
    });
  }

  public format(response: any) {
    response.location = response.location.toLowerCase();
    this.locations = response.location.split(",");
  }

}
