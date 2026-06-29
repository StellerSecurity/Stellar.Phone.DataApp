import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'topup-checkout',
    loadChildren: () => import('./topup-checkout/topup-checkout.module').then(m => m.TopupCheckoutPageModule)
  },
  {
    path: 'topup/:token',
    loadChildren: () => import('./topup/topup.module').then(m => m.TopupPageModule)
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'sim-input',
    loadChildren: () => import('./sim-input/sim-input.module').then( m => m.SimInputPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
