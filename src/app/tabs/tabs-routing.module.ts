import { inject, NgModule } from '@angular/core';
import { CanActivateFn, Router, RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

import { SimSessionService } from '../services/sim-session.service';

export const requireSim: CanActivateFn = () => inject(SimSessionService).currentId
  ? true : inject(Router).createUrlTree(['/sim-input']);

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [requireSim],
    children: [
      {
        path: 'tab1',
        loadChildren: () => import('../tab1/tab1.module').then((m) => m.Tab1PageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'sim-input',
    loadChildren: () => import('../sim-input/sim-input.module').then((m) => m.SimInputPageModule),
  },
  {
    path: '',
    redirectTo: '/sim-input',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
