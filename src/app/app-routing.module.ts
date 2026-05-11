import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ShortcutComponent } from './modules/shortcut/shortcut.component';
import { ShipmentInstructionComponent } from './modules/operation/shipment-instruction/shipment-instruction/shipment-instruction.component';

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
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'crm',
        loadChildren: () => import('./modules/crm-mobile/crm-mobile.module').then(m => m.CrmMobileModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
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
        path: 'settings',
        loadChildren: () => import('./modules/settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: 'email',
        loadChildren: () => import('./modules/email/email.module').then(m => m.EmailModule)
      },
      {
      path: 'operation',
      loadChildren: () => import('./modules/operation/operation.module').then(m => m.OperationModule)
     },
      {
        path: 'shortcut',
        component: ShortcutComponent
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
    path: 'public/shipment-instruction',
    component: ShipmentInstructionComponent
  },
  {
    path: 'public/quotation/:token',
    loadComponent: () =>
      import('./modules/public-quotation/public-quotation-approval.component').then(
        m => m.PublicQuotationApprovalComponent
      )
  },
  {
    path: '**',
    redirectTo: '/starter'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(Approutes, { 
      preloadingStrategy: PreloadAllModules,
      enableTracing: false, // Set to true for debugging
      onSameUrlNavigation: 'reload',
      // Add these options to help with navigation state
      urlUpdateStrategy: 'eager',
      canceledNavigationResolution: 'replace'
    })
    // RouterModule.forRoot(Approutes, { preloadingStrategy: PreloadAllModules }) // Enabling PreloadAllModules
  ],
  exports: [RouterModule]
})

export class AppRoutingModule { }