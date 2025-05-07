import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BookingRoutes } from './booking-routing.module';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(BookingRoutes)

  ]
})
export class BookingModule { }
