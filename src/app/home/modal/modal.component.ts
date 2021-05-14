import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

import { SessionModalComponent } from '../session-modal/session-modal.component'
import { Center, Session } from '../../services/cowin.model'

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit {

  @Input() data: Center[];
  filteredData: Center[];
  modalData: {number: Session[]} = {} as {number: Session[]};
  toast: HTMLIonToastElement;

  constructor(private modalController: ModalController, private toastController: ToastController,) { }

  ngOnInit() {
    this.filteredData = this.data;
    for (let i = 0; i < this.data.length; i++) {
      this.modalData[this.data[i].center_id] = this.data[i].sessions;
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  async presentModal(id: number): Promise<void> {
    const modal = await this.modalController.create({
      component: SessionModalComponent,
      componentProps: { data: this.modalData[id] }
    });
    await modal.present();
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

  handleInput(event: any) {
    this.filteredData = [];
    for(let i=0; i<this.data.length; i++){
      if (this.data[i].name.toLowerCase().includes(event.target.value.toLowerCase()) || this.data[i].address.toLowerCase().includes(event.target.value.toLowerCase()) || this.data[i].block_name.toLowerCase().includes(event.target.value.toLowerCase()) || this.data[i].pincode.toString().includes(event.target.value.toString()) || this.data[i].fee_type.toLowerCase().includes(event.target.value.toLowerCase())){
        this.filteredData.push(this.data[i])
      }
    }
  }

}
