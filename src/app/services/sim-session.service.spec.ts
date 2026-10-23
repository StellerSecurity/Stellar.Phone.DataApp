import { NEVER, of, Subject, throwError } from 'rxjs';
import { SimSessionService, isSimId, normalizeSimId, isOverview, lookupErrorKey } from './sim-session.service';

describe('SIM lookup contract', () => {
  const id = '0000000000000001';
  it('requires exactly sixteen ASCII digits, retaining leading zeros', () => {
    for (const invalid of ['', '1977', '1'.repeat(15), '1'.repeat(17), 'a'.repeat(16), '１'.repeat(16)]) expect(isSimId(invalid)).toBeFalse();
    expect(isSimId(id)).toBeTrue();
    expect(normalizeSimId('0000 0000-0000 0001')).toBe(id);
    expect(normalizeSimId('00ab1-2')).toBe('0012');
  });
  it('rejects empty payloads, API errors and data belonging to another SIM', () => {
    expect(isOverview(null, id)).toBeFalse();
    expect(isOverview({ response_code: 404 }, id)).toBeFalse();
    expect(isOverview({ id: '0000000000000002', remaining: '5 GB' }, id)).toBeFalse();
    expect(isOverview({ id, total_data: 0, total_usage: 0 }, id)).toBeTrue();
  });
  it('does not call the API for invalid IDs', async () => {
    const api = { getOverview: jasmine.createSpy() };
    const session = new SimSessionService(api as any);
    await expectAsync(session.lookup('1977')).toBeRejected();
    expect(api.getOverview).not.toHaveBeenCalled();
  });
  it('returns the API result only after validation', async () => {
    const result = { id, total_data: 5, total_usage: 0 };
    const session = new SimSessionService({ getOverview: () => of(result) } as any);
    expect(await session.lookup(id)).toEqual(result);
    const invalid = new SimSessionService({ getOverview: () => of({}) } as any);
    await expectAsync(invalid.lookup(id)).toBeRejectedWithError('SIM_NOT_FOUND');
  });
  it('propagates network failures and supports cancellation', async () => {
    const session = new SimSessionService({ getOverview: () => throwError(() => ({ status: 0 })) } as any);
    await expectAsync(session.lookup(id)).toBeRejected();
    const pending = new Subject<any>();
    const cancelled = new SimSessionService({ getOverview: () => pending } as any);
    const cancel = new Subject<void>();
    const result = cancelled.lookup(id, cancel);
    cancel.next();
    await expectAsync(result).toBeRejected();
    expect(pending.observed).toBeFalse();
  });
  it('times out an unresponsive request instead of leaving the login loading forever', async () => {
    jasmine.clock().install();
    try {
      const session = new SimSessionService({ getOverview: () => NEVER } as any);
      const result = session.lookup(id).catch(error => lookupErrorKey(error));
      jasmine.clock().tick(15001);
      expect(await result).toBe('REQUEST_TIMEOUT');
    } finally { jasmine.clock().uninstall(); }
  });
  it('maps not-found, network, timeout and server failures to actionable messages', () => {
    expect(lookupErrorKey({ status: 404 })).toBe('SIM_NOT_FOUND');
    expect(lookupErrorKey({ status: 0 })).toBe('CONNECTION_ERROR');
    expect(lookupErrorKey({ name: 'TimeoutError' })).toBe('REQUEST_TIMEOUT');
    expect(lookupErrorKey({ status: 500 })).toBe('SERVICE_ERROR');
  });
});
