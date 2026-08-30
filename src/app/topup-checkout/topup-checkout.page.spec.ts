import { of } from 'rxjs';

import { TopupCheckoutPage } from './topup-checkout.page';

describe('TopupCheckoutPage Mollie fallback', () => {
  function createPage(http: any): TopupCheckoutPage {
    return new TopupCheckoutPage(
      {} as any,
      {} as any,
      http,
      { run: (callback: () => void) => callback() } as any,
      {} as any,
      {} as any,
      {} as any
    );
  }

  function configureManualTopup(page: TopupCheckoutPage): void {
    page.orderId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    page.checkoutType = 'esim_topup';
    page.order = {
      meta: {
        source: 'SIMCARD_TOPUP',
        checkout_type: 'esim_topup',
      },
    };
    (page as any).paymentIntentId = 'pi_test_manual_topup';
  }

  it('replaces Stripe with Mollie in-place after server activation', async () => {
    const http = {
      post: jasmine.createSpy('post').and.returnValue(of({ fallback_activated: true })),
    };
    const page = createPage(http);
    configureManualTopup(page);
    const destroyPaymentElements = spyOn<any>(page, 'destroyPaymentElements');

    await (page as any).handleStripeFailure('Card declined.');

    expect(http.post).toHaveBeenCalledWith(
      jasmine.stringMatching(/activate-mollie-topup-fallback$/),
      {
        order_id: page.orderId,
        payment_intent_id: 'pi_test_manual_topup',
      }
    );
    expect(page.paymentProvider).toBe('mollie');
    expect(page.errorMessage).toBe('');
    expect(page.paymentMessage).toContain('another secure payment provider');
    expect(destroyPaymentElements).toHaveBeenCalled();
  });

  it('keeps Stripe and its error before the verified threshold is reached', async () => {
    const http = {
      post: jasmine.createSpy('post').and.returnValue(of({
        fallback_activated: false,
        failed_attempts: 1,
        required_attempts: 3,
      })),
    };
    const page = createPage(http);
    configureManualTopup(page);

    await (page as any).handleStripeFailure('Card declined.');

    expect(page.paymentProvider).toBe('stripe');
    expect(page.errorMessage).toBe('Card declined.');
  });

  it('does not request fallback for a non-manual order', async () => {
    const http = { post: jasmine.createSpy('post') };
    const page = createPage(http);
    page.orderId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    page.checkoutType = 'esim_topup';
    page.order = { meta: { source: 'esim_auto_topup', checkout_type: 'esim_topup' } };
    (page as any).paymentIntentId = 'pi_test_auto_topup';

    await (page as any).handleStripeFailure('Payment failed.');

    expect(http.post).not.toHaveBeenCalled();
    expect(page.paymentProvider).toBe('stripe');
  });

  it('recognizes a fulfilled Mollie return and enters the success flow', async () => {
    const http = {
      get: jasmine.createSpy('get').and.returnValue(of({
        data: { status: 'FULFILLED' },
      })),
    };
    const page = createPage(http);
    configureManualTopup(page);
    const handleSuccessfulPayment = spyOn<any>(page, 'handleSuccessfulPayment').and.resolveTo();
    spyOn<any>(page, 'destroyPaymentElements');

    await (page as any).restoreMollieReturn();

    expect(http.get).toHaveBeenCalledWith(
      jasmine.stringMatching(/checkoutcontroller\/order\/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa$/)
    );
    expect(page.paymentProvider).toBe('mollie');
    expect(handleSuccessfulPayment).toHaveBeenCalled();
  });
});
