import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit {

  @Input() data: any;
  filteredData: Object[] = [];
  toast: HTMLIonToastElement;

  constructor(private modalController: ModalController, private toastController: ToastController,) { }

  ngOnInit() {
    this.filteredData = this.data;
  }

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

  handleInput(event: any) {
    this.filteredData = [];
    for(let i=0; i<this.data.length; i++){
      console.log(this.data[i].name);
      if (this.data[i].name.toLowerCase().includes(event.target.value.toLowerCase()) || this.data[i].address.toLowerCase().includes(event.target.value.toLowerCase()) || this.data[i].block_name.toLowerCase().includes(event.target.value.toLowerCase()) || this.data[i].pincode.toString().includes(event.target.value.toString()) || this.data[i].fee_type.toLowerCase().includes(event.target.value.toLowerCase())){
        this.filteredData.push(this.data[i])
      }
    }
    console.log(this.filteredData)
  }

}
