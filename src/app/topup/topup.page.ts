import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
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
  public errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private dataServiceAPIService: DataServiceAPIService,
    private loadingCtrl: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.token = (params.get('token') || '').trim();
      this.loadTopup();
    });
  }

  public async loadTopup(): Promise<void> {
    this.errorMessage = '';
    this.resolved = null;
    this.sim = null;
    this.plans = [];
    this.selectedPlan = null;
    this.currentPlan = null;
    this.visiblePlanLimit = 5;

    if (!this.token) {
      this.errorMessage = 'This top-up link is missing a token.';
      return;
    }

    this.loading = true;
    const loader = await this.loadingCtrl.create({ cssClass: 'loader-popup' });
    await loader.present();

    this.dataServiceAPIService.resolveTopupToken(this.token).subscribe({
      next: async (response) => {
        this.loading = false;
        await loader.dismiss();

        this.resolved = response || {};
        this.sim = this.pickSim(this.resolved);
        const allPlans = this.pickPlans(this.resolved);
        this.currentPlan = this.pickCurrentPlan(this.resolved, allPlans);
        this.plans = this.filterPlansForCurrentPlan(allPlans, this.currentPlan);

        if (this.plans.length > 0) {
          this.selectedPlan = this.plans[0];
        }
      },
      error: async (error) => {
        this.loading = false;
        await loader.dismiss();
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
        header: 'Top-up unavailable',
        message: 'This top-up package is missing a package code.',
        buttons: ['OK'],
        cssClass: 'general-popup',
      });
      await alert.present();
      return;
    }

    this.checkoutLoading = true;
    const loader = await this.loadingCtrl.create({ cssClass: 'loader-popup' });
    await loader.present();

    this.dataServiceAPIService.createTopupCheckout(this.token, packageCode, this.selectedPlan).subscribe({
      next: async (response) => {
        this.checkoutLoading = false;
        await loader.dismiss();

        const redirectUrl = this.pickCheckoutUrl(response);
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        const toast = await this.toastController.create({
          message: 'Top-up checkout created, but no checkout URL was returned.',
          duration: 4500,
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (error) => {
        this.checkoutLoading = false;
        await loader.dismiss();

        const toast = await this.toastController.create({
          message: this.readErrorMessage(error),
          duration: 6500,
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  public getPlanName(plan: any): string {
    return plan?.name || plan?.title || plan?.label || plan?.package_name || plan?.sku || plan?.package_code || 'Top-up package';
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
    return `${days} days`;
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

    return 'Price shown at checkout';
  }

  public getSimLabel(): string {
    return this.sim?.label || this.sim?.name || this.sim?.sim_name || this.sim?.country || 'Your Stellar eSIM';
  }

  public getCurrentPlanName(): string {
    return this.sim?.current_plan_name || this.getPlanName(this.currentPlan) || this.sim?.package_code || '';
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
      return `${remaining} of ${total}`;
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
    return String(plan?.location_name || plan?.locationName || plan?.raw?.locationName || plan?.raw?.locationNetworkList?.[0]?.locationName || '').trim();
  }

  private locationSetFromPlan(plan: any): string[] {
    const raw = String(plan?.location || plan?.raw?.location || this.locationCodeFromPlan(plan) || '').trim();
    if (!raw) {
      return [];
    }

    return raw.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean).sort();
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

  private formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    try {
      return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }

  private formatBytes(bytes: any): string {
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

    return `${Math.round(value)} bytes`;
  }

  private trimNumber(value: number): string {
    return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  private formatMoney(amount: number, currency: string): string {
    if (Number.isNaN(amount)) {
      return 'Price shown at checkout';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  private readErrorMessage(error: any): string {
    return error?.error?.message || error?.error?.error || error?.message || 'Could not load this top-up link. It may be expired or invalid.';
  }
}
