import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthenticationRoutes } from './authentication.routing';

@NgModule({
  imports: [
    ReactiveFormsModule,
    RouterModule.forChild(AuthenticationRoutes), ]
})
export class AuthenticationModule {}
