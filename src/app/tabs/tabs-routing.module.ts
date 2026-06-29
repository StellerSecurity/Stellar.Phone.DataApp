import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const hasStoredSimId = (): boolean => {
  try {
    return !!localStorage.getItem('sim_id');
  } catch {
    return false;
  }
};

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
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
    redirectTo: hasStoredSimId() ? '/tabs/tab1' : '/sim-input',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
