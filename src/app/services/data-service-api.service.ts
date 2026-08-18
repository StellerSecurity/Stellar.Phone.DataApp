import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

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

  resolveTopupToken(token: string) {
    return this.httpClient.get<any>(`${this.API_URL}v1/topupcontroller/resolve/${encodeURIComponent(token)}`);
  }

  createTopupToken(simId: string, reason: string = 'app_requested') {
    return this.httpClient.post<any>(`${this.API_URL}v1/topupcontroller/token`, {
      sim_id: simId,
      reason,
    });
  }

  createTopupCheckout(token: string, packageCode: string, plan: any = {}) {
    return this.httpClient.post<any>(`${this.API_URL}v1/topupcontroller/checkout`, {
      token,
      package_code: packageCode,
      plan,
    });
  }
}
