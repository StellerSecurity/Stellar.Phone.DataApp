import { Component } from '@angular/core';
import {DataServiceAPIService} from "../services/data-service-api.service";
import {AlertController, LoadingController, NavController, ToastController} from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { COUNTRY_CODES } from '../data/country-code';
import { ModalController } from '@ionic/angular';
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
              private loadingCtrl: LoadingController,public alertController: AlertController,private navCtrl: NavController) {

    this.localNotifications();

    // @ts-ignore
    this.sim_id = localStorage.getItem("sim_id");


  }

  
  cssprop = 'circular-chart nill';
  strokes = '0 ,100';
  value = 100;
 getPercentOfData(){
  this.value = (this.data?.total_usage/ this.data?.total_data) * 100
  if (Number(this.value) > 0 && Number(this.value) <= 50) {
    this.cssprop = 'circular-chart green';
    this.strokes =  this.value +' ,'+100;
  }
  else if(Number(this.value) > 50 && Number(this.value) < 80) {
    this.cssprop = 'circular-chart yellow';
    this.strokes =  this.value +' ,'+100;
  }
  else if(Number(this.value) > 80 && Number(this.value) < 100) {
    this.cssprop = 'circular-chart red';
    this.strokes =  this.value +' ,'+100;
  }  


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
  // filterItems() {
  //   this.filteredItems = this.items.filter(item =>
  //     item.name.toLowerCase().includes(this.searchText.toLowerCase())
  //   );
  // }

  getCountryFullName(countryCode: string): string {
    return COUNTRY_CODES[countryCode.toLowerCase()] || 'Unknown';
  }
  showModal = false;
  toggleModal() {
    this.showModal = !this.showModal;
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
        message: 'Getting Data info',
        cssClass: 'loader-popup',
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
        this.getPercentOfData()
       

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
  filteredLocations:any
  public format(response: any) {
    response.location = response.location.toLowerCase();
    this.locations = response.location.split(",");
    this.filteredLocations = this.locations;
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Log out',
      message: 'Are you sure you want to log out',
      cssClass: 'logout-popup general-popup',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Cancel clicked');
          }
        }, {
          text: 'Logout',
          handler: (data) => {
            console.log('OK clicked', data);
            // Call your function here passing the data if needed
            this.logout();
          }
        }
      ]
    });
    alert.present();
  }
logout(){
  localStorage.removeItem('sim_id');
  localStorage.removeItem('stored_data');
  setTimeout(() => {
    this.navCtrl.navigateForward('/');
  }, 20);
  
}
searchText = '';
filterLocations() {
  this.filteredLocations = this.locations.filter((countryCode:any) =>
    this.getCountryFullName(countryCode).toLowerCase().includes(this.searchText.toLowerCase())
  );
}
}
