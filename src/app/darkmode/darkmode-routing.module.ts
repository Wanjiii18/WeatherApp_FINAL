import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DarkmodePage } from './darkmode.page'; // Import the standalone component

const routes: Routes = [
  {
    path: '',
    component: DarkmodePage, // Use the standalone component directly
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DarkmodePageRoutingModule {}