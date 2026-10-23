import { Injectable } from '@angular/core';
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { DataServiceAPIService } from './data-service-api.service';

export function isSimId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{16}$/.test(value);
}

export function normalizeSimId(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function isOverview(value: any, simId: string): boolean {
  if (!value || Array.isArray(value) || String(value.id ?? '') !== simId) return false;
  return ['total_data', 'total_gb', 'data_gb', 'total_volume_gb', 'remaining', 'remaining_data', 'total_usage']
    .some(key => value[key] !== undefined && value[key] !== null);
}

export function lookupErrorKey(error: any): string {
  if (error?.message === 'SIM_NOT_FOUND' || [400, 401, 403, 404, 410, 422].includes(error?.status)) return 'SIM_NOT_FOUND';
  if (error?.name === 'TimeoutError') return 'REQUEST_TIMEOUT';
  if (error?.status === 0) return 'CONNECTION_ERROR';
  return 'SERVICE_ERROR';
}

@Injectable({ providedIn: 'root' })
export class SimSessionService {
  private memoryId = '';
  private verified: { id: string; data: any } | null = null;
  private notice: { id: string; key: string } | null = null;

  constructor(private api: DataServiceAPIService) {}

  get currentId(): string {
    let value = this.memoryId;
    try { value = value || localStorage.getItem('sim_id') || ''; } catch { /* Private browsing may restrict storage. */ }
    return isSimId(value) ? value : '';
  }

  async lookup(id: string, cancel?: Subject<void>): Promise<any> {
    if (!isSimId(id)) throw new Error('HOME_INPUT_ERROR');
    const request = this.api.getOverview(id).pipe(timeout(15000));
    const data = await firstValueFrom(cancel ? request.pipe(takeUntil(cancel)) : request);
    if (!isOverview(data, id)) throw new Error('SIM_NOT_FOUND');
    return data;
  }

  remember(id: string, data: any): void {
    this.memoryId = id;
    this.verified = { id, data };
    try {
      localStorage.setItem('sim_id', id);
      localStorage.setItem('stored_data', JSON.stringify(data));
      localStorage.setItem('stored_data_updated_at', new Date().toISOString());
    } catch { /* The current session still works without persistent storage. */ }
    void Preferences.set({ key: 'sim_id', value: id }).catch(() => undefined);
  }

  takeOverview(id: string): any {
    const data = this.verified?.id === id ? this.verified.data : null;
    this.verified = null;
    return data;
  }

  returnToLogin(id: string, error: unknown): void {
    this.clear();
    this.notice = { id, key: lookupErrorKey(error) };
  }

  takeNotice(): { id: string; key: string } | null {
    const notice = this.notice;
    this.notice = null;
    return notice;
  }

  clear(): void {
    this.memoryId = '';
    this.verified = null;
    this.notice = null;
    try {
      ['sim_id', 'stored_data', 'stored_data_updated_at'].forEach(key => localStorage.removeItem(key));
    } catch { /* Storage is optional. */ }
    void Preferences.remove({ key: 'sim_id' }).catch(() => undefined);
  }
}
