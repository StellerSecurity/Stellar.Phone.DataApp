import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-esim-promo',
  standalone: true,
  imports: [IonicModule, TranslateModule],
  templateUrl: './esim-promo.component.html',
  styleUrls: ['./esim-promo.component.scss'],
})
export class EsimPromoComponent {
  // Official download destinations linked from https://stellaresim.com/.
  readonly appStoreUrl = 'https://apps.apple.com/pl/app/stellar-esim-travel-data/id6797968792';
  readonly googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.stellarsecurity.esim';
}
