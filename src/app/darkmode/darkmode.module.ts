import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DarkmodePageRoutingModule } from './darkmode-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DarkmodePageRoutingModule,
  ],
})
export class DarkmodePageModule {}