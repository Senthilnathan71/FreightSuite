import { Routes } from '@angular/router';
import { MailConfigurationEntryComponent } from './mail-configuration/mail-configuration-entry/mail-configuration-entry.component';

export const EmailRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'mail-configuration',
        component: MailConfigurationEntryComponent,
        data: {
          title: 'Mail Configuration',
          urls: [
            { title: 'Email', url: '/email' },
            { title: 'Mail Configuration' }
          ]
        }
      }
    ]
  }
];
