import { Component, OnInit } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppService } from './service/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';

  isMobile: boolean = false;

  constructor(private appService: AppService, private deviceService: DeviceDetectorService ) {

  }

  ngOnInit(): void {
    this.isMobile = this.deviceService.isMobile();
    this.appService.setDevice(this.isMobile)
  }
}
