import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-topup-checkout',
  templateUrl: './topup-checkout.page.html',
  styleUrls: ['./topup-checkout.page.scss'],
})
export class TopupCheckoutPage implements OnInit {
  public orderId = '';
  public checkoutType = 'esim_topup';
  public checkout: any = null;
  public order: any = null;
  public errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.orderId = (params.get('order_id') || '').trim();
      this.checkoutType = (params.get('type') || 'esim_topup').trim();
      this.loadStoredCheckout();
    });
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
    return false;
  }

  public async backToTopup(): Promise<void> {
    await this.router.navigateByUrl('/');
  }

  public copyOrderId(): void {
    if (!this.orderId) {
      return;
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(this.orderId).catch(() => undefined);
    }
  }

  private get firstItem(): any {
    const items = this.order?.items || this.checkout?.order?.items || [];
    return Array.isArray(items) && items.length > 0 ? items[0] : null;
  }

  private loadStoredCheckout(): void {
    this.errorMessage = '';
    this.checkout = null;
    this.order = null;

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

  private storageKey(orderId: string): string {
    return `stellar_topup_checkout_${orderId}`;
  }
}
