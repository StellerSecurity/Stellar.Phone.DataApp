import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.page.html',
  styleUrls: ['./how-it-works.page.scss'],
})
export class HowItWorksPage  implements OnInit {
  selectedLanguage: string = 'en';

  metaDescription:string = 'Learn how Stellar Secret ensures privacy with encrypted, end-to-end secure messaging. Send your confidential messages safely without a trace, keeping your data protected.';
  metaTitle:string = 'How It Works - Stellar Secret';
  metaKeywords:string = 'Encrypted messaging process, Secure message encryption, End-to-end encryption, Privacy without trace, Protect your personal data, How secure messaging works';
  url: string = 'https://stellarsecret.io/how-it-works';

  constructor(private translate: TranslateService) {
    this.translate.setFallbackLang(this.selectedLanguage);
   }

  ngOnInit() {
    
  }
  
}
