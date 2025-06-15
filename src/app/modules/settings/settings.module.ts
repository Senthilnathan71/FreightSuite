import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsRoutes } from './settings-routing.module';
import { SettingsService } from './settings.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(SettingsRoutes)
  ],
  providers: [SettingsService]
})
export class SettingsModule { }
