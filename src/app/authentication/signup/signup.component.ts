import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ CommonModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit {
  isMobile: boolean = false;

  constructor(private appService:AppService) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
  }

}
