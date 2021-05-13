import { Component, OnInit, Inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { Plugins } from '@capacitor/core';
import { Platform, LoadingController, AlertController, PopoverController, ToastController, ModalController } from '@ionic/angular';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { Autostart } from '@ionic-native/autostart/ngx';
import { PowerManagement } from '@ionic-native/power-management/ngx';

import BackgroundFetch, { BackgroundFetchConfig } from 'cordova-plugin-background-fetch'

import { PopoverComponent } from './popover/popover.component';
import { ModalComponent } from './modal/modal.component';
import { CowinService } from '../services/cowin.service';

const { Storage } = Plugins;

//background fetch configuration for Android
//currently not in use - requires the fetch task to be written in Java
//https://github.com/transistorsoft/cordova-plugin-background-fetch#config-boolean-enableheadless-false
const config_android: BackgroundFetchConfig = {
  enableHeadless: true,
  forceAlarmManager: true,
  stopOnTerminate: false,
  startOnBoot: true,
  //required, disabled for pwa testing
  //requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  //data
  state_name: string;
  district_id: string;
  district_name: string;
  startDate: string;
  endDate: string;
  lastUpdateDate: string;

  isAlertActive = false;
  alert: HTMLIonAlertElement;
  loading: HTMLIonLoadingElement;
  popover: HTMLIonPopoverElement;
  toast: HTMLIonToastElement;
  states = [];
  districts = [];
  data = {};
  modalData = {};
  isStateSelected: boolean;
  isDistrictSelected: boolean;
  isDateSelected: boolean;
  testMode = true;
  fee_type = "any";
  updateInterval = 15;
  minimumAgeLimit = 18;
  flag = 0;

  subscription: Subscription;
  backgroundTaskSub: Subscription;
  backgroundModeSub: Subscription;
  getStatesSub: Subscription;
  getDistrictsSub: Subscription;
  serviceTask: any;

  constructor(
    private cowinService: CowinService,
    private platform: Platform,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private backgroundMode: BackgroundMode,
    private powerManagement: PowerManagement,
    private popoverController: PopoverController,
    private toastController: ToastController,
    private modalController: ModalController,
    @Inject(Autostart) private autostart: Autostart,
    @Inject(LocalNotifications) private localNotifications: LocalNotifications ) {}

  async ngOnInit() {
    if((await Storage.keys()).keys.length){
      this.isAlertActive = true;
      this.data = JSON.parse((await Storage.get({ key: 'activeData' })).value);
      this.lastUpdateDate = (await Storage.get({ key: 'lastUpdateDate' })).value;
      var apiData = JSON.parse((await Storage.get({ key: 'apiData' })).value);
      this.district_id = apiData.district_id;
      this.startDate = apiData.date;
      var preferences = JSON.parse((await Storage.get({ key: 'preferences' })).value);
      this.testMode = preferences.testMode;
      this.fee_type = preferences.fee_type;
      this.updateInterval = preferences.updateInterval;
      this.minimumAgeLimit = preferences.minimumAgeLimit;
      this.alertServiceManager(this);
    }
    else{
      this.fetchStates();
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark');
  }

  async createAlert(): Promise<void> {
    this.alert = await this.alertController.create({
      message: 'Unable to fetch update from CoWIN!',
      buttons: ['Close'],
    });
    this.alert.present();
  }

  async createLoading(message: string): Promise<void> {
    this.loading = await this.loadingController.create({
      cssClass: 'loading-class',
      message: message,
    });
    this.loading.present();
  }

  async presentPopover(): Promise<void> {
    this.popover = await this.popoverController.create({
      component: PopoverComponent,
      translucent: true
    });
    await this.popover.present();
  }

  async presentToast(message: string, duration: number): Promise<void> {
    this.toast = await this.toastController.create({
      message: message,
      duration: duration
    });
    this.toast.present();
  }

  async presentModal(): Promise<void> {
    await this.createLoading('Loading...');
    await this.cowinService.getCalendarByDistrict(this.district_id, this.startDate).toPromise().then((modalData)=>{ this.modalData = modalData });
    const modal = await this.modalController.create({
      component: ModalComponent,
      componentProps: {data: this.modalData}
    });
    await modal.present().then(() => { this.loading.dismiss(); });
  }

  async fetchStates(): Promise<void> {
    await this.createLoading('Loading list of states...');
    this.getStatesSub = this.cowinService.getStates().subscribe(
      (data) => {
        this.states = data;
        this.loading.dismiss();
      },
      () => {
        this.loading.dismiss();
        this.createAlert();
        this.states = [];
      }
    );
  }

  async fetchDistricts(event: any): Promise<void> {
    await this.createLoading('Loading list of districts...');
    this.isStateSelected = true;
    this.state_name = event.detail.value.state_name;

    this.getDistrictsSub = this.cowinService.getDistricts(event.detail.value.state_id).subscribe(
      (data) => {
        this.districts = data;
        this.loading.dismiss();
      },
      () => {
        this.loading.dismiss();
        this.createAlert();
        this.districts = [];
      }
    );
  }

  setDistrict(event: any): void {
    this.isDistrictSelected = true;
    this.district_id = event.detail.value.district_id;
    this.district_name = event.detail.value.district_name;
  }

  setDate(event: any): void {
    this.isDateSelected = true;
    this.startDate = event.detail.value.split('T')[0].split('-').reverse().join('-');
    var temp = new Date(event.detail.value);
    temp.setDate(temp.getDate() + 7);
    this.endDate = ('0' + temp.getDate()).slice(-2) + '-' + ('0' + (temp.getMonth()+1)).slice(-2) + '-' + temp.getFullYear();
  }

  async testInfo(): Promise<void>{
    await this.presentPopover();
  }

  testToggle(event: any): void{
    this.testMode = event.detail.checked;
  }

  segmentChanged(event: any){
    this.fee_type = event.detail.value;
  }

  ageSetter(event: any){
    this.minimumAgeLimit = (event.detail.value);
  }

  updateIntervalInfo(event: any){
    this.updateInterval = parseInt(event.detail.value);
  }

  ageElement(n: number){
    if (!n) {
      return "Show all"
    }
    else{
      return "Only " + n.toString() + "+";
    }
  }

  chipClickHandler(event: any){
    this.presentToast(event.srcElement.innerHTML, 1000);
  }

  showNotification(data, sessions){
    this.localNotifications.schedule({
      id: Math.random()*100,
      title: 'Slots available at ' + data.name,
      text: 'Center name: ' + data.name + ", " + data.block_name + ', Date:' + sessions.date + ', Available capacity: ' + sessions.available_capacity + ', Vaccine: ' + sessions.vaccine + " [" + (new Date()).toString().split(" ")[4] + "]"
    });
  }

  async alertService(): Promise<void>{
    this.flag = 0;
    var apiData = JSON.parse((await Storage.get({ key: 'apiData' })).value);
    this.district_id = apiData.district_id;
    this.startDate = apiData.date;
    var preferences = JSON.parse((await Storage.get({ key: 'preferences' })).value);
    this.testMode = preferences.testMode;
    this.fee_type = preferences.fee_type;
    this.updateInterval = preferences.updateInterval;
    this.minimumAgeLimit = preferences.minimumAgeLimit;
    this.subscription = this.cowinService.getCalendarByDistrict(this.district_id, this.startDate).subscribe(
      async (data) => {
        await Storage.set({
            key: 'lastUpdateDate',
            value: (new Date()).toString()
        });
        this.lastUpdateDate = (new Date()).toString();
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].sessions.length; j++) {
            //fee type is any with age limit filer
            if(this.fee_type === 'any' && this.minimumAgeLimit) {
              if (data[i].sessions[j].min_age_limit === this.minimumAgeLimit && data[i].sessions[j].available_capacity > 0) {
                this.flag++;
                this.showNotification(data[i], data[i].sessions[j]);
              }
            }
            //fee type is any and no age limit filer
            else if(this.fee_type === 'any' && !this.minimumAgeLimit) {
              if (data[i].sessions[j].available_capacity > 0) {
                this.flag++;
                this.showNotification(data[i], data[i].sessions[j]);
              }
            }
            //fee type is either free or paid with age limit filer
            else if (!(this.fee_type === 'any') && this.minimumAgeLimit){
              if (data[i].sessions[j].min_age_limit === this.minimumAgeLimit && data[i].sessions[j].available_capacity > 0 && data[i].fee_type === this.fee_type){
                this.flag++;
                this.showNotification(data[i], data[i].sessions[j]);
              }
            }
            //fee type is either free or paid and no age limit filer
            else if (!(this.fee_type === 'any') && !this.minimumAgeLimit){
              if (data[i].sessions[j].available_capacity > 0 && data[i].fee_type === this.fee_type){
                this.flag++;
                this.showNotification(data[i], data[i].sessions[j]);
              }
            }
          }
        }
        if((!this.flag) && this.testMode){
          this.localNotifications.schedule({
            id: 2,
            text: 'No new slots found!'
          });
        }
      },
      () => {
        this.localNotifications.schedule({
          id: 3,
          text: 'Unable to fetch update from CoWIN!',
        });
      }
    );
  }

  async alertServiceManager(scopeOfThis: this) {

    //use background-fetch for iOS and background-mode for android and other devices
    if(this.platform.is('ios')){

      let onEvent = async (taskId) => {
        this.alertService();
        BackgroundFetch.finish(taskId);
      };
      let onTimeout = async (taskId) => {
          BackgroundFetch.finish(taskId);
      };
      await BackgroundFetch.configure({
        minimumFetchInterval: this.updateInterval
      }, onEvent, onTimeout);

    }
    else{

      this.backgroundMode.enable();

      //acquire partial wakelock
      this.powerManagement.dim();
      //this will reacquire the wakelock upon app resume
      this.powerManagement.setReleaseOnPause(false);

      //backgroundMode configurations
      this.backgroundMode.disableBatteryOptimizations();
      this.backgroundMode.excludeFromTaskList();
      this.backgroundMode.overrideBackButton();

      this.backgroundMode.setDefaults({
        title: 'CoWIN Appointment Availability Notifier',
        text: 'Alert service is active',
        icon: 'splash',
        resume: false
      });

      //background task configuration
      this.backgroundTaskSub = this.backgroundMode.on('enable').subscribe(() => {
        this.serviceTask = setInterval(function(){
          scopeOfThis.alertService();
        }, (this.updateInterval*60*1000));
      });
      this.backgroundModeSub = this.backgroundMode.on('activate').subscribe(() => {
        //Turn screen on
        // this.backgroundMode.wakeUp();
        // disableWebViewOptimizations is crashing the app if plugin is installed from https://github.com/katzer/cordova-plugin-background-mode
        // use https://bitbucket.org/TheBosZ/cordova-plugin-run-in-background/src/master/, few type definitions are missing
        this.backgroundMode.disableWebViewOptimizations();
        //this.backgroundMode.wakeUp();
      });

    }

    //automatically starts the app after every boot or auto-update
    this.autostart.enable();

    this.localNotifications.schedule({
      id: 4,
      title: 'Alert service is active now.',
      text: 'We will notify you via notification channel when a new slot becomes available.'
    });

    this.alertService();
  }

  saveAlertCheck() {
    try{
      if(this.updateInterval > 0 && this.updateInterval <= 60){
        this.saveAlert();
      }
      else { this.presentToast('Sync interval should be between 0 to 60 min(s).', 2000); }
    } catch { this.presentToast('Sync interval should be between 0 to 60 min(s).', 2000); }
  }

  async saveAlert(): Promise<void> {
    await Storage.set({
      key: 'lastUpdateDate',
      value: (new Date()).toString()
    });

    await Storage.clear();

    //show loader
    await this.createLoading('Setting up alert service...');

    //save data to storage
    await Storage.set({
      key: 'activeData',
      value: JSON.stringify({
        state_name: this.state_name,
        district_name: this.district_name,
        startDate: this.startDate,
        endDate: this.endDate
      }),
    });
    await Storage.set({
      key: 'apiData',
      value: JSON.stringify({
        district_id: this.district_id,
        date: this.startDate
      }),
    });
    await Storage.set({
      key: 'preferences',
      value: JSON.stringify({
        testMode: this.testMode,
        fee_type: this.fee_type,
        updateInterval: this.updateInterval,
        minimumAgeLimit: this.minimumAgeLimit
      }),
    });
    await Storage.set({
      key: 'lastUpdateDate',
      value: (new Date()).toString()
    });

    //unsubscribe as these subscriptions are not required in active alert page
    this.getStatesSub.unsubscribe();
    this.getDistrictsSub.unsubscribe();

    //fetch data from storage before moving to active alert page
    this.data = JSON.parse((await Storage.get({ key: 'activeData' })).value);
    this.lastUpdateDate = (await Storage.get({ key: 'lastUpdateDate' })).value;

    var scopeOfThis = this;
    this.alertServiceManager(scopeOfThis);

    //show a small loader
    setTimeout(function(){
      scopeOfThis.loading.dismiss();
      scopeOfThis.isAlertActive = true;
    }, 1000);

    if(!this.platform.is('ios')){
      this.presentToast('Please make sure the app is whitelisted in your battery saver settings. [Note: If the permanent service notification disappears that means the app was killed by your OS].', 6000);
    }
  }

  async deleteAlert(){
    await Storage.clear();
    try{
      this.subscription.unsubscribe();
      clearInterval(this.serviceTask);
    }catch{}
    if(this.platform.is('ios')){
      BackgroundFetch.stop();
    }
    else{
      this.powerManagement.release();
      this.backgroundMode.disable();
      try{
        this.backgroundTaskSub.unsubscribe();
        this.backgroundModeSub.unsubscribe();
      }catch{}
    }
    this.autostart.disable();
    this.isStateSelected = false;
    this.isDistrictSelected = false;
    this.isDateSelected = false;
    this.isAlertActive = false;
    this.testMode = true;
    this.fee_type = "any";
    this.updateInterval = 15;
    this.minimumAgeLimit = 18;
    this.fetchStates();
  }
}
