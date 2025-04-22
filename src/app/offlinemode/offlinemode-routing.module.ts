import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OfflinemodePage } from './offlinemode.page'; // Import the standalone component

const routes: Routes = [
  {
    path: '',
    component: OfflinemodePage, // Use the standalone component directly
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OfflinemodePageRoutingModule {}