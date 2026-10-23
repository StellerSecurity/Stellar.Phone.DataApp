import { internalAppRoute } from '../services/app-links';
import { Component } from '@angular/core';
import { AutoTopupStatus, DataServiceAPIService } from '../services/data-service-api.service';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { COUNTRY_CODES } from '../data/country-code';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subject, timeout } from 'rxjs';
import { SimSessionService } from '../services/sim-session.service';
import { autoTopupPayableAmountCents } from '../services/auto-topup-pricing';

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
  public isTopupRedirecting = false;
  public topupRefreshNotice = false;
  public topupRefreshText = '';

  public autoTopupStatus: AutoTopupStatus | null = null;
  public isAutoTopupLoading = false;
  public isAutoTopupUpdating = false;
  public autoTopupError = '';
  public showAutoTopupModal = false;
  public autoTopupModalMode: 'learn' | 'enable' | 'disable' = 'learn';

  private overviewCancel = new Subject<void>();
  private viewActive = false;
  private topupRefreshTimers: any[] = [];
  private topupRefreshHideTimer: any = null;

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
    public _translate: TranslateService,
    private session: SimSessionService
  ) {
    this.sim_id = this.session.currentId;
    this.bindTranslations();

  }

  get isDataReady(): boolean {
    return this.data !== null && !this.isLoading;
  }

  get showAutoTopupCard(): boolean {
    return this.data !== null && this.getAutoTopupSimId() !== '';
  }

  get autoTopupEnabled(): boolean {
    return this.autoTopupStatus?.enabled === true;
  }

  get autoTopupProcessing(): boolean {
    return this.autoTopupStatus?.processing === true;
  }

  get autoTopupSwitchDisabled(): boolean {
    if (this.isAutoTopupLoading || this.isAutoTopupUpdating || !this.autoTopupStatus) {
      return true;
    }

    return !this.autoTopupStatus.can_manage
      || (!this.autoTopupStatus.enabled && !this.autoTopupStatus.can_enable);
  }

  get autoTopupStateLabel(): string {
    if (this.autoTopupStatus?.turn_off_pending_current_topup) {
      return this._translate.instant('AUTO_TOPUP_FINISHING');
    }

    return this.autoTopupEnabled
      ? this._translate.instant('AUTO_TOPUP_ON')
      : this._translate.instant('AUTO_TOPUP_OFF');
  }

  get autoTopupDataLabel(): string {
    const bytes = Number(this.autoTopupStatus?.data_bytes || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '';
    }

    const gb = bytes / Math.pow(1024, 3);
    if (gb >= 1) {
      return `${this.trimNumber(gb)} GB`;
    }

    const mb = bytes / Math.pow(1024, 2);
    return `${this.trimNumber(mb)} MB`;
  }

  get autoTopupPriceLabel(): string {
    const amountCents = autoTopupPayableAmountCents(this.autoTopupStatus);
    const currency = String(this.autoTopupStatus?.currency || '').toUpperCase();

    if (amountCents === null || !/^[A-Z]{3}$/.test(currency)) {
      return '';
    }

    try {
      return new Intl.NumberFormat(this._translate.currentLang || 'en', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${currency}`;
    }
  }

  get autoTopupDescription(): string {
    if (this.autoTopupStatus?.turn_off_pending_current_topup) {
      return this._translate.instant('AUTO_TOPUP_PROCESSING_DESCRIPTION');
    }

    if (this.autoTopupEnabled) {
      return this._translate.instant('AUTO_TOPUP_CARD_DESCRIPTION', {
        data: this.autoTopupDataLabel || this._translate.instant('AUTO_TOPUP_MORE_DATA'),
      });
    }

    if (this.autoTopupStatus?.can_enable) {
      return this._translate.instant('AUTO_TOPUP_OFF_DESCRIPTION', {
        data: this.autoTopupDataLabel || this._translate.instant('AUTO_TOPUP_MORE_DATA'),
      });
    }

    return this.autoTopupUnavailableMessage;
  }

  get autoTopupMetaText(): string {
    if (!this.autoTopupPriceLabel) {
      return '';
    }

    return this._translate.instant('AUTO_TOPUP_META', {
      price: this.autoTopupPriceLabel,
    });
  }

  get autoTopupUnavailableMessage(): string {
    const reason = String(this.autoTopupStatus?.reason_code || '');

    if (reason === 'saved_card_unavailable') {
      return this._translate.instant('AUTO_TOPUP_CARD_REQUIRED');
    }

    if (reason === 'temporarily_unavailable' || reason === 'authorization_sync_pending') {
      return this._translate.instant('AUTO_TOPUP_TEMPORARY_ERROR');
    }

    return this._translate.instant('AUTO_TOPUP_UNAVAILABLE');
  }

  get autoTopupModalTitle(): string {
    if (this.autoTopupModalMode === 'enable') {
      return this._translate.instant('AUTO_TOPUP_ENABLE_TITLE');
    }

    if (this.autoTopupModalMode === 'disable') {
      return this._translate.instant('AUTO_TOPUP_DISABLE_TITLE');
    }

    return this._translate.instant('AUTO_TOPUP_LEARN_TITLE');
  }

  get autoTopupModalBody(): string {
    if (this.autoTopupModalMode === 'enable') {
      return this._translate.instant('AUTO_TOPUP_ENABLE_BODY', {
        data: this.autoTopupDataLabel || this._translate.instant('AUTO_TOPUP_MORE_DATA'),
        price: this.autoTopupPriceLabel,
      });
    }

    if (this.autoTopupModalMode === 'disable') {
      return this._translate.instant('AUTO_TOPUP_DISABLE_BODY');
    }

    if (!this.autoTopupPriceLabel) {
      return this._translate.instant('AUTO_TOPUP_LEARN_BODY_NO_PRICE', {
        data: this.autoTopupDataLabel || this._translate.instant('AUTO_TOPUP_MORE_DATA'),
      });
    }

    return this._translate.instant('AUTO_TOPUP_LEARN_BODY', {
      data: this.autoTopupDataLabel || this._translate.instant('AUTO_TOPUP_MORE_DATA'),
      price: this.autoTopupPriceLabel,
    });
  }

  get autoTopupModalActionLabel(): string {
    if (this.autoTopupModalMode === 'enable') {
      return this._translate.instant('AUTO_TOPUP_ENABLE_ACTION');
    }

    if (this.autoTopupModalMode === 'disable') {
      return this._translate.instant('AUTO_TOPUP_DISABLE_ACTION');
    }

    return this._translate.instant('AUTO_TOPUP_DONE');
  }

  get formattedLastUpdated(): string {
    const raw = this.data?.last_updated || this.data?.updated_at || this.data?.created_at || localStorage.getItem('stored_data_updated_at');
    return this.formatDateTime(raw);
  }

  get percentUsedRounded(): number {
    return Math.max(0, Math.min(100, Math.round(Number(this.value) || 0)));
  }

  get remainingSummaryText(): string {
    const remaining = this.data?.remaining ?? this.data?.remaining_data;
    if (typeof remaining === 'string' && !/^[\d.,\s]+(?:[GMT]B)?$/i.test(remaining)) return remaining;
    return this.formatGb(this.remainingGb) || '0 GB';
  }

  get usedTotalSummaryText(): string {
    const used = this.formatGb(this.usedGb) || '0 GB';
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
    const value = this.data?.total_usage ?? this.data?.used_data ?? this.data?.used_gb ?? this.data?.order_usage_gb;
    if (value !== undefined && value !== null && value !== '') return Math.max(0, this.numberFromPossibleGb(value));
    const remaining = this.data?.remaining ?? this.data?.remaining_data ?? this.data?.remaining_gb;
    return remaining !== undefined && remaining !== null
      ? Math.max(0, this.totalGb - this.numberFromPossibleGb(remaining)) : 0;
  }

  private get remainingGb(): number {
    const value = this.data?.remaining ?? this.data?.remaining_data ?? this.data?.remaining_gb;
    return value !== undefined && value !== null && value !== ''
      ? Math.max(0, this.numberFromPossibleGb(value)) : Math.max(0, this.totalGb - this.usedGb);
  }

  public ionViewWillEnter(): void {
    this.viewActive = true;
    if (this.sim_id !== this.session.currentId) { this.data = null; this.autoTopupStatus = null; }
    this.sim_id = this.session.currentId;
    this.loadAutoTopupStatus().catch(() => {});

    const topupRefreshRequired = localStorage.getItem('stellar_topup_refresh_required') === '1';

    if (topupRefreshRequired) {
      this.handleTopupReturnRefresh();
      return;
    }

    this.getData().catch(() => {});
  }

  public ionViewWillLeave(): void {
    this.viewActive = false;
    this.overviewCancel.next();
    this.clearTopupRefreshTimers();
  }



  private async handleTopupReturnRefresh(): Promise<void> {
    localStorage.removeItem('stellar_topup_refresh_required');
    localStorage.removeItem('stored_data');

    this.clearTopupRefreshTimers();
    this.topupRefreshNotice = true;
    this.topupRefreshText = this._translate.instant('TOPUP_UPDATING');

    await this.getData(true);

    if (!this.viewActive) return;
    this.scheduleTopupRefresh(900);
    this.scheduleTopupRefresh(6000);
    this.scheduleTopupRefresh(15000);
    this.scheduleTopupNoticeHide(22000);
  }

  private scheduleTopupRefresh(delayMs: number): void {
    const timer = setTimeout(() => {
      this.getData(true).catch(() => {});
    }, delayMs);

    this.topupRefreshTimers.push(timer);
  }

  private markTopupRefreshUpdated(): void {
    if (!this.topupRefreshNotice) {
      return;
    }

    this.topupRefreshText = this._translate.instant('REFRESH_SUCCESS');
    this.clearTopupRefreshTimers();
    this.scheduleTopupNoticeHide(3500);
  }

  private scheduleTopupNoticeHide(delayMs: number): void {
    if (this.topupRefreshHideTimer !== null) {
      clearTimeout(this.topupRefreshHideTimer);
    }

    this.topupRefreshHideTimer = setTimeout(() => {
      this.topupRefreshNotice = false;
      this.topupRefreshText = '';
      this.topupRefreshHideTimer = null;
    }, delayMs);
  }

  private clearTopupRefreshTimers(): void {
    this.topupRefreshTimers.forEach((timer) => clearTimeout(timer));
    this.topupRefreshTimers = [];

    if (this.topupRefreshHideTimer !== null) {
      clearTimeout(this.topupRefreshHideTimer);
      this.topupRefreshHideTimer = null;
    }
  }

  public async handleRefresh(event: any): Promise<void> {
    await Promise.all([
      this.getData(true),
      this.loadAutoTopupStatus(),
    ]);

    if (event?.target?.complete) {
      event.target.complete();
    }
  }

  public async retryLoad(): Promise<void> {
    await Promise.all([
      this.getData(true),
      this.loadAutoTopupStatus(),
    ]);
  }

  public async retryAutoTopupStatus(): Promise<void> {
    await this.loadAutoTopupStatus();
  }

  public async copy(): Promise<void> {
    await Clipboard.write({ string: this.sim_id });
    this.isCopying = true;

    const toast = await this.toastController.create({
      message: this.SIM_ID_COPIED || this._translate.instant('SIM_ID_COPIED'),
      duration: 2000,
      position: 'bottom',
    });

    await toast.present();

    setTimeout(() => {
      this.isCopying = false;
    }, 1500);
  }

  public getCountryFullName(countryCode: string): string {
    try {
      const DisplayNames = (Intl as any).DisplayNames;
      if (DisplayNames) return new DisplayNames([this._translate.currentLang || 'en'], { type: 'region' }).of(countryCode.toUpperCase());
    } catch { /* Keep the country code readable on older WebViews. */ }
    return COUNTRY_CODES[String(countryCode || '').toLowerCase()] || countryCode;

  }

  public toggleModal(open?: boolean): void {
    this.showModal = typeof open === 'boolean' ? open : !this.showModal;
  }

  public openAutoTopupLearnMore(): void {
    this.autoTopupModalMode = 'learn';
    this.showAutoTopupModal = true;
  }

  public async requestAutoTopupToggle(): Promise<void> {
    if (this.autoTopupSwitchDisabled) {
      if (this.autoTopupStatus && !this.autoTopupStatus.can_enable && !this.autoTopupStatus.enabled) {
        await this.presentAutoTopupToast(this.autoTopupUnavailableMessage);
      }
      return;
    }

    const enabled = !this.autoTopupEnabled;
    const simId = this.getAutoTopupSimId();

    if (!simId) {
      await this.presentAutoTopupToast(this._translate.instant('AUTO_TOPUP_UNAVAILABLE'));
      return;
    }

    this.isAutoTopupUpdating = true;
    this.autoTopupError = '';

    try {
      const response = await firstValueFrom(
        this.dataServiceAPIService.updateAutoTopup(simId, enabled, enabled),
      );

      this.autoTopupStatus = response.data;

      await this.presentAutoTopupToast(
        this._translate.instant(enabled ? 'AUTO_TOPUP_ENABLED_TOAST' : 'AUTO_TOPUP_DISABLED_TOAST'),
      );
    } catch (error: any) {
      this.autoTopupError = this.extractAutoTopupError(error);
      await this.presentAutoTopupToast(this.autoTopupError);
    } finally {
      this.isAutoTopupUpdating = false;
    }
  }

  public closeAutoTopupModal(): void {
    if (this.isAutoTopupUpdating) {
      return;
    }

    this.showAutoTopupModal = false;
    this.autoTopupError = '';
  }

  public async confirmAutoTopupModal(): Promise<void> {
    if (this.autoTopupModalMode === 'learn') {
      this.closeAutoTopupModal();
      return;
    }

    const enabled = this.autoTopupModalMode === 'enable';
    const simId = this.getAutoTopupSimId();
    if (!simId) {
      await this.presentAutoTopupToast(this._translate.instant('AUTO_TOPUP_UNAVAILABLE'));
      return;
    }

    this.isAutoTopupUpdating = true;
    this.autoTopupError = '';

    try {
      const response = await firstValueFrom(
        this.dataServiceAPIService.updateAutoTopup(simId, enabled, enabled),
      );

      this.autoTopupStatus = response.data;
      this.showAutoTopupModal = false;

      await this.presentAutoTopupToast(
        this._translate.instant(enabled ? 'AUTO_TOPUP_ENABLED_TOAST' : 'AUTO_TOPUP_DISABLED_TOAST'),
      );
    } catch (error: any) {
      this.autoTopupError = this.extractAutoTopupError(error);
      await this.presentAutoTopupToast(this.autoTopupError);
    } finally {
      this.isAutoTopupUpdating = false;
    }
  }

  private async loadAutoTopupStatus(): Promise<void> {
    const simId = this.getAutoTopupSimId();
    if (!simId) {
      this.autoTopupStatus = null;
      return;
    }

    this.isAutoTopupLoading = true;
    this.autoTopupError = '';

    try {
      const response = await firstValueFrom(this.dataServiceAPIService.getAutoTopupStatus(simId).pipe(timeout(15000)));
      this.autoTopupStatus = response.data;
    } catch (error: any) {
      this.autoTopupError = this.extractAutoTopupError(error);
    } finally {
      this.isAutoTopupLoading = false;
    }
  }

  private getAutoTopupSimId(): string {
    const simId = String(this.data?.id || this.sim_id || '').replace(/\s+/g, '').trim();

    return /^\d{16}$/.test(simId) ? simId : '';
  }

  private extractAutoTopupError(error: any): string {
    return String(
      this._translate.instant('AUTO_TOPUP_TEMPORARY_ERROR')
    ).trim();
  }

  private async presentAutoTopupToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4200,
      position: 'bottom',
    });

    await toast.present();
  }

  public async upgradePlan(): Promise<void> {
    if (this.isTopupRedirecting) return;
    const existingTopupUrl = this.extractExistingTopupUrl();
    const existingTopupToken = this.extractExistingTopupToken();

    if (existingTopupUrl) {
      this.prefetchTopupFromTarget(existingTopupUrl);
      this.redirectToTopup(existingTopupUrl);
      return;
    }

    if (existingTopupToken) {
      this.dataServiceAPIService.prefetchTopupToken(existingTopupToken);
      this.redirectToTopup(`/topup/${encodeURIComponent(existingTopupToken)}`);
      return;
    }

    const simId = this.getTopupSimId();

    if (!simId) {
      const toast = await this.toastController.create({
        message: this._translate.instant('TOPUP_UNAVAILABLE'),
        duration: 3500,
        position: 'bottom',
      });
      await toast.present();
      return;
    }

    this.isTopupRedirecting = true;

    this.dataServiceAPIService.createTopupToken(simId, 'app_requested').subscribe({
      next: async (response) => {
        this.isTopupRedirecting = false;

        const topupUrl = this.extractTopupUrlFromTokenResponse(response);
        const topupToken = this.extractTopupTokenFromTokenResponse(response);

        if (topupUrl) {
          this.prefetchTopupFromTarget(topupUrl);
          this.redirectToTopup(topupUrl);
          return;
        }

        if (topupToken) {
          this.dataServiceAPIService.prefetchTopupToken(topupToken);
          this.redirectToTopup(`/topup/${encodeURIComponent(topupToken)}`);
          return;
        }

        const toast = await this.toastController.create({
          message: this._translate.instant('TOPUP_ERROR'),
          duration: 4500,
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (error) => {
        this.isTopupRedirecting = false;

        const message = this._translate.instant('TOPUP_ERROR');

        const toast = await this.toastController.create({
          message,
          duration: 5500,
          position: 'bottom',
        });

        await toast.present();
      },
    });
  }


  private getTopupSimId(): string {
    const rawValue = this.data?.sim_id
      || this.data?.plan_id
      || this.data?.account_number
      || this.sim_id;

    const simId = String(rawValue || '').replace(/\s+/g, '').trim();

    if (!/^[0-9]{16}$/.test(simId)) {
      return '';
    }

    return simId;
  }

  private extractExistingTopupUrl(): string {
    return String(
      this.data?.topup_url
      || this.data?.top_up_url
      || this.data?.links?.topup
      || this.data?.links?.top_up
      || ''
    ).trim();
  }

  private extractExistingTopupToken(): string {
    return String(
      this.data?.topup_token
      || this.data?.top_up_token
      || this.data?.links?.topup_token
      || this.data?.links?.top_up_token
      || ''
    ).trim();
  }

  private extractTopupUrlFromTokenResponse(response: any): string {
    const payload = response?.data || response;

    return String(
      payload?.topup_url
      || payload?.top_up_url
      || payload?.url
      || response?.topup_url
      || response?.top_up_url
      || ''
    ).trim();
  }

  private extractTopupTokenFromTokenResponse(response: any): string {
    const payload = response?.data || response;

    return String(
      payload?.token
      || payload?.topup_token
      || payload?.top_up_token
      || response?.token
      || response?.topup_token
      || response?.top_up_token
      || ''
    ).trim();
  }

  private redirectToTopup(target: string): void {
    if (!target) {
      return;
    }

    const internalTarget = this.getInternalTopupRoute(target);
    if (internalTarget) {
      this.navCtrl.navigateForward(internalTarget).then((navigated) => {
        if (!navigated) {
          window.location.assign(target);
        }
      }).catch(() => window.location.assign(target));
      return;
    }

    window.location.assign(target);
  }

  private prefetchTopupFromTarget(target: string): void {
    const internalTarget = this.getInternalTopupRoute(target);
    if (!internalTarget) {
      return;
    }

    const match = internalTarget.match(/^\/topup\/([^/?#]+)/i);
    if (!match?.[1]) {
      return;
    }

    try {
      this.dataServiceAPIService.prefetchTopupToken(decodeURIComponent(match[1]));
    } catch {
      // If decoding fails, normal top-up navigation remains unchanged.
    }
  }

  private getInternalTopupRoute(target: string): string {
    return internalAppRoute(target, window.location.origin, 'topup');
  }

  public async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.LOGOUT || 'Log out',
      message: this.LOGOUT_SURE || 'Are you sure you want to log out?',
      cssClass: 'logout-popup general-popup',
      buttons: [
        {
          text: this._translate.instant('CANCEL'),
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
    this.session.clear();
    await this.navCtrl.navigateForward('/sim-input?clear=1');
  }

  public filterLocations(): void {
    const query = this.searchText.toLowerCase();
    this.filteredLocations = this.locations.filter((countryCode: string) => this.getCountryFullName(countryCode).toLowerCase().includes(query));
  }

  private async getData(forceRefresh = false): Promise<void> {
    if (this.isLoading || !this.viewActive) return;
    this.hasError = false;
    this.errorMessage = '';
    this.isLoading = true;
    const id = this.sim_id;
    try {
      const verified = this.session.takeOverview(id);
      const response = !forceRefresh && verified ? verified : await this.session.lookup(id, this.overviewCancel);
      if (!this.viewActive || id !== this.sim_id) return;
      this.data = response;
      this.session.remember(id, response);
      this.session.takeOverview(id);
      this.showingCachedData = false;
      this.format(response);
      this.getPercentOfData();
      if (forceRefresh) {
        // A successful usage refresh does not prove that the provider has applied a purchase yet.
        this.topupRefreshText = this._translate.instant('TOPUP_UPDATING');
      }
    } catch (error) {
      if (!this.viewActive) return;
      this.data = null;
      this.session.returnToLogin(id, error);
      await this.navCtrl.navigateRoot('/sim-input');
    } finally {
      this.isLoading = false;
    }
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

  private trimNumber(value: number): string {
    return new Intl.NumberFormat(this._translate.currentLang || 'en', { maximumFractionDigits: 2 }).format(value);
  }

  private numberFromPossibleGb(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const match = String(value).replace(',', '.').match(/[0-9]+(?:\.[0-9]+)?/);
    const number = match ? Number(match[0]) : 0;
    if (/MB/i.test(String(value))) return number / 1024;
    if (/TB/i.test(String(value))) return number * 1024;
    return number;
  }

  private formatGb(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '';
    }

    return `${this.trimNumber(value)} GB`;
  }

  public formatExpiry(value: any): string {
    if (!value) return '';
    const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]) : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(this._translate.currentLang || 'en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  private formatDateTime(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(this._translate.currentLang || 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
