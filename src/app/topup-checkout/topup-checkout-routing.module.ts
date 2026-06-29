import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TopupCheckoutPage } from './topup-checkout.page';

const routes: Routes = [
  {
    path: '',
    component: TopupCheckoutPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TopupCheckoutPageRoutingModule {}
