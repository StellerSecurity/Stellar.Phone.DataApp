import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

import { SecretapiService } from '../../services/secretapi.service';
import { Secret } from '../../models/secret';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { TranslationService } from '../../services/translation.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { firstValueFrom } from 'rxjs';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-created',
  templateUrl: './created.page.html',
  styleUrls: ['./created.page.scss'],
})
export class CreatedPage {
  public id: string = '';
  public url: string = '';
  metaDescription: string = '';
  metaTitle: string = 'Created Secret Message - Stellar Secret';
  metaKeywords: string = '';

  public secret: Secret = new Secret();
  public copied = false;
  public popoverEvent: MouseEvent | null = null;
  private readonly publicBaseUrl = 'https://stellarsecret.io/';

  constructor(
      @Inject(PLATFORM_ID) private platformId: object,
      private router: Router,
      private modalCtrl: ModalController,
      private alertController: AlertController,
      private secretapi: SecretapiService,
      private loadingCtrl: LoadingController,
      private translationService: TranslationService,
      private clipboard: ClipboardService,
      private readonly cdr: ChangeDetectorRef
  ) {
    // Resolve once for the initial render. Ionic can cache this page, so the
    // same logic is also repeated from ionViewWillEnter below.
    this.refreshSecretLink(false);
  }

  ionViewWillEnter(): void {
    this.refreshSecretLink(true);
  }

  private refreshSecretLink(redirectIfMissing: boolean): void {
    const nav = this.router.getCurrentNavigation();
    const idFromNav = nav?.extras?.state?.['id'];

    let idFromHistory = '';
    if (isPlatformBrowser(this.platformId)) {
      const browserState = window.history?.state as { id?: unknown } | null;
      if (typeof browserState?.id === 'string') {
        idFromHistory = browserState.id;
      }
    }

    const candidate = typeof idFromNav === 'string' ? idFromNav : idFromHistory;
    this.id = candidate.trim();
    this.url = this.id ? `${this.getBaseUrl()}${this.id}` : '';

    if (!this.id && redirectIfMissing && isPlatformBrowser(this.platformId)) {
      void this.router.navigateByUrl('/', { replaceUrl: true });
    }
  }

  private getBaseUrl(): string {
    if (isPlatformBrowser(this.platformId) && Capacitor.isNativePlatform()) {
      return this.publicBaseUrl;
    }

    if (isPlatformBrowser(this.platformId)) {
      const baseTag = document.getElementsByTagName('base')[0]?.href;

      if (baseTag && baseTag.length > 0) {
        return baseTag.endsWith('/') ? baseTag : `${baseTag}/`;
      }

      const origin = window.location.origin;
      return origin.endsWith('/') ? origin : `${origin}/`;
    }

    return this.publicBaseUrl;
  }

  private async lightTap(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // ignore on unsupported platforms
    }
  }

  private async mediumTap(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // ignore on unsupported platforms
    }
  }

  async handleCopy(ev: MouseEvent): Promise<void> {
    if (!this.url) {
      this.refreshSecretLink(false);
    }

    if (!this.url || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Capture the anchor event before any async work. Ionic's popover needs
    // the original click event to position correctly on the first click.
    this.popoverEvent = ev;

    const copied = await this.clipboard.copyText(this.url);
    if (!copied) {
      return;
    }

    this.copied = true;
    this.cdr.markForCheck();
    void this.lightTap();

    setTimeout(() => {
      this.copied = false;
      this.cdr.markForCheck();
    }, 1200);
  }

  public async createSecret(): Promise<void> {
    void this.lightTap();
    await this.router.navigateByUrl('/', {
      replaceUrl: true,
      state: { resetSecretComposer: true },
    });
  }

  public async delete(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ConfirmationModalComponent,
      cssClass: 'confirmation-popup',
    });

    await modal.present();

    const { data: confirm } = await modal.onDidDismiss<boolean>();
    if (confirm !== true) {
      return;
    }

    void this.mediumTap();

    const loading = await this.loadingCtrl.create({
      message: this.translationService.allTranslations?.BURNING_SECRET || 'Burning secret...',
    });

    await loading.present();

    let burnFailed = false;

    try {
      await firstValueFrom(this.secretapi.delete(this.id));
    } catch {
      burnFailed = true;
    } finally {
      try {
        await loading.dismiss();
      } catch {
        // The overlay can already be gone if Ionic tears down the page.
      }
    }

    if (burnFailed) {
      const alert = await this.alertController.create({
        header: this.translationService.allTranslations?.SECRET_ERROR || 'Error',
        message: this.translationService.allTranslations?.SOMETHING_WENT_WRONG || 'Something went wrong',
        buttons: [this.translationService.allTranslations?.OK || 'OK'],
      });
      await alert.present();
      return;
    }

    await this.router.navigateByUrl('/', {
      replaceUrl: true,
      state: { resetSecretComposer: true },
    });
  }

  async dismissModal(): Promise<void> {
    void this.lightTap();
    await this.modalCtrl.dismiss();
  }
}
