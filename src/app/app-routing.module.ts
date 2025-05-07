import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { AuthGuard } from './core/guards/auth.guard';

export const Approutes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    data: {
      type: 'FullComponent'
    },
    children: [
      {
        path: '',
        redirectTo: 'crm/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'crm',
        loadChildren: () => import('./modules/crm-mobile/crm-mobile.module').then(m => m.CrmMobileModule)
      },
      {
        path: 'master',
        loadChildren: () => import('./modules/master/master.module').then(m => m.MasterModule)
      },
      {
        path: 'accounts',
        loadChildren: () => import('./modules/accounts/accounts.module').then(m => m.AccountsModule)
      },
      {
        path: 'starter',
        loadChildren: () => import('./starter/starter.module').then(m => m.StarterModule)
      },
      {
        path: 'component',
        loadChildren: () => import('./component/component.module').then(m => m.ComponentsModule)
      }
    ]
  },
  {
    path: '',
    component: BlankComponent,
    data: {
      type: 'BlankComponent'
    },
    children: [
      {
        path: 'auth',
        loadChildren: () =>
          import('./modules/authentication/authentication.module').then(
            (m) => m.AuthenticationModule
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/starter'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(Approutes, { preloadingStrategy: PreloadAllModules }) // Enabling PreloadAllModules
  ],
  exports: [RouterModule]
})

export class AppRoutingModule { }