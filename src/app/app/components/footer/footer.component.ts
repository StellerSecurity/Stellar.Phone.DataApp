// footer.component.ts
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class FooterComponent implements OnInit {
  showFooterLinks = true;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isIOSNativeApp =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

    // Hide footer links when running in Capacitor on iOS.
    this.showFooterLinks = !isIOSNativeApp;
  }

  navigateToUrl(url: string): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = url;
    }
  }
}
