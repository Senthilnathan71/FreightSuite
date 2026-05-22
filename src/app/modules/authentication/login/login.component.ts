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
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, NgxSpinnerModule, ReactiveFormsModule, FeatherModule, DatePipe, NgSelectModule],
  templateUrl: './login.component.html',
  styles: [`
    :host {
      display: block;
    }

    .blufin-login-shell {
      min-height: 100vh;
      width: 100%;
      padding: 0;
      background: #cfd0d6;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .login-stage {
      width: min(960px, calc(100vw - 40px));
      height: min(500px, calc(100vh - 96px));
      min-height: 455px;
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.95fr);
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 18px 50px rgba(15, 39, 71, 0.08);
    }

    .login-visual {
      min-height: 100%;
      background: #eef3f7;
      overflow: hidden;
    }

    .login-visual img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      object-position: center;
    }

    .blufin-login-shell .login-panel {
      width: 100%;
      min-width: 0;
      max-width: none;
      padding: 0;
      border: 0;
      box-shadow: none;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-panel-content {
      width: min(285px, calc(100% - 32px));
      margin: 0 auto;
    }

    .brand-lockup {
      margin-bottom: 26px;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 70px;
      height: 70px;
      margin-bottom: 2px;
    }

    .brand-mark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .brand-lockup h1 {
      margin: 0;
      color: #25272b;
      font-size: 24px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: 0;
    }

    .brand-lockup p {
      margin: 14px 0 0;
      color: #767a81;
      font-size: 15px;
      line-height: 1.45;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .login-field {
      position: relative;
      margin: 0;
    }

    .login-icon-field .form-control,
    .login-icon-field .ng-select-container {
      height: 42px;
      min-height: 42px;
      border-radius: 0;
      border-top: 0;
      border-left: 0;
      border-right: 0;
      border-bottom: 1px solid #d3d9e4;
      background: #ffffff;
      color: #111827;
      box-shadow: none;
      font-size: 14px;
      font-weight: 600;
    }

    .login-icon-field .form-control {
      padding: 13px 38px 3px 38px;
    }

    .login-field-icon {
      position: absolute;
      left: 0;
      top: 19px;
      transform: translateY(-50%);
      width: 28px;
      color: #6e737b;
      font-size: 18px;
      line-height: 1;
      text-align: center;
      z-index: 2;
    }

    .login-password-field .form-control {
      padding-right: 42px;
    }

    .password-toggle {
      position: absolute;
      right: 0;
      top: 19px;
      transform: translateY(-50%);
      width: 32px;
      color: #6e737b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .login-field .input-label {
      position: absolute;
      left: 38px;
      top: 50%;
      transform: translateY(-50%);
      color: #05608d;
      background: #ffffff;
      padding: 0 3px;
      font-size: 13px;
      font-weight: 600;
      pointer-events: none;
      transition: 0.2s ease;
      z-index: 3;
    }

    .login-field:focus-within .input-label,
    .login-field .form-control:not(:placeholder-shown) + .input-label,
    .login-field.filled .input-label {
      top: 0;
      left: 34px;
      transform: none;
      font-size: 12px;
    }

    .login-year-select {
      position: relative;
      z-index: 1;
      min-width: 0;
      height: 42px;
      font-size: 14px;
    }

    .login-year-field .login-field-icon,
    .login-year-field .input-label {
      z-index: 6;
    }

    :host ::ng-deep .login-year-select.ng-select-single .ng-select-container {
      position: relative;
      z-index: 1;
      height: 42px;
      min-height: 42px;
      border-radius: 0;
      border-top: 0;
      border-left: 0;
      border-right: 0;
      border-bottom: 1px solid #d3d9e4;
      background: #ffffff;
      box-shadow: none;
    }

    :host ::ng-deep .login-year-select.ng-select-opened > .ng-select-container {
      z-index: 1;
    }

    :host ::ng-deep .login-year-select .ng-select-container .ng-value-container {
      padding: 13px 34px 3px 38px;
    }

    :host ::ng-deep .login-year-select .ng-select-container .ng-value-container .ng-placeholder,
    :host ::ng-deep .login-year-select .ng-select-container .ng-value-container .ng-value {
      color: #111827;
      font-size: 14px;
      font-weight: 600;
    }

    :host ::ng-deep .login-year-select .ng-arrow-wrapper {
      padding-right: 0;
    }

    :host ::ng-deep .login-year-select.ng-select-focused:not(.ng-select-opened) > .ng-select-container {
      border: 0;
      box-shadow: none;
    }

    ::ng-deep .login-year-dropdown-panel {
      width: 330px;
      max-width: calc(100vw - 24px);
      margin-left: -88px;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    ::ng-deep .login-year-dropdown-panel .ng-dropdown-panel-items,
    ::ng-deep .login-year-dropdown-panel .scroll-host {
      max-height: 156px;
      overflow-x: hidden;
    }

    ::ng-deep .login-year-dropdown-panel .ng-option {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .login-icon-field .form-control:focus,
    :host ::ng-deep .login-year-select.ng-select-focused > .ng-select-container {
      border-bottom-color: #05608d;
      box-shadow: 0 2px 0 rgba(5, 96, 141, 0.18);
      background: #ffffff;
    }

    .login-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 2px 0 8px;
      color: #6f747a;
      font-size: 14px;
      line-height: 1.2;
    }

    .login-options .form-check {
      min-height: 18px;
      margin: 0;
      padding-left: 0;
      gap: 9px;
    }

    .login-options .form-check-input {
      width: 18px;
      height: 18px;
      margin: 0;
      border: 1.5px solid #8d96a3;
      background-color: #ffffff;
      box-shadow: inset 0 1px 2px rgba(20, 26, 34, 0.08);
    }

    .login-options .form-check-input:checked {
      background-color: #155ea2;
      border-color: #155ea2;
      box-shadow: none;
    }

    .login-options .form-check-input:focus {
      border-color: #155ea2;
      box-shadow: 0 0 0 3px rgba(21, 94, 162, 0.16);
    }

    .login-options .form-check-label {
      color: #6b7077;
      font-size: 14px;
    }

    .login-options a,
    .create-account a {
      color: #53575d;
      text-decoration: none;
      font-weight: 500;
      white-space: nowrap;
    }

    .login-options a:hover,
    .create-account a:hover {
      color: #155ea2;
    }

    .login-button {
      height: 42px;
      border: 0;
      border-radius: 5px;
      background: linear-gradient(180deg, #1f67ad 0%, #15539a 100%);
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
      box-shadow: 0 4px 8px rgba(17, 78, 142, 0.28);
    }

    .login-button:hover,
    .login-button:focus {
      color: #ffffff;
      background: linear-gradient(180deg, #236fb8 0%, #155ca8 100%);
    }

    .login-button:disabled {
      opacity: 0.65;
      box-shadow: none;
      cursor: not-allowed;
    }

    .create-account {
      margin-top: 20px;
      text-align: center;
      color: #777a80;
      font-size: 15px;
    }

    .recover-panel .brand-lockup {
      margin-bottom: 26px;
    }

    .recover-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .recover-actions-stack {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .back-button {
      height: 42px;
      border: 0;
      border-radius: 5px;
      background: #eef1f5;
      color: #59606a;
      font-size: 14px;
      font-weight: 700;
    }

    /* Check inbox screen */
    .recover-icon-badge {
      width: 52px; height: 52px;
      border-radius: 14px;
      display: grid; place-items: center;
      background: linear-gradient(135deg, #E8F7F1 0%, #FFFFFF 100%);
      border: 1px solid rgba(31,163,122,.18);
      color: #1FA37A;
      box-shadow: 0 8px 16px -10px rgba(31,163,122,.35), inset 0 1px 0 #fff;
      margin-bottom: 14px;
      position: relative;
    }
    .recover-icon-badge::after {
      content: "";
      position: absolute; inset: -5px;
      border-radius: 19px;
      border: 1px dashed rgba(31,163,122,.2);
      pointer-events: none;
    }
    .resend-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; color: #4a5560;
      margin: 8px 0 4px;
    }
    .resend-timer { color: #7b8694; }
    .resend-timer strong { color: #0C5273; font-variant-numeric: tabular-nums; }
    .resend-btn {
      background: none; border: none; cursor: pointer;
      color: #0C5273; font-weight: 700; font-size: 12.5px;
      padding: 0; font-family: inherit;
    }
    .resend-btn:hover { text-decoration: underline; }
    .resend-btn:disabled { opacity: .5; cursor: not-allowed; text-decoration: none; }
    .recover-title {
      font-size: 20px; font-weight: 800; color: #1f2933;
      letter-spacing: -.01em; margin: 0 0 4px;
    }
    .recover-sub {
      font-size: 13.5px; color: #4a5560; line-height: 1.5;
      margin: 0 0 6px;
    }

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

    @media (max-width: 900px) {
      .blufin-login-shell {
        min-height: 100svh;
        overflow: auto;
      }

      .login-stage {
        width: 100%;
        height: auto;
        min-height: 100svh;
        grid-template-columns: 1fr;
        grid-template-rows: minmax(230px, 42vh) auto;
        box-shadow: none;
      }

      .login-panel {
        padding: 32px 0 42px;
      }

      .brand-lockup {
        margin-bottom: 26px;
      }

      .brand-mark {
        width: 70px;
        height: 70px;
      }

      .brand-lockup h1 {
        font-size: 24px;
      }
    }

    @media (max-width: 480px) {
      .login-stage {
        grid-template-rows: minmax(190px, 34vh) auto;
      }

      .login-panel-content {
        width: min(330px, calc(100% - 32px));
      }

      .login-options {
        align-items: flex-start;
        font-size: 13px;
      }

      .login-options .form-check-label {
        font-size: 13px;
      }

      .create-account {
        font-size: 15px;
      }

      .recover-actions {
        grid-template-columns: 1fr;
      }
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
  resetLinkSent = false;
  resendCountdown = 0;
  private pendingLoginParams: any = null;
  private resendInterval: ReturnType<typeof setInterval> | null = null;
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
    const decryptedPass = savedPassword ? this.appSettingService.decrypt(savedPassword) : null;

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
        const defaultYear = this.financialYears.find((fy: any) =>
          String(fy.YearName).replace(/\s+/g, '').toUpperCase() === 'FY2026'
        );
        const currentYear = this.financialYears.find((fy: any) => fy.CurrentYear === 'Y');
        const selectedYear = defaultYear || currentYear || this.financialYears[0];

        if (selectedYear) {
          this.loginform.get('yearMasterSid')?.setValue(selectedYear.YearMasterSid);
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

  private getDashboardLandingRoute(): string {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    const salespersonFlag = String(userProfile?.isSalesperson || '').toUpperCase();

    // Sales manager gets their own dashboard (check before salesperson — manager may also have isSalesperson flag)
    if (userProfile?.userType?.code === 'salesManager') {
      return '/dashboard/sales-manager';
    }

    if (salespersonFlag === '1' || salespersonFlag === 'Y') {
      return '/dashboard/sales';
    }

    return '/dashboard';
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

    this.router.navigateByUrl(this.getDashboardLandingRoute()).then(() => {
      this.spinner.hide();
    });
  }





  async getLocationDetails(lat: number, lon: number): Promise<string> {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    console.log(data, 'getLocationDetails')
    return data.display_name || `${lat}, ${lon}`;
  }




  sendResetLink() {
    if (this.isLoading) return;
    let param = this.forgotPasswordForm.value;
    this.isLoading = true;

    this.authService.forgotPassword(param).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.status) {
          this.appSettingService.showSuccess('Reset link sent successfully');
          this.resetLinkSent = true;
          this.startResendTimer();
        } else {
          this.appSettingService.showError(resp.message || 'Failed to send reset link');
        }
      },
      error: () => {
        this.isLoading = false;
        this.appSettingService.showError('Something went wrong. Please try again.');
      },
    });
  }

  private startResendTimer(): void {
    this.resendCountdown = 30;
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0 && this.resendInterval) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  resendLink(): void {
    if (this.resendCountdown > 0) return;
    this.sendResetLink();
  }

  getMaskedForgotEmail(): string {
    const email = this.forgotPasswordForm.value.email || '';
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const local = parts[0];
    const domain = parts[1];
    const visible = local.length <= 2 ? local : local[0] + '***' + local[local.length - 1];
    return `${visible}@${domain}`;
  }

  backToEmailForm(): void {
    this.resetLinkSent = false;
    this.resendCountdown = 0;
    if (this.resendInterval) clearInterval(this.resendInterval);
  }



  showRecoverForm() {
    this.recoverform = !this.recoverform;
    if (this.recoverform) {
      this.resetLinkSent = false;
      this.resendCountdown = 0;
      if (this.resendInterval) clearInterval(this.resendInterval);
    }
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
    if (this.resendInterval) clearInterval(this.resendInterval);
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
