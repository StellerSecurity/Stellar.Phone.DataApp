import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HowItWorksPage } from './how-it-works.page';

const routes: Routes = [
  {
    path: '',
    component: HowItWorksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HowItWorksPageRoutingModule {}
