import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonContent } from '@ionic/angular';
import { TermsAndConditionsRoutingModule } from './terms-and-conditions-routing.module';
import { TermsAndConditionsComponent } from './terms-and-conditions.component';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MetaTagsDirective } from '../directives/meta-tags.directive';
import { HeaderComponent } from '../app/components/header/header.component';
import { FooterComponent } from '../app/components/footer/footer.component';


@NgModule({
  declarations: [TermsAndConditionsComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    TermsAndConditionsRoutingModule,
    TranslatePipe,
    MetaTagsDirective,
    FooterComponent,
    HeaderComponent
  ]
})
export class TermsAndConditionsModule { }
