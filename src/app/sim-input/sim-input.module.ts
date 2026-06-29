import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { SimInputPageRoutingModule } from './sim-input-routing.module';
import { SimInputPage } from './sim-input.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    SimInputPageRoutingModule,
  ],
  declarations: [SimInputPage],
})
export class SimInputPageModule {}
