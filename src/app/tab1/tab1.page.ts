import { Component } from '@angular/core';
import {
  AlertController,
  LoadingController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TranslateService } from '@ngx-translate/core';

import { DataServiceAPIService } from '../services/data-service-api.service';
import { COUNTRY_CODES } from '../data/country-code';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
  public data: any = null;
  public locations: string[] = [];
  public filteredLocations: string[] = [];

  public sim_id = '';
  public availableInCountriesLabel = '';

  public SIM_ID_COPIED = '';
  public COULD_NOT_LOAD = '';
  public REFRESH_SUCCESS = '';
  public REFRESH_FAILED = '';
  public LOADING_DATA = '';
  public LOGOUT_TITLE = '';
  public LOGOUT_MESSAGE = '';
  public LOGOUT = '';
  public CANCEL = '';
  public NO_USAGE_YET = '';

  public UPDATED_LABEL = '';
  public SAVED_DATA_VIEW = '';
  public REFRESH_ISSUE = '';
  public RETRY = '';
  public LOW_DATA_REMAINING = '';
  public EXPIRES_SOON = '';
  public REMAINING_DATA = '';
  public USED_LABEL = '';
  public EXPIRES_SHORT = '';
  public ACCOUNT_SHORT = '';
  public STATUS_LABEL = '';
  public NEED_MORE_DATA = '';
  public COVERAGE_LABEL = '';
  public VIEW_ALL = '';
  public SUPPORTED_COUNTRIES_LABEL = '';
  public CLOSE_LABEL = '';
  public SEARCH_COUNTRY_LABEL = '';
  public NO_COUNTRIES_FOUND_LABEL = '';
  public DAYS_LEFT = '';
  public GB_USED = '';
  public GB_TOTAL = '';
  public COVERAGE_INFORMATION_UNAVAILABLE = '';
  public USED_FROM = '';

  public cssprop = 'circular-chart nill';
  public strokes = '0, 100';
  public value = 0;
  public showModal = false;
  public searchText = '';
  public isLoading = false;
  public isRefreshing = false;
  public hasError = false;
  public errorMessage = '';
  public showingCachedData = false;
  public lastUpdatedLabel = '';
  public isCopying = false;

  constructor(
    private toastController: ToastController,
    public dataServiceAPIService: DataServiceAPIService,
    private loadingCtrl: LoadingController,
    public alertController: AlertController,
    private navCtrl: NavController,
    public _translate: TranslateService
  ) {
    this.sim_id = localStorage.getItem('sim_id') || '';
    this.bindTranslations();
    this.loadCachedData();
    this.localNotifications().catch(() => {});
    Preferences.set({
      key: 'sim_id',
      value: this.sim_id,
    }).catch(() => {});
  }

  ionViewWillEnter(): void {
    this.getData().catch(() => {});
  }

  get isDataReady(): boolean {
    return this.data !== null;
  }

  get hasLocations(): boolean {
    return this.filteredLocations.length > 0;
  }

  get daysUntilExpire(): number {
    return Number(this.data?.days_until_expire ?? 0);
  }

  get isLowData(): boolean {
    const remaining = this.parseNumber(this.data?.remaining);
    const total = this.parseNumber(this.data?.total_data);
    return total > 0 && remaining > 0 && remaining / total <= 0.2;
  }

  get isExpiringSoon(): boolean {
    return this.daysUntilExpire > 0 && this.daysUntilExpire <= 7;
  }

  get percentUsedRounded(): number {
    return Math.max(0, Math.min(100, Math.round(Number(this.value || 0))));
  }

  get usageSummaryText(): string {
    const used = this.parseNumber(this.data?.total_usage);

    if (used === 0) {
      return this.NO_USAGE_YET;
    }

    return `${used} GB`;
  }

  get remainingSummaryText(): string {
    return this.data?.remaining || '0 GB';
  }

  get formattedLastUpdated(): string {
    return this.lastUpdatedLabel;
  }

  get usedTotalSummaryText(): string {
    return `${this.data?.total_usage || 0} ${this.GB_USED}`;
  }

  get totalAllowanceSummaryText(): string {
    return `${this.data?.total_data || 0} ${this.GB_TOTAL}`;
  }

  get statusSummaryText(): string {
    return `${this.USED_FROM} ${this.data?.total_data || 0} GB`;
  }

  get countriesHeadingText(): string {
    return `${this.SUPPORTED_COUNTRIES_LABEL} (${this.locations.length})`;
  }

  async handleRefresh(event: any): Promise<void> {
    this.isRefreshing = true;

    try {
      await this.getData({ silent: true, forceRefresh: true });

      const toast = await this.toastController.create({
        message: this.REFRESH_SUCCESS,
        duration: 2200,
        position: 'bottom',
      });

      await toast.present();
    } catch {
      const toast = await this.toastController.create({
        message: this.REFRESH_FAILED,
        duration: 3000,
        position: 'bottom',
      });

      await toast.present();
    } finally {
      this.isRefreshing = false;
      event.target.complete();
    }
  }

  async copy(): Promise<void> {
    if (!this.sim_id) return;

    await Clipboard.write({
      string: this.sim_id,
    });

    this.isCopying = true;
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

    const toast = await this.toastController.create({
      message: this.SIM_ID_COPIED,
      duration: 1800,
      position: 'bottom',
    });

    await toast.present();

    setTimeout(() => {
      this.isCopying = false;
    }, 1200);
  }

  getCountryFullName(countryCode: string): string {
    return COUNTRY_CODES[countryCode.toLowerCase()] || countryCode.toUpperCase();
  }

  toggleModal(force?: boolean): void {
    this.showModal = typeof force === 'boolean' ? force : !this.showModal;

    if (!this.showModal) {
      this.searchText = '';
      this.filteredLocations = [...this.locations];
    }
  }

  public upgradePlan(): void {
    window.open('https://stellarsecurity.com/contact-us', '_blank');
  }

  async retryLoad(): Promise<void> {
    await this.getData({ forceRefresh: true });
  }

  filterLocations(): void {
    const term = this.searchText.toLowerCase().trim();

    this.filteredLocations = this.locations.filter((countryCode: string) =>
      this.getCountryFullName(countryCode).toLowerCase().includes(term)
    );
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.LOGOUT_TITLE,
      message: this.LOGOUT_MESSAGE,
      cssClass: 'logout-popup general-popup',
      buttons: [
        {
          text: this.CANCEL,
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.LOGOUT,
          handler: () => {
            this.logout().catch(() => {});
          },
        },
      ],
    });

    await alert.present();
  }

  async logout(): Promise<void> {
    localStorage.clear();
    await Preferences.clear();
    await this.navCtrl.navigateRoot('/sim-input?clear=1');
  }

  private async localNotifications(): Promise<void> {
    const permissions = await LocalNotifications.checkPermissions();

    if (permissions.display !== 'granted') {
      const newPermissions = await LocalNotifications.requestPermissions();
      if (newPermissions.display === 'denied') {
        return;
      }
    }
  }

  private bindTranslations(): void {
    this._translate
      .stream([
        'SIM_ID_COPIED',
        'COULD_NOT_LOAD',
        'REFRESH_SUCCESS',
        'REFRESH_FAILED',
        'LOADING_DATA',
        'LOGOUT_TITLE',
        'LOGOUT_MESSAGE',
        'LOGOUT',
        'CANCEL',
        'NO_USAGE_YET',
        'UPDATED_LABEL',
        'SAVED_DATA_VIEW',
        'REFRESH_ISSUE',
        'RETRY',
        'LOW_DATA_REMAINING',
        'EXPIRES_SOON',
        'REMAINING_DATA',
        'USED_LABEL',
        'EXPIRES_SHORT',
        'ACCOUNT_SHORT',
        'STATUS_LABEL',
        'NEED_MORE_DATA',
        'COVERAGE_LABEL',
        'VIEW_ALL',
        'SUPPORTED_COUNTRIES_LABEL',
        'CLOSE_LABEL',
        'SEARCH_COUNTRY_LABEL',
        'NO_COUNTRIES_FOUND_LABEL',
        'DAYS_LEFT',
        'GB_USED',
        'GB_TOTAL',
        'COVERAGE_INFORMATION_UNAVAILABLE',
        'USED_FROM',
      ])
      .subscribe((t: any) => {
        this.SIM_ID_COPIED = t.SIM_ID_COPIED;
        this.COULD_NOT_LOAD = t.COULD_NOT_LOAD;
        this.REFRESH_SUCCESS = t.REFRESH_SUCCESS;
        this.REFRESH_FAILED = t.REFRESH_FAILED;
        this.LOADING_DATA = t.LOADING_DATA;
        this.LOGOUT_TITLE = t.LOGOUT_TITLE;
        this.LOGOUT_MESSAGE = t.LOGOUT_MESSAGE;
        this.LOGOUT = t.LOGOUT;
        this.CANCEL = t.CANCEL;
        this.NO_USAGE_YET = t.NO_USAGE_YET;

        this.UPDATED_LABEL = t.UPDATED_LABEL;
        this.SAVED_DATA_VIEW = t.SAVED_DATA_VIEW;
        this.REFRESH_ISSUE = t.REFRESH_ISSUE;
        this.RETRY = t.RETRY;
        this.LOW_DATA_REMAINING = t.LOW_DATA_REMAINING;
        this.EXPIRES_SOON = t.EXPIRES_SOON;
        this.REMAINING_DATA = t.REMAINING_DATA;
        this.USED_LABEL = t.USED_LABEL;
        this.EXPIRES_SHORT = t.EXPIRES_SHORT;
        this.ACCOUNT_SHORT = t.ACCOUNT_SHORT;
        this.STATUS_LABEL = t.STATUS_LABEL;
        this.NEED_MORE_DATA = t.NEED_MORE_DATA;
        this.COVERAGE_LABEL = t.COVERAGE_LABEL;
        this.VIEW_ALL = t.VIEW_ALL;
        this.SUPPORTED_COUNTRIES_LABEL = t.SUPPORTED_COUNTRIES_LABEL;
        this.CLOSE_LABEL = t.CLOSE_LABEL;
        this.SEARCH_COUNTRY_LABEL = t.SEARCH_COUNTRY_LABEL;
        this.NO_COUNTRIES_FOUND_LABEL = t.NO_COUNTRIES_FOUND_LABEL;
        this.DAYS_LEFT = t.DAYS_LEFT;
        this.GB_USED = t.GB_USED;
        this.GB_TOTAL = t.GB_TOTAL;
        this.COVERAGE_INFORMATION_UNAVAILABLE = t.COVERAGE_INFORMATION_UNAVAILABLE;
        this.USED_FROM = t.USED_FROM;

        if (this.locations.length > 0) {
          this.updateAvailableCountriesLabel();
        }
      });
  }

  private loadCachedData(): void {
    const storedData = localStorage.getItem('stored_data');
    const storedAt = localStorage.getItem('stored_data_updated_at');

    if (!storedData) {
      return;
    }

    try {
      const parsed = JSON.parse(storedData);
      this.data = parsed;
      this.showingCachedData = true;
      this.format(this.data);
      this.getPercentOfData();

      if (storedAt) {
        this.lastUpdatedLabel = this.formatDateTime(storedAt);
      }
    } catch {
      localStorage.removeItem('stored_data');
      localStorage.removeItem('stored_data_updated_at');
    }
  }

  private getPercentOfData(): void {
    const totalUsage = this.parseNumber(this.data?.total_usage);
    const totalData = this.parseNumber(this.data?.total_data);

    if (!totalData || totalData <= 0) {
      this.value = 0;
      this.cssprop = 'circular-chart nill';
      this.strokes = '0, 100';
      return;
    }

    this.value = (totalUsage / totalData) * 100;

    if (this.value > 0 && this.value <= 50) {
      this.cssprop = 'circular-chart green';
    } else if (this.value > 50 && this.value < 80) {
      this.cssprop = 'circular-chart yellow';
    } else if (this.value >= 80) {
      this.cssprop = 'circular-chart red';
    } else {
      this.cssprop = 'circular-chart nill';
    }

    this.strokes = `${Math.min(100, Math.max(0, this.value))}, 100`;
  }

  private async getData(options?: { silent?: boolean; forceRefresh?: boolean }): Promise<void> {
    if (!this.sim_id) {
      await this.navCtrl.navigateRoot('/sim-input');
      return;
    }

    if (this.sim_id === '1977' || this.sim_id === '1988') {
      this.data = [];
      this.data.total_data = this.sim_id === '1988' ? 40 : 20;
      this.data.id = this.sim_id;
      this.data.total_usage = 0;
      this.data.remaining = `${this.data.total_data - this.data.total_usage} GB`;
      this.data.expires_at = 'Check Protect App';
      this.data.days_until_expire = 0;
      this.data.location =
        'NO,RS,DE,RU,BE,FI,PT,BG,DK,LT,LU,LV,HR,UA,FR,HU,SE,SI,SK,GB,IE,MK,GG,EE,GI,IM,CH,MT,IS,IT,GR,ES,AT,CY,AX,CZ,JE,PL,RO,LI,NL,TR';
      this.format(this.data);
      this.getPercentOfData();
      this.hasError = false;
      return;
    }

    this.isLoading = !options?.silent && !this.data;
    this.hasError = false;
    this.errorMessage = '';

    let loading: HTMLIonLoadingElement | null = null;

    if (!options?.silent && this.data === null) {
      loading = await this.loadingCtrl.create({
        cssClass: 'loader-popup',
        message: this.LOADING_DATA,
      });

      await loading.present();
    }

    try {
      const response = await new Promise<any>((resolve, reject) => {
        this.dataServiceAPIService.getOverview(this.sim_id).subscribe({
          next: (result) => resolve(result),
          error: (error) => reject(error),
        });
      });

      if (loading) {
        await loading.dismiss();
      }

      this.data = response;
      this.showingCachedData = false;
      this.hasError = false;
      this.errorMessage = '';

      const updatedAt = new Date().toISOString();
      localStorage.setItem('stored_data', JSON.stringify(response));
      localStorage.setItem('stored_data_updated_at', updatedAt);
      this.lastUpdatedLabel = this.formatDateTime(updatedAt);

      this.format(this.data);
      this.getPercentOfData();
    } catch (error) {
      if (loading) {
        await loading.dismiss();
      }

      this.hasError = true;
      this.errorMessage = this.COULD_NOT_LOAD;
      this.showingCachedData = !!this.data;

      if (!this.data) {
        this.data = null;
      }

      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  public format(response: any): void {
    const rawLocations = String(response?.location || '')
      .toLowerCase()
      .split(',')
      .map((value: string) => value.trim())
      .filter((value: string) => !!value);

    this.locations = rawLocations;
    this.filteredLocations = [...this.locations];
    this.updateAvailableCountriesLabel();
  }

  private updateAvailableCountriesLabel(): void {
    this._translate
      .stream('AVAILABLE_IN_COUNTRIES', { number: this.locations.length })
      .subscribe((res: string) => {
        this.availableInCountriesLabel = res;
      });
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private formatDateTime(value: string): string {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value));
    } catch {
      return value;
    }
  }
}
