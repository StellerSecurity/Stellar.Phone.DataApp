import { internalAppRoute } from '../services/app-links';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { timeout } from 'rxjs';
import { SimSessionService } from '../services/sim-session.service';
import { DataServiceAPIService } from '../services/data-service-api.service';

@Component({
  selector: 'app-topup',
  templateUrl: './topup.page.html',
  styleUrls: ['./topup.page.scss'],
})
export class TopupPage implements OnInit {
  public token = '';
  public loading = false;
  public checkoutLoading = false;
  public resolved: any = null;
  public sim: any = null;
  public plans: any[] = [];
  public visiblePlanLimit = 5;
  public selectedPlan: any = null;
  public currentPlan: any = null;
  public vpnTopupOffer: any = null;
  public vpnTopupSelected = false;
  public errorMessage = '';
  public checkoutError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataServiceAPIService: DataServiceAPIService,
    private loadingCtrl: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    public translate: TranslateService,
    private session: SimSessionService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.token = (params.get('token') || '').trim();
      this.loadTopup();
    });
  }

  public backToData(): void { void this.router.navigateByUrl(this.session.currentId ? '/tabs/tab1' : '/sim-input'); }

  public async loadTopup(): Promise<void> {
    if (this.loading) return;
    this.errorMessage = '';
    this.resolved = null;
    this.sim = null;
    this.plans = [];
    this.selectedPlan = null;
    this.currentPlan = null;
    this.vpnTopupOffer = null;
    this.vpnTopupSelected = false;
    this.visiblePlanLimit = 5;

    if (!this.token) {
      this.errorMessage = this.translate.instant('TOPUP_ERROR');
      return;
    }

    this.warmCheckoutConnections();
    this.loading = true;

    this.dataServiceAPIService.resolveTopupToken(this.token).pipe(timeout(15000)).subscribe({
      next: (response) => {
        this.loading = false;

        this.resolved = response || {};
        this.sim = this.pickSim(this.resolved);
        if (!this.sim) { this.errorMessage = this.translate.instant('TOPUP_ERROR'); return; }
        const allPlans = this.pickPlans(this.resolved);
        this.currentPlan = this.pickCurrentPlan(this.resolved, allPlans);
        this.plans = this.filterPlansForCurrentPlan(allPlans, this.currentPlan);
        this.vpnTopupOffer = this.pickVpnTopupOffer(this.resolved);

        if (this.plans.length > 0) {
          this.selectedPlan = this.plans[0];
          this.preloadStripeJsBestEffort();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.readErrorMessage(error);
      },
    });
  }

  public selectPlan(plan: any): void {
    this.selectedPlan = plan;
  }

  public getVisiblePlans(): any[] {
    return this.plans.slice(0, this.visiblePlanLimit);
  }

  public hasMorePlans(): boolean {
    return this.plans.length > this.visiblePlanLimit;
  }

  public getHiddenPlansCount(): number {
    return Math.max(0, this.plans.length - this.visiblePlanLimit);
  }

  public showMorePlans(): void {
    this.visiblePlanLimit = Math.min(this.visiblePlanLimit + 5, this.plans.length);
  }

  public showLessPlans(): void {
    this.visiblePlanLimit = 5;

    if (this.selectedPlan && !this.getVisiblePlans().includes(this.selectedPlan)) {
      this.selectedPlan = this.plans[0] || null;
    }
  }

  public async checkout(): Promise<void> {
    if (!this.selectedPlan || this.checkoutLoading) {
      return;
    }

    const packageCode = this.getPlanCode(this.selectedPlan);

    if (!packageCode) {
      const alert = await this.alertController.create({
        header: this.translate.instant('TOPUP_UNAVAILABLE'),
        message: this.translate.instant('TOPUP_ERROR'),
        buttons: [this.translate.instant('HOME_OK')],
        cssClass: 'general-popup',
      });
      await alert.present();
      return;
    }

    this.checkoutLoading = true;
    this.checkoutError = '';
    try { sessionStorage.setItem('stellar_topup_back', `/topup/${encodeURIComponent(this.token)}`); } catch { /* Optional navigation history. */ }

    this.dataServiceAPIService.createTopupCheckout(
      this.token,
      packageCode,
      this.selectedPlan,
      this.vpnTopupSelected,
      this.vpnTopupSelected ? String(this.vpnTopupOffer?.consent_version || '') : ''
    ).subscribe({
      next: async (response) => {
        this.checkoutLoading = false;

        const redirectUrl = this.pickCheckoutUrl(response);
        if (redirectUrl) {
          this.rememberCheckoutResponse(response);
          this.navigateToCheckout(redirectUrl);
          return;
        }

        this.checkoutError = this.translate.instant('CHECKOUT_ERROR');
      },
      error: async () => {
        this.checkoutLoading = false;
        this.checkoutError = this.translate.instant('CHECKOUT_ERROR');
      },
    });
  }

  public getPlanName(plan: any): string {
    return plan?.name || plan?.title || plan?.label || plan?.package_name || plan?.sku || plan?.package_code || this.translate.instant('TOPUP_PACKAGE');
  }

  public get vpnTopupAvailable(): boolean {
    return !!this.vpnTopupOffer?.available
      && Number(this.vpnTopupOffer?.days || 0) > 0
      && Number(this.vpnTopupOffer?.price_cents || 0) > 0
      && !!String(this.vpnTopupOffer?.consent_version || '').trim();
  }

  public setVpnTopupSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.vpnTopupSelected = this.vpnTopupAvailable && !!input?.checked;
  }

  public getVpnTopupPrice(): string {
    if (!this.vpnTopupAvailable) {
      return '';
    }

    return this.formatMoney(
      Number(this.vpnTopupOffer.price_cents) / 100,
      String(this.vpnTopupOffer.currency || 'EUR')
    );
  }

  public getVpnTopupDays(): number {
    return Math.max(0, Number(this.vpnTopupOffer?.days || 0));
  }

  public getCheckoutTotal(): string {
    const planPriceCents = this.getPlanPriceCents(this.selectedPlan);
    if (planPriceCents === null) {
      return this.translate.instant('PRICE_AT_CHECKOUT');
    }

    const vpnPriceCents = this.vpnTopupSelected
      ? Math.max(0, Number(this.vpnTopupOffer?.price_cents || 0))
      : 0;
    const currency = String(this.selectedPlan?.currency || this.selectedPlan?.price_currency || this.vpnTopupOffer?.currency || 'EUR');

    return this.formatMoney((planPriceCents + vpnPriceCents) / 100, currency);
  }

  public getPlanCode(plan: any): string {
    return String(plan?.package_code || plan?.code || plan?.sku || plan?.id || plan?.plan_id || '').trim();
  }

  public getPlanData(plan: any): string {
    const value = plan?.data_gb || plan?.gb || plan?.data || plan?.amount_gb || plan?.size;
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const text = String(value);
    return text.toLowerCase().includes('gb') ? text : `${text} GB`;
  }

  public getPlanValidity(plan: any): string {
    const days = plan?.duration_days || plan?.validity_days || plan?.days;
    if (!days) {
      return '';
    }
    return this.translate.instant('VALID_DAYS', { days });
  }

  public getPlanPrice(plan: any): string {
    const currency = plan?.currency || plan?.price_currency || 'EUR';
    const cents = plan?.price_cents ?? plan?.unit_price_cents ?? plan?.amount_cents;
    if (cents !== null && cents !== undefined && cents !== '') {
      return this.formatMoney(Number(cents) / 100, currency);
    }

    const price = plan?.price ?? plan?.unit_price ?? plan?.amount;
    if (price !== null && price !== undefined && price !== '') {
      return this.formatMoney(Number(price), currency);
    }

    return this.translate.instant('PRICE_AT_CHECKOUT');
  }

  private getPlanPriceCents(plan: any): number | null {
    const cents = plan?.price_cents ?? plan?.unit_price_cents ?? plan?.amount_cents;
    if (cents !== null && cents !== undefined && cents !== '') {
      const value = Number(cents);
      return Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
    }

    const price = plan?.price ?? plan?.unit_price ?? plan?.amount;
    if (price !== null && price !== undefined && price !== '') {
      const value = Number(price);
      return Number.isFinite(value) ? Math.max(0, Math.round(value * 100)) : null;
    }

    return null;
  }

  public getSimLabel(): string {
    return this.sim?.label || this.sim?.name || this.sim?.sim_name || this.sim?.country || this.translate.instant('YOUR_ESIM');
  }

  public getCurrentPlanName(): string {
    return this.sim?.current_plan_name || (this.currentPlan ? this.getPlanName(this.currentPlan) : '') || this.sim?.package_code || '';
  }

  public getCurrentPlanArea(): string {
    return this.sim?.current_plan_location_name || this.locationNameFromPlan(this.currentPlan) || this.sim?.current_plan_location_code || '';
  }

  public getSimId(): string {
    return this.sim?.id || this.sim?.sim_id || this.sim?.iccid || this.sim?.account_number || '';
  }

  public getRemainingData(): string {
    const remaining = this.sim?.remaining || this.sim?.remaining_data || this.sim?.data_remaining || this.formatBytes(this.sim?.remaining_bytes);
    const total = this.getTotalData();

    if (remaining && total) {
      return this.translate.instant('REMAINING_OF', { remaining, total });
    }

    return remaining || '';
  }

  public getTotalData(): string {
    return this.sim?.total_data || this.formatBytes(this.sim?.total_bytes) || this.getPlanData(this.currentPlan) || '';
  }

  public getUsedData(): string {
    return this.sim?.used_data || this.formatBytes(this.sim?.used_bytes) || '';
  }

  public getExpiresAt(): string {
    const raw = this.sim?.expires_at || this.sim?.expiry_date || this.sim?.valid_until || '';
    return this.formatDate(raw);
  }

  public getActivatedAt(): string {
    const raw = this.sim?.activated_at || '';
    return this.formatDate(raw);
  }

  private pickSim(response: any): any {
    return response?.sim || response?.simcard || response?.esim || response?.overview || response?.data?.sim || response?.data?.simcard || response?.data?.overview || response?.data || null;
  }

  private pickPlans(response: any): any[] {
    const plans = response?.plans || response?.topups || response?.topup_plans || response?.packages || response?.data?.plans || response?.data?.topups || response?.data?.topup_plans || response?.data?.packages || [];
    return Array.isArray(plans) ? plans : [];
  }

  private pickCurrentPlan(response: any, plans: any[]): any {
    const current = response?.current_plan || response?.data?.current_plan || this.sim?.current_plan;
    if (current) {
      return current;
    }

    const currentCode = String(this.sim?.package_code || this.sim?.packageCode || '').trim();
    if (!currentCode) {
      return null;
    }

    return plans.find((plan) => this.getPlanCode(plan) === currentCode) || null;
  }

  private pickVpnTopupOffer(response: any): any {
    const offer = response?.vpn_topup_offer || response?.data?.vpn_topup_offer || null;
    return offer?.available ? offer : null;
  }

  private filterPlansForCurrentPlan(plans: any[], currentPlan: any): any[] {
    if (!currentPlan) {
      return plans;
    }

    const currentLocationCode = this.locationCodeFromPlan(currentPlan);
    const currentLocations = this.locationSetFromPlan(currentPlan);

    const filtered = plans.filter((plan) => {
      const planLocationCode = this.locationCodeFromPlan(plan);
      const planLocations = this.locationSetFromPlan(plan);

      const sameLocationCode = !!currentLocationCode && !!planLocationCode && currentLocationCode === planLocationCode;
      const sameLocationSet = currentLocations.length > 0 && planLocations.length > 0 && currentLocations.join(',') === planLocations.join(',');

      return sameLocationCode || sameLocationSet;
    });

    return filtered.length > 0 ? filtered : plans;
  }

  private locationCodeFromPlan(plan: any): string {
    return String(plan?.location_code || plan?.locationCode || plan?.raw?.locationCode || plan?.raw?.location_code || '').trim().toUpperCase();
  }

  private locationNameFromPlan(plan: any): string {
    return String(plan?.location_name || plan?.locationName || plan?.raw?.locationName || '').trim();
  }

  private locationSetFromPlan(plan: any): string[] {
    const raw = String(plan?.location || plan?.raw?.location || this.locationCodeFromPlan(plan) || '').trim();
    if (!raw) {
      return [];
    }

    return raw.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean).sort();
  }


  private pickOrderId(response: any): string {
    const candidates = [
      response?.order_id,
      response?.data?.order_id,
      response?.data?.data?.order_id,
      response?.data?.data?.order?.id,
      response?.data?.order?.id,
      response?.order?.id,
    ];

    const orderId = candidates.find((value) => typeof value === 'string' && value.trim() !== '');
    return orderId ? orderId.trim() : '';
  }

  private pickCheckoutPayload(response: any): any {
    return response?.data?.data || response?.data || response || null;
  }

  private rememberCheckoutResponse(response: any): void {
    const orderId = this.pickOrderId(response);
    if (!orderId) {
      return;
    }

    const payload = this.pickCheckoutPayload(response);
    const key = `stellar_topup_checkout_${orderId}`;

    try {
      sessionStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Storage is best-effort only. The checkout route can still load by order_id.
    }
  }

  private pickCheckoutUrl(response: any): string {
    const candidates = [
      response?.checkout_url,
      response?.payment_url,
      response?.redirect_url,
      response?.url,

      response?.data?.checkout_url,
      response?.data?.payment_url,
      response?.data?.redirect_url,
      response?.data?.url,

      response?.data?.data?.checkout_url,
      response?.data?.data?.payment_url,
      response?.data?.data?.redirect_url,
      response?.data?.data?.url,

      response?.data?.data?.order?.checkout_url,
      response?.data?.data?.order?.payment_url,
      response?.data?.data?.order?.redirect_url,
      response?.data?.data?.order?.url,

      response?.response?.checkout_url,
      response?.response?.payment_url,
      response?.response?.redirect_url,
      response?.response?.url,
    ];

    const checkoutUrl = candidates.find((value) => {
      return typeof value === 'string' && /^https?:\/\//i.test(value);
    });

    return checkoutUrl || '';
  }

  private navigateToCheckout(target: string): void {
    const internalTarget = this.getInternalCheckoutRoute(target);
    if (!internalTarget) {
      window.location.assign(target);
      return;
    }

    this.router.navigateByUrl(internalTarget).then((navigated) => {
      if (!navigated) {
        window.location.assign(target);
      }
    }).catch(() => window.location.assign(target));
  }

  private getInternalCheckoutRoute(target: string): string {
    return internalAppRoute(target, window.location.origin, 'checkout');
  }

  private warmCheckoutConnections(): void {
    [
      'https://js.stripe.com',
      'https://api.stripe.com',
      'https://checkoutapiprod.stellarsecurity.com',
    ].forEach((origin) => this.ensurePreconnect(origin));
  }

  private ensurePreconnect(origin: string): void {
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  private preloadStripeJsBestEffort(): void {
    if ((window as any).Stripe) {
      return;
    }

    const src = 'https://js.stripe.com/v3/';
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset['stellarState'] = 'loading';
    script.addEventListener('load', () => {
      script.dataset['stellarState'] = 'loaded';
    }, { once: true });
    script.addEventListener('error', () => {
      script.dataset['stellarState'] = 'error';
      script.remove();
    }, { once: true });
    document.head.appendChild(script);
  }

  private formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    try {
      return new Intl.DateTimeFormat(this.translate.currentLang || 'en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  private formatBytes(bytes: any): string {
    if (bytes === null || bytes === undefined || bytes === '') return '';
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) {
      return '';
    }

    if (value >= 1024 * 1024 * 1024) {
      return `${this.trimNumber(value / 1024 / 1024 / 1024)} GB`;
    }

    if (value >= 1024 * 1024) {
      return `${this.trimNumber(value / 1024 / 1024)} MB`;
    }

    return value === 0 ? '0 GB' : `${Math.round(value)} B`;
  }

  private trimNumber(value: number): string {
    return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  private formatMoney(amount: number, currency: string): string {
    if (Number.isNaN(amount)) {
      return this.translate.instant('PRICE_AT_CHECKOUT');
    }

    try {
      return new Intl.NumberFormat(this.translate.currentLang || 'en', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  private readErrorMessage(error: any): string {
    return this.translate.instant('TOPUP_ERROR');
  }
}
