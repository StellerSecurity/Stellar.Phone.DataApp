import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AlertController, Platform } from '@ionic/angular';
import { SecretapiService } from '../services/secretapi.service';
import { Secret } from '../models/secret';
import { NavigationEnd, Router } from '@angular/router';
import { sha512 } from 'js-sha512';
import { v4 as uuid } from 'uuid';

import * as CryptoJS from 'crypto-js';
import { TranslateService } from '@ngx-translate/core';
import { SecretFile } from '../models/secretfile';
import { TranslationService } from '../services/translation.service';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { filter, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  selectedLanguage: string = 'en';

  metaDescription: string =
      'Share a one-time secret message and file with Stellar Secret. Protect your privacy and securely share confidential information.';
  metaTitle: string = 'Stellar Secret | Share a One-Time Secret Message and File';
  metaKeywords: string =
      'Secret message generator, Secure message sharing, Encrypt personal information, Password protection, User data encryption, Private data sharing, Convert sensitive data';
  url: string = 'https://stellarsecret.io/';

  public addSecretModal = new Secret();
  public creating = false;
  public fileReading = false;
  public optionsDisplay = false;
  public burnerTimes = [1, 6, 24];

  private readonly MAX_FILE_SIZE_MB = 30;
  private readonly ENCRYPTION_VERSION = 'v1';

  secretFiles: SecretFile[] = [];
  public chosenBurnerTime = 0;

  // Used to hide "Attach file" UI on iOS
  public isIOS = false;

  private activeFileReader: FileReader | null = null;
  private fileReadGeneration = 0;

  constructor(
      @Inject(PLATFORM_ID) private readonly platformId: object,
      private alertController: AlertController,
      private router: Router,
      private secretapi: SecretapiService,
      private translate: TranslateService,
      private translationService: TranslationService,
      private platform: Platform,
      private readonly cdr: ChangeDetectorRef,
      private readonly destroyRef: DestroyRef
  ) {
    this.translate.setFallbackLang(this.selectedLanguage);

    // Hide on iOS (native + iOS Safari/PWA), but do not touch browser/native APIs during SSR.
    if (isPlatformBrowser(this.platformId)) {
      this.isIOS =
        Capacitor.getPlatform() === 'ios' ||
        this.platform.is('ios') ||
        this.platform.is('iphone') ||
        this.platform.is('ipad');
    }

    // Ionic keeps routed pages alive. Reset the composer whenever navigation
    // returns to the home route, including browser back and header navigation.
    this.router.events
        .pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((event) => {
          const homeUrl = event.urlAfterRedirects.split('?')[0].split('#')[0];
          if (homeUrl === '/' || homeUrl === '/home') {
            this.resetComposer();
            this.cdr.markForCheck();
          }
        });
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

  public async optionsToggle(): Promise<void> {
    void this.lightTap();
    this.optionsDisplay = !this.optionsDisplay;
  }

  async onChangeFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    void this.lightTap();

    const totalSizeMB = file.size / Math.pow(1024, 2);

    if (totalSizeMB > this.MAX_FILE_SIZE_MB) {
      if (input) input.value = '';

      const alert = await this.alertController.create({
        header: this.translationService.allTranslations?.ERROR || 'Error',
        message:
            (this.translationService.allTranslations?.FILE_IS_TOO_BIG_MAX_SIZE_IS || 'File is too big. Max size is') +
            ' ' +
            this.MAX_FILE_SIZE_MB +
            ' ' +
            (this.translationService.allTranslations?.MB_FILE_WAS_NOT_ADDED || 'MB. File was not added.'),
        buttons: [this.translationService.allTranslations?.OK || 'OK'],
      });
      await alert.present();
      return;
    }

    if (this.secretFiles.length >= 1) {
      if (input) input.value = '';

      const alert = await this.alertController.create({
        header: this.translationService.allTranslations?.ERROR_MAX_1_FILE_PER_SECRET || 'Maximum one file per secret',
        message: this.translationService.allTranslations?.A_SECRET_CAN_ONLY_INCLUDE_ONE_FILE || 'A secret can only include one file.',
        buttons: [this.translationService.allTranslations?.OK || 'OK'],
      });
      await alert.present();
      return;
    }

    // Cancel/invalidate any previous pending FileReader. This prevents a stale
    // read from repopulating a composer after navigation/reset.
    this.cancelPendingFileRead();
    const generation = ++this.fileReadGeneration;
    const reader = new FileReader();
    this.activeFileReader = reader;
    this.fileReading = true;

    reader.addEventListener('load', () => {
      if (generation !== this.fileReadGeneration) {
        return;
      }

      const secretFile = new SecretFile();
      secretFile.name = file.name || 'File 1';
      secretFile.id = null;
      secretFile.content = reader.result?.toString() || '';
      this.secretFiles = [secretFile];
      this.cdr.markForCheck();
    });

    reader.addEventListener('error', () => {
      if (generation !== this.fileReadGeneration) {
        return;
      }

      void this.showFileReadError();
      this.cdr.markForCheck();
    });

    reader.addEventListener('loadend', () => {
      if (generation !== this.fileReadGeneration) {
        return;
      }

      this.fileReading = false;
      this.activeFileReader = null;
      if (input) input.value = '';
      this.cdr.markForCheck();
    });

    reader.readAsDataURL(file);
  }

  private async showFileReadError(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translationService.allTranslations?.ERROR || 'Error',
      message: this.translationService.allTranslations?.SOMETHING_WENT_WRONG || 'Could not read the selected file.',
      buttons: [this.translationService.allTranslations?.OK || 'OK'],
    });
    await alert.present();
  }

  private cancelPendingFileRead(): void {
    this.fileReadGeneration += 1;

    if (this.activeFileReader && this.activeFileReader.readyState === FileReader.LOADING) {
      try {
        this.activeFileReader.abort();
      } catch {
        // Best-effort cancellation only. The generation guard still protects state.
      }
    }

    this.activeFileReader = null;
    this.fileReading = false;
  }

  public async removeFile(index: number): Promise<void> {
    void this.lightTap();
    this.cancelPendingFileRead();
    this.secretFiles = [];
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  ionViewWillEnter(): void {
    this.resetComposer();
  }

  private resetComposer(): void {
    this.cancelPendingFileRead();
    this.addSecretModal = new Secret();
    this.secretFiles = [];
    this.chosenBurnerTime = 0;
    this.optionsDisplay = false;
    this.creating = false;

    // Clear the native file input as well. Without this, selecting the same
    // file again after returning home may not emit a change event.
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private async renderCreatingState(): Promise<void> {
    this.cdr.detectChanges();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Two animation frames guarantee the loading UI gets a paint before the
    // synchronous CryptoJS encryption (which can be noticeable for large files).
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }

  public async setBurnerTime(burnerTime: number): Promise<void> {
    void this.lightTap();

    if (burnerTime === this.chosenBurnerTime) {
      burnerTime = 0;
    }

    this.chosenBurnerTime = burnerTime;
  }

  public async createLink(): Promise<void> {
    if (this.creating || this.fileReading) {
      return;
    }

    void this.lightTap();

    // Keep the composer state as plaintext. Encryption must only happen on a
    // separate request payload; otherwise a failed request followed by Retry
    // would encrypt the already encrypted message/file a second time.
    const message = (this.addSecretModal.message || '').toString();
    const sourceFile = this.secretFiles[0];
    const hasMessage = message.trim().length > 0;
    const hasFile = !!sourceFile;

    if (!hasMessage && !hasFile) {
      const alert = await this.alertController.create({
        header: this.translationService.allTranslations?.ERROR || 'Error',
        message:
            this.translationService.allTranslations
                ?.NO_MESSAGE_OR_FILE_WAS_ADDED_PLEASE_ADD_AND_TRY_AGAIN ||
            'Please add a message or file and try again.',
        buttons: [this.translationService.allTranslations?.OK || 'OK'],
      });
      await alert.present();
      return;
    }

    this.creating = true;
    await this.renderCreatingState();

    const secretId = uuid();
    const userPassword = (this.addSecretModal.password || '').toString();
    const hasPassword = userPassword.length > 0;
    const encryptionKey = hasPassword ? userPassword : secretId;

    const payload = new Secret();
    payload.id = sha512(secretId);
    payload.expires_at = this.chosenBurnerTime.toString();
    payload.has_password = hasPassword;
    payload.password = undefined;
    (payload as any).encryption_version = this.ENCRYPTION_VERSION;

    payload.message = hasMessage
        ? CryptoJS.AES.encrypt(message, encryptionKey).toString()
        : '';

    if (sourceFile) {
      const encryptedFile = new SecretFile();
      encryptedFile.name = sourceFile.name;
      encryptedFile.id = sha512(secretId);
      encryptedFile.content = CryptoJS.AES.encrypt(
          (sourceFile.content || '').toString(),
          encryptionKey
      ).toString();
      payload.files = [encryptedFile];
    } else {
      payload.files = [];
    }

    try {
      await firstValueFrom(this.secretapi.create(payload));
    } catch {
      this.creating = false;

      const alert = await this.alertController.create({
        header: this.translationService.allTranslations?.ERROR || 'Error',
        message:
            (this.translationService.allTranslations
                ?.SOMETHING_WENT_WRONG_PLEASE_TRY_AGAIN_IF_YOU_INCLUDED_A_FILE_THE_LIMIT_IS ||
                'Something went wrong. Please try again. If you included a file, the limit is') +
            ' ' +
            this.MAX_FILE_SIZE_MB +
            ' ' +
            (this.translationService.allTranslations?.MB || 'MB'),
        buttons: [this.translationService.allTranslations?.OK || 'OK'],
      });

      await alert.present();
      return;
    }

    void this.mediumTap();

    const navigated = await this.router.navigate(['/secret/created'], {
      state: { id: secretId },
    });

    // Only clear the composer after Angular confirms that the created page was
    // entered. This avoids losing the plaintext if navigation itself fails.
    if (navigated) {
      this.resetComposer();
      return;
    }

    // Navigation failed, so keep the plaintext composer intact for retry.
    this.creating = false;
  }
}
