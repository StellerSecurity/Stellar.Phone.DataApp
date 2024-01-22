import { Component } from '@angular/core';
import {DataServiceAPIService} from "../services/data-service-api.service";
import {LoadingController, ToastController} from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  public data: any = null;

  public locations: any = null;

  private readonly sim_id = "";

  constructor(private toastController: ToastController,
              public dataServiceAPIService: DataServiceAPIService,
              private loadingCtrl: LoadingController) {

    this.localNotifications();

    // @ts-ignore
    this.sim_id = localStorage.getItem("sim_id");



  }

  private async localNotifications() {
    const permissions = await LocalNotifications.checkPermissions();
    console.log('checkPermissions result:', permissions);
    if (permissions.display !== 'granted') {
      const newPermissions = await LocalNotifications.requestPermissions();
      console.log('requestPermissions result:', newPermissions);
      if (newPermissions.display === 'denied') {
        // Always ends up here, without showing any notification permission prompt
        throw new Error(`No permission to show notifications`);
      }
    }

    /*let notifs = await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Stellar Data',
          body: 'You have 1 GB remaining',
          id: 1,
          schedule: { at: new Date(Date.now() + 1000 * 5) },
          actionTypeId: '',
          extra: null,
        },
      ],
    });*/
  }

  handleRefresh(event: any) {
    this.getData();
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 2000);
  }

  ionViewWillEnter() {
    this.getData().then(r => {});
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
        //alert('Check your internet connection..');
        setTimeout(() => {
          this.getData();
        }, 10000);
      }
    });
  }

  public format(response: any) {
    response.location = response.location.toLowerCase();
    this.locations = response.location.split(",");
  }

}
