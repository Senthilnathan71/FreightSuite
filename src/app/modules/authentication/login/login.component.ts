import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule,FeatherModule],
  templateUrl: './login.component.html',
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
  passwordView : boolean;
  successMessage: any;
  constructor(
    private appService: AppService,
    private router: Router,
    private authService: authService,
    private appSettingService: AppSettingsService,
    private localStorage: StorageMap,
    private formBuilder: FormBuilder

  ) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
    this.loginform = this.formBuilder.group({
      email: ["", [this.emailValidator]],
      password: ["", Validators.required],
      rememberMe : [false]
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ["", [this.emailValidator]],
    });

    // Auto-fill credentials if saved in localStorage
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');

    if (savedEmail && savedPassword) {
      this.loginform.patchValue({
        email: savedEmail,
        password: savedPassword,
        rememberMe: true
      });
    }
  }

  login() {
    let param = {
      ...this.loginform.value,
      projectType:'freight-forwarding'
    }
    this.isSubmitted = true;

    if (this.loginform.invalid) {
      return;
    }

    this.authService.login(param).subscribe(async (resp: any) => {
      if (!resp.status) {
        this.errorMessage = resp.message || "Login failed"
        return;
      }
      this.isLoading = false;
      let userData = resp.data.user;

      if (this.loginform.get('rememberMe')?.value) {
          localStorage.setItem('rememberedEmail', param.email);
          localStorage.setItem('rememberedPassword', param.password);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }

      if (resp.status) {
        this.router.navigate(['dashboard']);
      }
    })

  }

  sendResetLink() {
    let param = this.forgotPasswordForm.value;
    this.isLoading = true;

    try {
      this.authService.forgotPassword(param).subscribe((resp) => {
        if (resp.status) {
          this.successMessage = resp.message;
          this.isLoading = false;
        } else {
          this.errorMessage = resp.message;
          this.isLoading = false;
        }
      })
    } catch (err) {
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