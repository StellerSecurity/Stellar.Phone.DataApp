import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'secret/created',
    loadChildren: () => import('./secret/created/created.module').then((m) => m.CreatedPageModule),
  },
  {
    path: 'how-it-works',
    loadChildren: () => import('./how-it-works/how-it-works.module').then((m) => m.HowItWorksPageModule),
  },
  {
    path: 'terms-and-conditions',
    loadChildren: () => import('./terms-and-conditions/terms-and-conditions.module').then((m) => m.TermsAndConditionsModule),
  },
  {
    path: 'privacy-policy',
    loadChildren: () => import('./privacy-policy/privacy-policy.module').then((m) => m.PrivacyPolicyModule),
  },
  {
    path: 'blog/:slug',
    loadChildren: () => import('./blog/blog-post/blog-post.module').then((m) => m.BlogPostPageModule),
  },
  {
    path: 'blog',
    loadChildren: () => import('./blog/blog.module').then((m) => m.BlogPageModule),
  },
  {
    path: ':id',
    loadChildren: () => import('./secret/view/view.module').then((m) => m.ViewPageModule),
  },
];
