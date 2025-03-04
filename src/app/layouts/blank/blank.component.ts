import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-blank-layout',
  standalone: true,
  imports:[RouterModule],
  templateUrl: './blank.component.html',
  styleUrls: []
})
export class BlankComponent implements OnInit {

  isMobile: boolean = false;
  
  constructor(private appService:AppService) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }
}
