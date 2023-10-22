import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SimInputPage } from './sim-input.page';

const routes: Routes = [
  {
    path: '',
    component: SimInputPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SimInputPageRoutingModule {}
