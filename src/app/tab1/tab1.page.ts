import { Component } from '@angular/core';
import {DataServiceAPIService} from "../services/data-service-api.service";
import {LoadingController, ToastController} from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import {BackgroundFetch} from '@transistorsoft/capacitor-background-fetch';
import {BackgroundRunner} from "@capacitor/background-runner";

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


    // @ts-ignore
    this.sim_id = localStorage.getItem("sim_id");

    this.init().then(r => {});


  }

  ngAfterContentInit() {
    this.initBackgroundFetch();
  }

  async initBackgroundFetch() {

    console.log("KAR12345");

    const status = await BackgroundFetch.configure({
      minimumFetchInterval: 15
    }, async (taskId) => {  // <---------------- Event handler.
      console.log('[BackgroundFetch] EVENT:', taskId);
      // Perform your work in an awaited Promise
      const result = await this.performYourWorkHere();
      console.log('[BackgroundFetch] work complete:', result);
      // [REQUIRED] Signal to the OS that your work is complete.
      await BackgroundFetch.finish(taskId);
    }, async (taskId) => {  // <---------------- Event timeout handler
      // The OS has signalled that your remaining background-time has expired.
      // You must immediately complete your work and signal #finish.
      console.log('[BackgroundFetch] TIMEOUT:', taskId);
      // [REQUIRED] Signal to the OS that your work is complete.
      await BackgroundFetch.finish(taskId);
      console.log("KAR1234");
    });

    // Checking BackgroundFetch status:
    if (status !== BackgroundFetch.STATUS_AVAILABLE) {
      // Uh-oh:  we have a problem:
      if (status === BackgroundFetch.STATUS_DENIED) {
        alert('The user explicitly disabled background behavior for this app or for the whole system.');
      } else if (status === BackgroundFetch.STATUS_RESTRICTED) {
        alert('Background updates are unavailable and the user cannot enable them again.')
      }
    }
  }

  // Simulate a long-running task (eg:  an HTTP request)
  async performYourWorkHere() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log("KAR1234");
        resolve(true);
      }, 5000);
    });
  }


  async testLoad() {
    const result = await BackgroundRunner.dispatchEvent({
      label: 'com.capacitor.background.check',
      event: 'testLoad',
      details: {},
    });
    console.log('load result', result);
  }


  async init() {
    await this.testLoad().then(r => {});
    try {
      const permissions = await BackgroundRunner.requestPermissions({
        apis: ['notifications'],
      });
      console.log('permissions', permissions);
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
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


        // recall it self in the bg, every 30 minutes.
        setTimeout(() => { this.getData(); }, 1000 * 30);

      },
      error: (error) => {
        if(loading !== null) {
          loading.dismiss();
        }
        //alert('Check your internet connection..');
        setTimeout(() => {
          this.getData();
        }, 8000);
      }
    });
  }

  public format(response: any) {
    response.location = response.location.toLowerCase();
    this.locations = response.location.split(",");
  }

}
