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

  constructor(private toastController: ToastController, public dataServiceAPIService: DataServiceAPIService, private loadingCtrl: LoadingController) {}

  handleRefresh(event: any) {
    this.getData();
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 2000);
  }

  ionViewWillEnter() {
    this.sim_id = "9a1c1454-bd6d-4d1d-bc7d-44932ab2c146";
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

  private async getData() {

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

        console.log(response);

        response.location = response.location.toLowerCase();
        this.locations = response.location.split(",");

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

}
