import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ComponentsRoutes } from './component.routing';

@NgModule({
  imports: [RouterModule.forChild(ComponentsRoutes)],
  declarations: [],
})
export class ComponentsModule {}
