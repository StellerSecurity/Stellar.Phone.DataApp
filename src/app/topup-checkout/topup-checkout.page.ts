import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

declare global {
  interface Window {
    Stripe?: any;
    STELLAR_TOPUP_CHECKOUT?: {
      websiteApiBaseUrl?: string;
      paymentIntentPath?: string;
      stripePublishableKey?: string;
    };
  }
}

@Component({
  selector: 'app-topup-checkout',
  templateUrl: './topup-checkout.page.html',
  styleUrls: ['./topup-checkout.page.scss'],
})
export class TopupCheckoutPage implements OnInit, OnDestroy {
  public orderId = '';
  public checkoutType = 'esim_topup';
  public checkout: any = null;
  public order: any = null;
  public errorMessage = '';
  public paymentMessage = '';
  public paymentLoading = false;
  public stripeReady = false;
  public paymentSucceeded = false;
  public paymentLocked = false;
  public topupProcessing = false;
  public redirectCountdown = 4;


  private stripe: any = null;
  private cardElement: any = null;
  private paymentIntentClientSecret = '';
  private paymentIntentId = '';
  private redirectTimer: any = null;


  private readonly defaultWebsiteApiBaseUrl = 'https://stellaruiwebsiteapiprod.azurewebsites.net/api/';
  private readonly defaultPaymentIntentPath = 'v1/checkoutcontroller/createpaymentintent';
  private readonly defaultStripePublishableKey = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.orderId = (params.get('order_id') || '').trim();
      this.checkoutType = (params.get('type') || 'esim_topup').trim();
      this.loadStoredCheckout();
      this.prepareStripePayment().catch((error) => {
        this.errorMessage = this.readErrorMessage(error) || 'Payment could not be initialized.';
      });
    });
  }

  ngOnDestroy(): void {
    this.clearRedirectTimer();
    this.destroyCardElement();
  }

  public get hasOrder(): boolean {
    return !!this.orderId;
  }

  public get status(): string {
    return this.order?.status || this.checkout?.status || 'PENDING_PAYMENT';
  }

  public get currency(): string {
    return this.order?.currency || this.checkout?.currency || 'USD';
  }

  public get totalCents(): number {
    const value = this.order?.grand_total_cents ?? this.checkout?.grand_total_cents ?? null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  public get totalFormatted(): string {
    if (!this.totalCents) {
      return 'Payment total unavailable';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency,
      }).format(this.totalCents / 100);
    } catch {
      return `${(this.totalCents / 100).toFixed(2)} ${this.currency}`;
    }
  }

  public get itemName(): string {
    return this.firstItem?.name || 'Stellar eSIM Top-up';
  }

  public get packageCode(): string {
    return this.firstItem?.sku || this.firstItem?.meta?.package_code || this.order?.meta?.package_code || this.checkout?.package_code || '';
  }

  public get topupSessionId(): string {
    return this.firstItem?.meta?.topup_session_id || this.order?.meta?.topup_session_id || this.checkout?.topup_session_id || '';
  }

  public get paymentReady(): boolean {
    return !this.paymentSucceeded && !this.paymentLocked && this.stripeReady && !!this.paymentIntentClientSecret && !!this.stripe && !!this.cardElement;
  }

  public async backToTopup(): Promise<void> {
    await this.router.navigateByUrl('/');
  }

  public async goToDataNow(): Promise<void> {
    await this.redirectToDataTab();
  }

  public copyOrderId(): void {
    if (!this.orderId) {
      return;
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(this.orderId).catch(() => undefined);
    }
  }

  public async payWithCard(): Promise<void> {
    if (!this.paymentReady || this.paymentLoading) {
      return;
    }

    this.paymentLoading = true;
    this.paymentLocked = true;
    this.paymentMessage = '';
    this.errorMessage = '';

    const loader = await this.loadingCtrl.create({ cssClass: 'loader-popup' });
    await loader.present();

    try {
      const result = await this.stripe.confirmCardPayment(this.paymentIntentClientSecret, {
        payment_method: {
          card: this.cardElement,
        },
      });

      if (result?.error) {
        this.paymentLocked = false;
        this.errorMessage = result.error.message || 'The card payment failed.';
        return;
      }

      const status = result?.paymentIntent?.status || '';
      if (status === 'succeeded') {
        await this.handleSuccessfulPayment();
        return;
      }

      if (status === 'processing') {
        this.paymentMessage = 'Payment is processing. Your top-up will be applied after confirmation.';
        return;
      }

      this.paymentLocked = false;
      this.errorMessage = 'Payment was not completed. Please try again.';
    } catch (error: any) {
      this.paymentLocked = false;
      this.errorMessage = this.readErrorMessage(error) || 'Payment could not be completed.';
    } finally {
      this.paymentLoading = false;
      await loader.dismiss();
    }
  }

  public async showPaymentConfigHelp(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Payment configuration missing',
      message: 'Set window.STELLAR_TOPUP_CHECKOUT.stripePublishableKey and websiteApiBaseUrl in src/index.html, or replace the defaults in topup-checkout.page.ts.',
      buttons: ['OK'],
      cssClass: 'general-popup',
    });
    await alert.present();
  }

  private get firstItem(): any {
    const items = this.order?.items || this.checkout?.order?.items || [];
    return Array.isArray(items) && items.length > 0 ? items[0] : null;
  }

  private loadStoredCheckout(): void {
    this.errorMessage = '';
    this.checkout = null;
    this.order = null;
    this.paymentSucceeded = false;
    this.paymentLocked = false;
    this.topupProcessing = false;
    this.redirectCountdown = 4;
    this.clearRedirectTimer();

    if (!this.orderId) {
      this.errorMessage = 'Missing top-up order id.';
      return;
    }

    const key = this.storageKey(this.orderId);
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key) || '';

    if (!raw) {
      this.errorMessage = 'The top-up order was created, but order details are not available in this browser session.';
      return;
    }

    try {
      this.checkout = JSON.parse(raw);
      this.order = this.checkout?.order || this.checkout?.data?.order || null;
    } catch {
      this.errorMessage = 'The stored top-up checkout details could not be read.';
    }
  }

  private async prepareStripePayment(): Promise<void> {
    if (this.paymentSucceeded) {
      return;
    }

    this.stripeReady = false;
    this.paymentIntentClientSecret = '';
    this.paymentIntentId = '';

    if (!this.orderId) {
      return;
    }

    const publishableKey = this.stripePublishableKey;
    if (!publishableKey) {
      this.errorMessage = 'Stripe publishable key is missing.';
      return;
    }

    await this.loadStripeJs();

    this.stripe = window.Stripe(publishableKey);
    const intent = await this.createPaymentIntent();
    this.paymentIntentClientSecret = this.pickClientSecret(intent);
    this.paymentIntentId = this.pickPaymentIntentId(intent);

    if (!this.paymentIntentClientSecret) {
      this.errorMessage = 'Payment intent was created, but no client secret was returned.';
      return;
    }

    setTimeout(() => this.mountCardElement(), 0);
  }

  private mountCardElement(): void {
    if (this.paymentSucceeded || !this.stripe || !this.paymentIntentClientSecret) {
      return;
    }

    const target = document.getElementById('stellar-topup-card-element');
    if (!target) {
      setTimeout(() => this.mountCardElement(), 50);
      return;
    }

    this.destroyCardElement();

    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          fontSize: '16px',
          color: '#172033',
          '::placeholder': {
            color: '#8b93a7',
          },
        },
      },
    });

    this.cardElement.mount(target);
    this.stripeReady = true;
  }


  private async handleSuccessfulPayment(): Promise<void> {
    this.paymentSucceeded = true;
    this.paymentLocked = true;
    this.topupProcessing = true;
    this.paymentLoading = false;
    this.stripeReady = false;
    this.paymentMessage = 'Payment succeeded. Your top-up is being applied.';
    this.errorMessage = '';

    this.destroyCardElement();
    this.markTopupCompletedForTabRefresh();

    const toast = await this.toastController.create({
      message: 'Payment succeeded. Applying top-up and refreshing your dashboard shortly.',
      duration: 3000,
      position: 'bottom',
    });
    await toast.present();

    this.startRedirectCountdown();
  }

  private startRedirectCountdown(): void {
    this.clearRedirectTimer();
    this.redirectCountdown = 4;

    this.redirectTimer = setInterval(() => {
      this.redirectCountdown = Math.max(0, this.redirectCountdown - 1);

      if (this.redirectCountdown <= 0) {
        this.clearRedirectTimer();
        this.redirectToDataTab().catch(() => undefined);
      }
    }, 1000);
  }

  private clearRedirectTimer(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  private async redirectToDataTab(): Promise<void> {
    this.clearRedirectTimer();
    this.markTopupCompletedForTabRefresh();
    await this.router.navigate(['/tabs/tab1'], {
      replaceUrl: true,
      queryParams: {
        refresh: Date.now(),
        source: 'topup_success',
      },
    });
  }

  private markTopupCompletedForTabRefresh(): void {
    try {
      localStorage.setItem('stellar_topup_completed_at', new Date().toISOString());
      localStorage.setItem('stellar_topup_refresh_required', '1');
      localStorage.setItem('stellar_topup_last_order_id', this.orderId || '');
      localStorage.setItem('stellar_topup_last_package_code', this.packageCode || '');
      localStorage.setItem('stellar_topup_last_session_id', this.topupSessionId || '');
    } catch {
      // Storage is best-effort only.
    }
  }

  private destroyCardElement(): void {
    if (this.cardElement) {
      try {
        this.cardElement.destroy();
      } catch {
        // Ignore Stripe cleanup errors.
      }
    }

    this.cardElement = null;
    this.stripeReady = false;

    const target = document.getElementById('stellar-topup-card-element');
    if (target) {
      target.innerHTML = '';
    }
  }

  private async createPaymentIntent(): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(this.paymentIntentUrl, {
        order_id: this.orderId,
        type: this.checkoutType,
        payment_method: 'stripe',
      })
    );
  }

  private loadStripeJs(): Promise<void> {
    if (window.Stripe) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Stripe.js could not be loaded.')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Stripe.js could not be loaded.'));
      document.head.appendChild(script);
    });
  }

  private pickClientSecret(response: any): string {
    const candidates = [
      response?.client_secret,
      response?.data?.client_secret,
      response?.data?.data?.client_secret,
    ];

    const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim() !== '');
    return value ? value.trim() : '';
  }

  private pickPaymentIntentId(response: any): string {
    const candidates = [
      response?.payment_intent_id,
      response?.data?.payment_intent_id,
      response?.data?.data?.payment_intent_id,
    ];

    const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim() !== '');
    return value ? value.trim() : '';
  }

  private get paymentIntentUrl(): string {
    const base = this.normalizedBaseUrl(this.runtimeConfig.websiteApiBaseUrl || this.defaultWebsiteApiBaseUrl);
    const path = (this.runtimeConfig.paymentIntentPath || this.defaultPaymentIntentPath).replace(/^\/+/, '');
    return base + path;
  }

  private get stripePublishableKey(): string {
    return this.runtimeConfig.stripePublishableKey || this.defaultStripePublishableKey;
  }

  private get runtimeConfig(): any {
    return window.STELLAR_TOPUP_CHECKOUT || {};
  }

  private normalizedBaseUrl(value: string): string {
    const trimmed = String(value || '').trim();
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  private storageKey(orderId: string): string {
    return `stellar_topup_checkout_${orderId}`;
  }

  private readErrorMessage(error: any): string {
    return error?.error?.response_message || error?.error?.message || error?.message || '';
  }
}
