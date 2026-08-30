import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';

export interface AutoTopupStatus {
  visible: boolean;
  supported: boolean;
  can_manage: boolean;
  can_enable: boolean;
  enabled: boolean;
  state: string;
  processing: boolean;
  turn_off_pending_current_topup: boolean;
  authorization_synced: boolean;
  reason_code: string;
  saved_card_available: boolean;
  authorization_source?: string | null;
  amount_cents?: number | null;
  service_fee_cents?: number | null;
  total_amount_cents?: number | null;
  service_fee_basis_points?: number | null;
  service_fee_type?: 'fixed' | 'percentage' | string | null;
  currency?: string | null;
  data_bytes: number;
  duration_days?: number | null;
  plan_name: string;
  cycle?: number | null;
  esim_status?: string | null;
  last_success_at?: string | null;
  updated_at?: string | null;
}

export interface AutoTopupResponse {
  response_code: number;
  response_message?: string;
  data: AutoTopupStatus;
}

@Injectable({
  providedIn: 'root'
})
export class DataServiceAPIService {
  private readonly API_URL = 'https://stellardatauiapiappprod.azurewebsites.net/api/';
  // Only long enough to bridge dashboard -> top-up route navigation.
  // Checkout still performs its own fresh server-side validation.
  private readonly TOPUP_RESOLVE_CACHE_TTL_MS = 15_000;
  private readonly topupResolveCache = new Map<string, { expiresAt: number; response: any }>();
  private readonly topupResolveInflight = new Map<string, Observable<any>>();

  constructor(private readonly httpClient: HttpClient) {}

  getOverview(simId: string) {
    return this.httpClient.get<any>(`${this.API_URL}v2/overviewcontroller/view`, {
      params: new HttpParams().set('id', simId),
    });
  }

  getAutoTopupStatus(simId: string) {
    return this.httpClient.get<AutoTopupResponse>(`${this.API_URL}v1/autotopupcontroller/status`, {
      params: new HttpParams().set('id', simId),
    });
  }

  updateAutoTopup(simId: string, enabled: boolean, consent: boolean) {
    return this.httpClient.post<AutoTopupResponse>(`${this.API_URL}v1/autotopupcontroller/update`, {
      id: simId,
      enabled,
      consent,
    });
  }

  resolveTopupToken(token: string): Observable<any> {
    const normalizedToken = String(token || '').trim();
    const cached = this.topupResolveCache.get(normalizedToken);

    if (cached && cached.expiresAt > Date.now()) {
      return of(cached.response);
    }

    if (cached) {
      this.topupResolveCache.delete(normalizedToken);
    }

    const existingRequest = this.topupResolveInflight.get(normalizedToken);
    if (existingRequest) {
      return existingRequest;
    }

    const request = this.httpClient
      .get<any>(`${this.API_URL}v1/topupcontroller/resolve/${encodeURIComponent(normalizedToken)}`)
      .pipe(
        tap((response) => {
          this.topupResolveCache.set(normalizedToken, {
            expiresAt: Date.now() + this.TOPUP_RESOLVE_CACHE_TTL_MS,
            response,
          });
        }),
        finalize(() => this.topupResolveInflight.delete(normalizedToken)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.topupResolveInflight.set(normalizedToken, request);

    return request;
  }

  prefetchTopupToken(token: string): void {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
      return;
    }

    this.resolveTopupToken(normalizedToken).subscribe({
      error: () => {
        // Prefetch is best-effort. The top-up page will use the normal request path if needed.
      },
    });
  }

  createTopupToken(simId: string, reason: string = 'app_requested') {
    return this.httpClient.post<any>(`${this.API_URL}v1/topupcontroller/token`, {
      sim_id: simId,
      reason,
    });
  }

  createTopupCheckout(
    token: string,
    packageCode: string,
    plan: any = {},
    vpnTopupRequested: boolean = false,
    vpnTopupConsentVersion: string = ''
  ) {
    return this.httpClient.post<any>(`${this.API_URL}v1/topupcontroller/checkout`, {
      token,
      package_code: packageCode,
      plan,
      vpn_topup_requested: vpnTopupRequested,
      vpn_topup_consent_version: vpnTopupRequested ? vpnTopupConsentVersion : undefined,
    });
  }
}
