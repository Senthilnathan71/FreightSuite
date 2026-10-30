import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppService } from './service/app.service';
import { SessionStateService } from './core/services/session-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app';

  isMobile: boolean = false;
  readOnly = false;
  private sessionStateSub?: Subscription;

  constructor(
    private appService: AppService,
    private deviceService: DeviceDetectorService,
    private sessionStateService: SessionStateService
  ) {

  }

  ngOnInit(): void {
    this.isMobile = this.deviceService.isMobile();
    this.appService.setDevice(this.isMobile);

    this.sessionStateSub = this.sessionStateService.isReadOnly$.subscribe((flag: boolean) => {
      this.readOnly = flag;
    });
  }

  ngOnDestroy(): void {
    this.sessionStateSub?.unsubscribe();
  }
}
