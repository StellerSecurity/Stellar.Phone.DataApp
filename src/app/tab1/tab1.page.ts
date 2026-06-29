import { Component } from '@angular/core';
import { DataServiceAPIService } from '../services/data-service-api.service';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { COUNTRY_CODES } from '../data/country-code';
import { TranslateService } from '@ngx-translate/core';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
  public data: any = null;
  public locations: string[] = [];
  public filteredLocations: string[] = [];
  public searchText = '';
  public showModal = false;

  public sim_id = '';

  public isLoading = false;
  public hasError = false;
  public errorMessage = '';
  public showingCachedData = false;
  public isCopying = false;

  public cssprop = 'circular-chart nill';
  public strokes = '0 ,100';
  public value = 0;

  public SIM_ID_COPIED = '';
  public EXPIRES_AT = '';
  public AVAILABLE_TO_USE = '';
  public SUPPORTED_COUNTRIES = '';
  public SEARCH_FOR_COUNTRY = '';
  public SEARCH_CLOSE = '';
  public UPGRADE_YOUR_PLAN = '';
  public LOGOUT = '';
  public LOGOUT_SURE = '';
  public AVAILABLE_IN_COUNTRIES = '';

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
  public CLOSE_LABEL = '';
  public SEARCH_COUNTRY_LABEL = '';
  public NO_COUNTRIES_FOUND_LABEL = '';
  public COVERAGE_INFORMATION_UNAVAILABLE = '';
  public DAYS_LEFT = '';
  public GB_USED = '';
  public GB_TOTAL = '';

  constructor(
    private toastController: ToastController,
    public dataServiceAPIService: DataServiceAPIService,
    private loadingCtrl: LoadingController,
    public alertController: AlertController,
    private navCtrl: NavController,
    public _translate: TranslateService
  ) {
    this.localNotifications().catch(() => {});

    this.sim_id = localStorage.getItem('sim_id') || '';
    this.bindTranslations();

    Preferences.set({
      key: 'sim_id',
      value: this.sim_id,
    }).catch(() => {});
  }

  get isDataReady(): boolean {
    return this.data !== null && !this.isLoading;
  }

  get formattedLastUpdated(): string {
    const raw = this.data?.last_updated || this.data?.updated_at || this.data?.created_at || localStorage.getItem('stored_data_updated_at');
    return this.formatDateTime(raw);
  }

  get percentUsedRounded(): number {
    return Math.max(0, Math.min(100, Math.round(Number(this.value) || 0)));
  }

  get remainingSummaryText(): string {
    const remaining = this.data?.remaining || this.data?.remaining_data || this.formatGb(this.remainingGb);
    return remaining || '0 GB';
  }

  get usedTotalSummaryText(): string {
    const used = this.formatGb(this.usedGb);
    return used ? `${used} ${this.USED_LABEL || 'used'}` : '';
  }

  get totalAllowanceSummaryText(): string {
    const total = this.formatGb(this.totalGb);
    return total ? `${total} ${this.GB_TOTAL || 'total'}` : '';
  }

  get usageSummaryText(): string {
    return `${this.percentUsedRounded}% ${this.USED_LABEL || 'used'}`;
  }

  get statusSummaryText(): string {
    if (this.isLowData && this.isExpiringSoon) {
      return `${this.LOW_DATA_REMAINING || 'Low data remaining'} · ${this.EXPIRES_SOON || 'Expires soon'}`;
    }

    if (this.isLowData) {
      return this.LOW_DATA_REMAINING || 'Low data remaining';
    }

    if (this.isExpiringSoon) {
      return this.EXPIRES_SOON || 'Expires soon';
    }

    return this.AVAILABLE_TO_USE || 'Available to use';
  }

  get daysUntilExpire(): number {
    const value = Number(this.data?.days_until_expire ?? this.data?.remaining_validity_days ?? this.data?.remaining_validity ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  get isLowData(): boolean {
    if (!this.data) {
      return false;
    }

    if (String(this.data?.data_status || '').toLowerCase() === 'low') {
      return true;
    }

    const total = this.totalGb;
    const remaining = this.remainingGb;

    if (total <= 0) {
      return false;
    }

    return remaining / total <= 0.2;
  }

  get isExpiringSoon(): boolean {
    if (!this.data) {
      return false;
    }

    if (String(this.data?.validity_status || '').toLowerCase() === 'expiring') {
      return true;
    }

    return this.daysUntilExpire > 0 && this.daysUntilExpire <= 3;
  }

  get availableInCountriesLabel(): string {
    if (!this.locations || this.locations.length === 0) {
      return '';
    }

    return this.AVAILABLE_IN_COUNTRIES || `Available in ${this.locations.length} countries`;
  }

  get countriesHeadingText(): string {
    return this.availableInCountriesLabel || this.SUPPORTED_COUNTRIES || 'Supported countries';
  }

  private get totalGb(): number {
    return this.numberFromPossibleGb(this.data?.total_data ?? this.data?.total_gb ?? this.data?.data_gb ?? this.data?.total_volume_gb);
  }

  private get usedGb(): number {
    const totalUsage = this.numberFromPossibleGb(this.data?.total_usage ?? this.data?.used_data ?? this.data?.used_gb ?? this.data?.order_usage_gb);
    if (totalUsage > 0) {
      return totalUsage;
    }

    const total = this.totalGb;
    const remaining = this.remainingGb;
    return total > 0 && remaining >= 0 ? Math.max(0, total - remaining) : 0;
  }

  private get remainingGb(): number {
    const direct = this.numberFromPossibleGb(this.data?.remaining ?? this.data?.remaining_data ?? this.data?.remaining_gb);
    if (direct > 0) {
      return direct;
    }

    const total = this.totalGb;
    const used = this.usedGb;
    return total > 0 ? Math.max(0, total - used) : 0;
  }

  public ionViewWillEnter(): void {
    this.getData().catch(() => {});
  }

  public async handleRefresh(event: any): Promise<void> {
    await this.getData(true);

    if (event?.target?.complete) {
      event.target.complete();
    }
  }

  public async retryLoad(): Promise<void> {
    await this.getData(true);
  }

  public async copy(): Promise<void> {
    await Clipboard.write({ string: this.sim_id });
    this.isCopying = true;

    const toast = await this.toastController.create({
      message: this.SIM_ID_COPIED || 'SIM ID copied',
      duration: 2000,
      position: 'bottom',
    });

    await toast.present();

    setTimeout(() => {
      this.isCopying = false;
    }, 1500);
  }

  public getCountryFullName(countryCode: string): string {
    return COUNTRY_CODES[String(countryCode || '').toLowerCase()] || countryCode || 'Unknown';
  }

  public toggleModal(open?: boolean): void {
    this.showModal = typeof open === 'boolean' ? open : !this.showModal;
  }

  public upgradePlan(): void {
    const topupUrl = this.data?.topup_url || this.data?.top_up_url || this.data?.links?.topup || this.data?.links?.top_up;
    const topupToken = this.data?.topup_token || this.data?.top_up_token;

    if (topupUrl) {
      window.open(topupUrl, '_blank');
      return;
    }

    if (topupToken) {
      window.open(`/topup/${encodeURIComponent(topupToken)}`, '_blank');
      return;
    }

    window.open('https://stellarsecurity.com/contact-us', '_blank');
  }

  public async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.LOGOUT || 'Log out',
      message: this.LOGOUT_SURE || 'Are you sure you want to log out?',
      cssClass: 'logout-popup general-popup',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.LOGOUT || 'Logout',
          handler: () => {
            this.logout().catch(() => {});
          },
        },
      ],
    });

    await alert.present();
  }

  public async logout(): Promise<void> {
    localStorage.clear();
    await Preferences.clear();
    await this.navCtrl.navigateForward('/sim-input?clear=1');
  }

  public filterLocations(): void {
    const query = this.searchText.toLowerCase();
    this.filteredLocations = this.locations.filter((countryCode: string) => this.getCountryFullName(countryCode).toLowerCase().includes(query));
  }

  private async getData(forceRefresh = false): Promise<void> {
    this.hasError = false;
    this.errorMessage = '';

    if (this.sim_id === '1977' || this.sim_id === '1988') {
      const totalData = this.sim_id === '1988' ? 40 : 20;
      this.data = {
        id: this.sim_id,
        total_data: totalData,
        total_usage: 0,
        remaining: `${totalData} GB`,
        expires_at: 'Check Protect App',
        location: 'NO,RS,DE,RU,BE,FI,PT,BG,DK,LT,LU,LV,HR,UA,FR,HU,SE,SI,SK,GB,IE,MK,GG,EE,GI,IM,CH,MT,IS,IT,GR,ES,AT,CY,AX,CZ,JE,PL,RO,LI,NL,TR',
      };
      this.format(this.data);
      this.getPercentOfData();
      return;
    }

    const storedData = localStorage.getItem('stored_data');

    if (!forceRefresh && storedData !== null) {
      try {
        const parsed = JSON.parse(storedData);
        this.data = parsed;
        this.showingCachedData = true;
        this.format(parsed);
        this.getPercentOfData();
      } catch {
        localStorage.removeItem('stored_data');
      }
    }

    let loading: HTMLIonLoadingElement | null = null;

    if (this.data === null) {
      this.isLoading = true;
      loading = await this.loadingCtrl.create({ cssClass: 'loader-popup' });
      await loading.present();
    }

    this.dataServiceAPIService.getOverview(this.sim_id).subscribe({
      next: async (response) => {
        if (loading !== null) {
          await loading.dismiss();
        }

        this.isLoading = false;
        this.hasError = false;
        this.errorMessage = '';
        this.showingCachedData = false;
        this.data = response;

        localStorage.setItem('stored_data', JSON.stringify(response));
        localStorage.setItem('stored_data_updated_at', new Date().toISOString());

        this.format(this.data);
        this.getPercentOfData();

        if (forceRefresh) {
          const toast = await this.toastController.create({
            message: 'Usage updated just now.',
            duration: 2500,
            position: 'bottom',
          });
          await toast.present();
        }
      },
      error: async () => {
        if (loading !== null) {
          await loading.dismiss();
        }

        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Could not load data. Check your internet connection.';

        const toast = await this.toastController.create({
          message: this.errorMessage,
          duration: 6500,
          position: 'bottom',
        });

        await toast.present();
      },
    });
  }

  public format(response: any): void {
    const location = String(response?.location || response?.locations || '').toLowerCase();
    this.locations = location ? location.split(',').map((item) => item.trim()).filter(Boolean) : [];
    this.filteredLocations = this.locations;

    this._translate.get('AVAILABLE_IN_COUNTRIES', { number: this.locations.length }).subscribe((res: string) => {
      this.AVAILABLE_IN_COUNTRIES = res;
    });
  }

  public getPercentOfData(): void {
    const total = this.totalGb;
    const used = this.usedGb;

    if (total <= 0) {
      this.value = 0;
    } else {
      this.value = Math.max(0, Math.min(100, (used / total) * 100));
    }

    if (this.value > 0 && this.value <= 50) {
      this.cssprop = 'circular-chart green';
    } else if (this.value > 50 && this.value < 80) {
      this.cssprop = 'circular-chart yellow';
    } else if (this.value >= 80) {
      this.cssprop = 'circular-chart red';
    } else {
      this.cssprop = 'circular-chart nill';
    }

    this.strokes = `${this.value} ,100`;
  }

  private async localNotifications(): Promise<void> {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  }

  private bindTranslations(): void {
    this._translate.setDefaultLang('en');
    this._translate
      .stream([
        'SIM_ID_COPIED',
        'EXPIRES_AT',
        'AVAILABLE_TO_USE',
        'SUPPORTED_COUNTRIES',
        'SEARCH_FOR_COUNTRY',
        'SEARCH_CLOSE',
        'UPGRADE_YOUR_PLAN',
        'LOGOUT',
        'LOGOUT_SURE',
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
        'CLOSE_LABEL',
        'SEARCH_COUNTRY_LABEL',
        'NO_COUNTRIES_FOUND_LABEL',
        'COVERAGE_INFORMATION_UNAVAILABLE',
        'DAYS_LEFT',
        'GB_USED',
        'GB_TOTAL',
      ])
      .subscribe((t: any) => {
        this.SIM_ID_COPIED = t.SIM_ID_COPIED;
        this.EXPIRES_AT = t.EXPIRES_AT;
        this.AVAILABLE_TO_USE = t.AVAILABLE_TO_USE;
        this.SUPPORTED_COUNTRIES = t.SUPPORTED_COUNTRIES;
        this.SEARCH_FOR_COUNTRY = t.SEARCH_FOR_COUNTRY;
        this.SEARCH_CLOSE = t.SEARCH_CLOSE;
        this.UPGRADE_YOUR_PLAN = t.UPGRADE_YOUR_PLAN;
        this.LOGOUT = t.LOGOUT;
        this.LOGOUT_SURE = t.LOGOUT_SURE;
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
        this.CLOSE_LABEL = t.CLOSE_LABEL;
        this.SEARCH_COUNTRY_LABEL = t.SEARCH_COUNTRY_LABEL;
        this.NO_COUNTRIES_FOUND_LABEL = t.NO_COUNTRIES_FOUND_LABEL;
        this.COVERAGE_INFORMATION_UNAVAILABLE = t.COVERAGE_INFORMATION_UNAVAILABLE;
        this.DAYS_LEFT = t.DAYS_LEFT;
        this.GB_USED = t.GB_USED;
        this.GB_TOTAL = t.GB_TOTAL;
      });
  }

  private numberFromPossibleGb(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const match = String(value).replace(',', '.').match(/[0-9]+(?:\.[0-9]+)?/);
    return match ? Number(match[0]) : 0;
  }

  private formatGb(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '';
    }

    return `${value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} GB`;
  }

  private formatDateTime(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
