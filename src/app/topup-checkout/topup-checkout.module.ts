import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopupCheckoutPageRoutingModule } from './topup-checkout-routing.module';
import { TopupCheckoutPage } from './topup-checkout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TopupCheckoutPageRoutingModule,
  ],
  declarations: [TopupCheckoutPage],
})
export class TopupCheckoutPageModule {}
