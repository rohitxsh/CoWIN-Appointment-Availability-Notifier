import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

import { Session } from '../../services/cowin.model'

@Component({
  selector: 'app-session-modal',
  templateUrl: './session-modal.component.html',
  styleUrls: ['./session-modal.component.scss'],
})
export class SessionModalComponent {
  @Input() data: Session[];
  toast: HTMLIonToastElement;

  constructor(private modalController: ModalController, private toastController: ToastController,) { }

  dismissModal() {
    this.modalController.dismiss();
  }

  async presentToast(message: string, duration: number): Promise<void> {
    this.toast = await this.toastController.create({
      message: message,
      duration: duration
    });
    this.toast.present();
  }

  chipClickHandler(event: any){
    this.presentToast(event.srcElement.innerHTML, 1000);
  }

}
