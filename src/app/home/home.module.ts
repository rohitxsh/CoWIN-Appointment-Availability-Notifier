import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePage } from './home.page';
import { ModalComponent } from './modal/modal.component'
import { SessionModalComponent } from './session-modal/session-modal.component'
import { PopoverComponent } from './popover/popover.component'

import { HomePageRoutingModule } from './home-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage, ModalComponent, SessionModalComponent, PopoverComponent]
})
export class HomePageModule {}
