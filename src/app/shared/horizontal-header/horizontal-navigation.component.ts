import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, Output } from '@angular/core';
import {
  NgbAccordionModule,
  NgbCarouselModule,
  NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';

declare var $: any;

interface notifications {
  btn: string;
  icon: string;
  title: string;
  subject: string;
  time: string;
}

interface messages {
  useravatar: string;
  status: string;
  from: string;
  subject: string;
  time: string;
}

@Component({
  selector: 'app-horizontal-navigation',
  standalone: true,
  imports: [
    NgbDropdownModule,
    FeatherModule,
    NgScrollbarModule,
    CommonModule,
    NgbAccordionModule,
    NgbCarouselModule,
  ],
  templateUrl: './horizontal-navigation.component.html',
})
export class HorizontalNavigationComponent implements AfterViewInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  public showSearch = false;

  public isCollapsed = false;
  public showMobileMenu = false;

  notifications: notifications[] = [
    {
      btn: 'btn-danger',
      icon: 'ti-link',
      title: 'Luanch Admin',
      subject: 'Just see the my new admin!',
      time: '9:30 AM',
    },
    {
      btn: 'btn-success',
      icon: 'ti-calendar',
      title: 'Event today',
      subject: 'Just a reminder that you have event',
      time: '9:10 AM',
    },
    {
      btn: 'btn-info',
      icon: 'ti-settings',
      title: 'Settings',
      subject: 'You can customize this template as you want',
      time: '9:08 AM',
    },
    {
      btn: 'btn-primary',
      icon: 'ti-user',
      title: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:00 AM',
    },
  ];

  // This is for Mymessages
  mymessages: messages[] = [
    {
      useravatar: 'assets/images/users/user1.jpg',
      status: 'online',
      from: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:30 AM',
    },
    {
      useravatar: 'assets/images/users/user2.jpg',
      status: 'busy',
      from: 'Sonu Nigam',
      subject: 'I have sung a song! See you at',
      time: '9:10 AM',
    },
    {
      useravatar: 'assets/images/users/user2.jpg',
      status: 'away',
      from: 'Arijit Sinh',
      subject: 'I am a singer!',
      time: '9:08 AM',
    },
    {
      useravatar: 'assets/images/users/user4.jpg',
      status: 'offline',
      from: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:00 AM',
    },
  ];

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: 'us',
  };

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: 'us',
    },
    {
      language: 'French',
      code: 'fr',
      icon: 'fr',
    },
    {
      language: 'Spanish',
      code: 'es',
      icon: 'es',
    },
    {
      language: 'German',
      code: 'de',
      icon: 'de',
    },
  ];

  constructor(
    private modalService: NgbModal,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('en');
  }

  ngAfterViewInit() {}

  changeLanguage(lang: any) {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }
}
