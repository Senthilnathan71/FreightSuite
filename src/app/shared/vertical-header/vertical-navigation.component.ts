import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, Output, ViewChild, TemplateRef, NgModule } from '@angular/core';
import { NgbAccordionModule, NgbCarouselModule, NgbDropdownModule,  NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { ShortcutComponent } from 'src/app/modules/shortcut/shortcut.component';
import { Router, RouterModule } from '@angular/router';

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
  selector: 'app-vertical-navigation',
  standalone: true,
  imports: [NgbDropdownModule,RouterModule, FeatherModule, NgScrollbarModule, CommonModule, NgbAccordionModule, NgbCarouselModule,NgbModule],
  templateUrl: './vertical-navigation.component.html'
})
export class VerticalNavigationComponent implements AfterViewInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  public showSearch = false;



  constructor(private router: Router, private appSettingsService: AppSettingsService, private translate: TranslateService) {

    // translate.setDefaultLang('en');

  }

  // This is for Notifications
  notifications: notifications[] = [
    {
      btn: 'btn-danger',
      icon: 'ti-link',
      title: 'Luanch Admin',
      subject: 'Just see the my new admin!',
      time: '9:30 AM'
    },
    {
      btn: 'btn-success',
      icon: 'ti-calendar',
      title: 'Event today',
      subject: 'Just a reminder that you have event',
      time: '9:10 AM'
    },
    {
      btn: 'btn-info',
      icon: 'ti-settings',
      title: 'Settings',
      subject: 'You can customize this template as you want',
      time: '9:08 AM'
    },
    {
      btn: 'btn-warning',
      icon: 'ti-user',
      title: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:00 AM'
    }
  ];

  // This is for Mymessages
  mymessages: messages[] = [
    {
      useravatar: 'assets/images/users/user1.jpg',
      status: 'online',
      from: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:30 AM'
    },
    {
      useravatar: 'assets/images/users/user2.jpg',
      status: 'busy',
      from: 'Sonu Nigam',
      subject: 'I have sung a song! See you at',
      time: '9:10 AM'
    },
    {
      useravatar: 'assets/images/users/user2.jpg',
      status: 'away',
      from: 'Arijit Sinh',
      subject: 'I am a singer!',
      time: '9:08 AM'
    },
    {
      useravatar: 'assets/images/users/user4.jpg',
      status: 'offline',
      from: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:00 AM'
    }
  ];

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: 'us'
  }

  public languages: any[] = [{
    language: 'English',
    code: 'en',
    type: 'US',
    icon: 'us'
  },
  {
    language: 'Español',
    code: 'es',
    icon: 'es'
  },
  {
    language: 'Français',
    code: 'fr',
    icon: 'fr'
  },
  {
    language: 'German',
    code: 'de',
    icon: 'de'
  }]

  homeActivityItems = [
    {
      title: 'Visited Dashboard',
      subject: 'Checked the performance overview.',
      time: 'Just now',
      icon: 'fas fa-chart-pie',
      btn: 'btn-primary'
    },
    {
      title: 'Updated Profile',
      subject: 'Changed profile picture.',
      time: '10 mins ago',
      icon: 'fas fa-user',
      btn: 'btn-warning'
    },
    {
      title: 'Logged Out',
      subject: 'You logged out from this device.',
      time: '1 hour ago',
      icon: 'fas fa-sign-out-alt',
      btn: 'btn-danger'
    }
  ];
 favoriteItems = [
  {
    btn: 'btn-danger',                  // Red circle button
    icon: 'fas fa-heart',              // Heart icon
    title: 'New Like',
    subject: 'John liked your post',
    time: '2 mins ago'
  },
  {
    btn: 'btn-primary',                // Blue circle button
    icon: 'fas fa-star',               // Star icon
    title: 'Top Rated',
    subject: 'Your item was featured',
    time: '10 mins ago'
  },
  {
    btn: 'btn-warning',                // Yellow circle button
    icon: 'fas fa-gift',               // Gift icon
    title: 'Gift Received',
    subject: 'Anna sent you a gift',
    time: '1 hour ago'
  }
];


  ngAfterViewInit() { 
       
  }

  logout() {
    this.appSettingsService.sessionExpire().then(() => {
      location.href = location.protocol + '//' + location.host + '/auth'
    })
  }

  changeLanguage(lang: any) {
    this.translate.use(lang.code)
    this.selectedLanguage = lang;
  }

 navigateShortcut(){
    this.router.navigate(['shortcut']);
 }
  
 
}
