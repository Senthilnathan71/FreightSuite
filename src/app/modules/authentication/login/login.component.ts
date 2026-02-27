import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StorageMap } from '@ngx-pwa/local-storage';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AppService } from 'src/app/service/app.service';
import { authService } from '../auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import * as $ from 'jquery';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MasterService } from '../../master/master.service';
import { toNumber } from 'src/app/common/helper';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, NgxSpinnerModule, ReactiveFormsModule, FeatherModule, DatePipe],
  templateUrl: './login.component.html',
  styles: [`
    .session-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .session-dialog {
      max-width: 420px;
      width: 90%;
      border-radius: 12px;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginform!: FormGroup;
  forgotPasswordForm!: FormGroup;
  recoverform = false;
  isMobile: boolean = false;
  errorMessage = "";
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  token: any
  passwordView: boolean;
  successMessage: any;
  financialYears: any[] = [];
  activeSessionInfo: any = null;
  private pendingLoginParams: any = null;
  private unsubscribe$ = new Subject<void>();
  constructor(
    private appService: AppService,
    private router: Router,
    private authService: authService,
    private masterService : MasterService,
    private appSettingService: AppSettingsService,
    private localStorage: StorageMap,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService  // Add this

  ) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
    this.loginform = this.formBuilder.group({
      email: ["", [this.emailValidator]],
      password: ["", Validators.required],
      yearMasterSid: ["", Validators.required],
      rememberMe: [false]
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ["", [this.emailValidator]],
    });

    this.onEmailChange();

    // Auto-fill credentials if saved in localStorage
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const decryptedPass = this.appSettingService.decrypt(savedPassword);

    if (savedEmail && decryptedPass) {
      this.loginform.patchValue({
        email: savedEmail,
        password: decryptedPass,
        rememberMe: true
      },{ emitEvent: false });

      if (this.loginform.get('email')?.valid) {
        this.getFinancialYears(savedEmail);
      }
    }
  }


  onEmailChange(): void {
    this.loginform.get('email')?.valueChanges.pipe(
      debounceTime(500), // Wait for 500ms pause in events
      distinctUntilChanged(), // Only emit if value is different from last
      takeUntil(this.unsubscribe$) // Unsubscribe on component destruction
    ).subscribe(email => {
      if (this.loginform.get('email')?.valid) {
        this.getFinancialYears(email);
      } else {
        this.financialYears = []; // Clear dropdown if email is invalid
        this.loginform.get('yearMasterSid')?.reset("");
      }
    });
  }

  getFinancialYears(email: string): void {
    this.masterService.getYearMasterByUserId(email).subscribe((resp: any) => {
      if (resp.status && resp.data) {
        this.financialYears = resp.data;
        // if there's only one financial year, pre-select it.
        if (this.financialYears.length === 1) {
            this.loginform.get('yearMasterSid')?.setValue(this.financialYears[0].YearMasterSid);
        }
        const storedYearId = localStorage.getItem('current-year-id');
        const storedIdExistInResponse = this.financialYears.find(fy => fy.YearMasterSid === +storedYearId);
        if (storedYearId && storedIdExistInResponse) {
          this.loginform.get('yearMasterSid')?.setValue(storedYearId);
        } else {
          const currentYear = this.financialYears.find(fy => fy.CurrentYear === 'Y');
          if (currentYear) {
            this.loginform.get('yearMasterSid')?.setValue(currentYear.YearMasterSid);
          }
        }
      } else {
        this.financialYears = [];
        this.loginform.get('yearMasterSid')?.reset("");
      }
    }, (error) => {
      console.error("Error fetching financial years:", error);
      this.financialYears = [];
      this.loginform.get('yearMasterSid')?.reset("");
      this.appSettingService.showError('An error occurred while fetching financial years.');
    });
  }

  login() {
    if (this.loginform.invalid) {
      return;
    }

    this.isSubmitted = true;
    this.isLoading = true;
    this.spinner.show()

    // Get browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          this.getLocationDetails(lat, lon).then((locationString) => {
            this.doLogin(locationString, lat, lon);
          }).catch(() => {
            // fallback if reverse geocoding fails
            this.doLogin(`${lat}, ${lon}`, lat, lon);
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          // fallback if geolocation denied
          this.doLogin('Unknown location', null, null);
        }
      );
    } else {
      // fallback if browser doesn't support
      this.doLogin('Unknown location', null, null);
    }
  }


  doLogin(location?: string, lat?: number | null, lon?: number | null) {
    const param = {
      ...this.loginform.value,
      projectType: 'freight-forwarding',
      location,
      latitude: lat,
      longitude: lon
    };

    this.authService.login(param).subscribe((resp: any) => {
      this.isLoading = false;

      // Handle session-active-elsewhere
      if (!resp.status && resp.message === 'SESSION_ACTIVE_ELSEWHERE') {
        this.spinner.hide();
        this.activeSessionInfo = resp.data?.activeSessionInfo;
        this.pendingLoginParams = { ...param, forceLogin: true };
        return;
      }

      if (!resp.status) {
        this.spinner.hide();
        this.errorMessage = resp.message || "Login failed";
        this.appSettingService.showError(this.errorMessage)
        return;
      }

      this.handleLoginSuccess(param);
    },(error) => {
      this.spinner.hide();
      this.isLoading = false;
      this.appSettingService.showError('An error occurred during login');
    });
   }

  forceLogin() {
    if (!this.pendingLoginParams) return;

    this.activeSessionInfo = null;
    this.isLoading = true;
    this.spinner.show();

    this.authService.login(this.pendingLoginParams).subscribe((resp: any) => {
      this.isLoading = false;

      if (!resp.status) {
        this.spinner.hide();
        this.pendingLoginParams = null;
        this.errorMessage = resp.message || "Force login failed";
        this.appSettingService.showError(this.errorMessage);
        return;
      }

      const params = this.pendingLoginParams;
      this.pendingLoginParams = null;
      this.handleLoginSuccess(params);
    }, (error) => {
      this.spinner.hide();
      this.isLoading = false;
      this.pendingLoginParams = null;
      this.appSettingService.showError('An error occurred during force login');
    });
  }

  cancelForceLogin() {
    this.activeSessionInfo = null;
    this.pendingLoginParams = null;
  }

  private handleLoginSuccess(param: any) {
    const selectedYearId = this.loginform.get('yearMasterSid')?.value;
    const selectedYr = this.financialYears.find(fy => fy.YearMasterSid === toNumber(selectedYearId));
    localStorage.setItem('current-year-id', selectedYearId)
    const encryptedYearObj = this.appSettingService.encrypt(selectedYr);
    if (encryptedYearObj) {
      localStorage.setItem('current-financial-year', encryptedYearObj);
    }

    if (this.loginform.get('rememberMe')?.value) {
      localStorage.setItem('rememberedEmail', param.email);
      const encryptedPass = this.appSettingService.encrypt(param.password);
      localStorage.setItem('rememberedPassword', encryptedPass);
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }

    this.router.navigate(['dashboard']).then(() => {
      this.spinner.hide();
    });
  }





  async getLocationDetails(lat: number, lon: number): Promise<string> {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    console.log(data, 'getLocationDetails')
    return data.display_name || `${lat}, ${lon}`;
  }








  // login() {
  //   let param = {
  //     ...this.loginform.value,
  //     projectType:'freight-forwarding'
  //   }
  //   this.isSubmitted = true;

  //   if (this.loginform.invalid) {
  //     return;
  //   }

  //   this.authService.login(param).subscribe(async (resp: any) => {
  //     if (!resp.status) {
  //       this.errorMessage = resp.message || "Login failed"
  //       return;
  //     }
  //     this.isLoading = false;
  //     let userData = resp.data.user;

  //     if (this.loginform.get('rememberMe')?.value) {
  //         localStorage.setItem('rememberedEmail', param.email);
  //         localStorage.setItem('rememberedPassword', param.password);
  //       } else {
  //         localStorage.removeItem('rememberedEmail');
  //         localStorage.removeItem('rememberedPassword');
  //       }

  //     if (resp.status) {
  //       this.router.navigate(['dashboard']);
  //     }
  //   })

  // }

  sendResetLink() {
    let param = this.forgotPasswordForm.value;
    this.isLoading = true;
    // this.spinner.show(); // Show spinner

    try {
      this.authService.forgotPassword(param).subscribe((resp) => {
         if (resp.status) {
          this.successMessage = resp.message;
          this.appSettingService.showSuccess('Email Sent Successfully');
          this.router.navigate(['auth/login']);
          this.isLoading = false;
        } else {
          this.errorMessage = resp.message;
          this.appSettingService.showError('Email Sent Failed');
          this.isLoading = false;
        }
      })
    } catch (err) {
      // this.spinner.hide(); // Hide spinner
      this.errorMessage = "Something went wrong while processing your request. Please try again"
    }
  }



  showRecoverForm() {
    // this.loginform = !this.loginform;
    this.recoverform = !this.recoverform;
  }


  emailValidator(field: FormControl) {
    let email = field.value.trim();
    email = email.replace(/\s/g, '');
    if (email !== field.value) {
      field.patchValue(email)
    }

    if ($.trim(email) == "") {
      return { required: true }
    } else if (email.indexOf("fb_") !== -1) {
      return null
    } else if (regexPatterns.email.test(email)) {
      return null
    }

    return { pattern: true }
  }

  togglePassword(input: HTMLInputElement): void {
    this.passwordView = true;
    input.type = 'text'; // Show password on mousedown
  }

  resetPassword(input: HTMLInputElement): void {
    this.passwordView = false;
    input.type = 'password'; // Hide password on mouseup or mouseleave
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

var regexPatterns = {
  nameString: /^[A-Za-z]+$/,  // Allows only alphabets (both uppercase and lowercase)
  // Corrected Email regex pattern

  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Explanation:
  // ^[a-zA-Z0-9._%+-]+ -> matches the username (local part of email)
  // @ -> the @ symbol
  // [a-zA-Z0-9.-]+ -> matches the domain part (before the dot)
  // \.[a-zA-Z]{2,}$ -> matches the dot and domain extension (e.g., .com, .org)

  // Numbers only pattern (only digits)
  numbersOnly: /^\d+$/,  // Matches one or more digits (no decimal)

  // Password regex pattern (ensures at least 8 characters, 1 uppercase, 1 lowercase, 1 digit, and 1 special character)
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{8,}$/,
  // Explanation:
  // (?=.*[a-z]) -> at least one lowercase letter
  // (?=.*[A-Z]) -> at least one uppercase letter
  // (?=.*\d) -> at least one digit
  // (?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]) -> at least one special character
  // .{8,} -> ensures a minimum of 8 characters
}
export { regexPatterns }