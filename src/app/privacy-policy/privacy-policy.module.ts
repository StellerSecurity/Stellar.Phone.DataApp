import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonContent } from '@ionic/angular';
import { PrivacyPolicyRoutingModule } from './privacy-policy-routing.module';
import { PrivacyPolicyComponent } from './privacy-policy.component';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MetaTagsDirective } from '../directives/meta-tags.directive';
import { FooterComponent } from '../app/components/footer/footer.component';
import { HeaderComponent } from '../app/components/header/header.component';


@NgModule({
  declarations: [PrivacyPolicyComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    PrivacyPolicyRoutingModule,
    TranslatePipe,
    MetaTagsDirective,
    FooterComponent,
    HeaderComponent
  ]
})
export class PrivacyPolicyModule { }
