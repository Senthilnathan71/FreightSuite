import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PasswordValidators } from '../../../core/ValidationFn/password.validators';
import { CustomDatePipe } from '../../../core/pipes/custom-date-format.pipe';
import { PublicResetPasswordService } from './public-reset-password.service';

type ScreenState = 'loading' | 'ready' | 'success' | 'error';
type ErrorCode = 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'UNKNOWN';

interface PasswordRule {
  id: string;
  label: string;
  check: (value: string) => boolean;
}

@Component({
  selector: 'app-public-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomDatePipe],
  templateUrl: './public-reset-password.component.html',
  styles: [`
    :host { display: block; }

    .reset-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(800px 400px at 10% 0%, rgba(12,82,115,.06), transparent 60%),
        radial-gradient(700px 400px at 100% 100%, rgba(27,127,168,.05), transparent 60%),
        #E7E8EA;
    }

    .reset-stage {
      width: min(1020px, calc(100vw - 48px));
      min-height: min(620px, calc(100vh - 96px));
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      background: #fff;
      box-shadow: 0 20px 60px -20px rgba(12,30,60,.18), 0 2px 8px rgba(12,30,60,.04);
      overflow: hidden;
      border-radius: 4px;
    }

    /* ── Left panel ── */
    .reset-left {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #0C5273 0%, #08374F 50%, #1B7FA8 100%);
    }
    .brand-grid-bg {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
      background-size: 64px 64px;
      mask-image: radial-gradient(80% 80% at 50% 50%, #000 40%, transparent 90%);
      -webkit-mask-image: radial-gradient(80% 80% at 50% 50%, #000 40%, transparent 90%);
    }
    .brand-glow {
      position: absolute;
      width: 500px; height: 500px;
      border-radius: 50%;
      filter: blur(60px);
      opacity: .45;
      mix-blend-mode: screen;
    }
    .brand-glow-a { background: #3DA6D9; left: -150px; top: -120px; }
    .brand-glow-b { background: #0EE3C0; right: -150px; bottom: -150px; opacity: .3; }

    /* ── Isometric stage (hero illustration) ── */
    .iso-stage {
      position: absolute;
      inset: 0;
      z-index: 2;
      transform-style: preserve-3d;
      perspective: 1400px;
      pointer-events: none;
    }
    .iso-grid {
      position: absolute;
      inset: -10%;
      background-image:
        linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
      background-size: 48px 48px;
      transform: rotateX(60deg) rotateZ(-30deg) translateZ(-100px);
      mask-image: radial-gradient(60% 60% at 50% 45%, #000 40%, transparent 90%);
      -webkit-mask-image: radial-gradient(60% 60% at 50% 45%, #000 40%, transparent 90%);
      opacity: .9;
    }
    .iso-block {
      position: absolute;
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(255,255,255,.35);
      box-shadow:
        0 18px 36px -12px rgba(4,22,38,.55),
        inset 0 1px 0 rgba(255,255,255,.6);
      transform-style: preserve-3d;
      animation: floatBlock 6s ease-in-out infinite;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }
    .iso-block.accent {
      background: linear-gradient(180deg, #3DA6D9, #1B7FA8);
      border-color: rgba(61,166,217,.6);
      box-shadow:
        0 22px 40px -10px rgba(14,227,192,.35),
        0 12px 24px -8px rgba(12,82,115,.5),
        inset 0 1px 0 rgba(255,255,255,.4);
    }
    .b1 { width: 160px; height: 120px; left: 14%; top: 30%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); }
    .b2 { width: 120px; height: 96px;  left: 34%; top: 24%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); animation-delay: -.8s; }
    .b3 { width: 200px; height: 140px; left: 44%; top: 40%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); animation-delay: -1.6s; }
    .b4 { width: 88px;  height: 72px;  left: 30%; top: 52%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); animation-delay: -2.2s; }
    .b5 { width: 140px; height: 108px; left: 58%; top: 26%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); animation-delay: -3.0s; }
    .b6 { width: 104px; height: 84px;  left: 18%; top: 50%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); animation-delay: -3.6s; }
    .b7 { width: 72px;  height: 60px;  left: 54%; top: 58%;
          transform: rotate(-30deg) skewX(30deg) scale(1, .58); animation-delay: -4.4s; }
    .iso-shadow {
      position: absolute;
      left: 10%; right: 10%; bottom: 22%;
      height: 24px;
      background: radial-gradient(60% 100% at 50% 50%, rgba(2,18,32,.55), transparent 70%);
      filter: blur(8px);
    }
    @keyframes floatBlock {
      0%, 100% { translate: 0 0; }
      50%      { translate: 0 -8px; }
    }

    .left-watermark {
      position: absolute;
      left: 40px; bottom: 40px; right: 40px;
      z-index: 3; color: #fff;
    }
    .wm-eyebrow {
      font-size: 11px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(255,255,255,.7);
      margin-bottom: 16px;
    }
    .wm-title {
      font-size: 36px; line-height: 1.1;
      font-weight: 800; letter-spacing: -.02em;
      margin-bottom: 12px;
    }
    .wm-sub {
      font-size: 14px; line-height: 1.55;
      color: rgba(255,255,255,.7);
      max-width: 320px;
    }

    /* ── Right panel ── */
    .reset-right {
      display: flex;
      flex-direction: column;
      padding: 28px 40px 20px;
      overflow-y: auto;
    }

    .screen-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      animation: fadeUp .42s cubic-bezier(.2,.7,.2,1);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Icon badge ── */
    .icon-badge {
      width: 48px; height: 48px;
      border-radius: 14px;
      display: grid; place-items: center;
      background: linear-gradient(135deg, #E7F1F6 0%, #FFFFFF 100%);
      border: 1px solid rgba(12,82,115,.12);
      color: #0C5273;
      box-shadow: 0 10px 20px -12px rgba(12,82,115,.35), inset 0 1px 0 #fff;
      margin-bottom: 12px;
      position: relative;
    }
    .icon-badge::after {
      content: "";
      position: absolute; inset: -5px;
      border-radius: 19px;
      border: 1px dashed rgba(12,82,115,.18);
      pointer-events: none;
    }
    .icon-badge.error-badge {
      background: linear-gradient(135deg, #FDE8E8 0%, #FFFFFF 100%);
      border-color: rgba(216,85,59,.15);
      color: #D8553B;
    }
    .icon-badge.error-badge::after { border-color: rgba(216,85,59,.18); }
    .icon-badge.warn-badge {
      background: linear-gradient(135deg, #FFF7E8 0%, #FFFFFF 100%);
      border-color: rgba(224,138,42,.15);
      color: #E08A2A;
    }
    .icon-badge.warn-badge::after { border-color: rgba(224,138,42,.18); }
    .icon-badge.success-badge {
      background: linear-gradient(135deg, #E8F7F1 0%, #FFFFFF 100%);
      border-color: rgba(31,163,122,.18);
      color: #1FA37A;
    }
    .icon-badge.success-badge::after { border-color: rgba(31,163,122,.2); }

    /* ── Text ── */
    .screen-title {
      font-size: 22px; line-height: 1.15;
      font-weight: 800; letter-spacing: -.02em;
      color: #1F2933; margin: 0 0 2px;
    }
    .screen-sub {
      font-size: 13px; line-height: 1.55;
      color: #4A5560; margin: 0 0 10px;
      max-width: 44ch;
    }
    .screen-eyebrow {
      display: inline-flex;
      align-items: center; gap: 8px;
      color: #0C5273;
      font-size: 12px; font-weight: 600;
      background: #E7F1F6;
      padding: 5px 10px;
      border-radius: 999px;
      align-self: flex-start;
      margin-bottom: 6px;
    }
    .expiry-pill {
      display: inline-flex;
      align-items: center; gap: 8px;
      padding: 5px 10px;
      background: #FFF7E8;
      color: #8A5A12;
      border: 1px solid #F5E2BD;
      border-radius: 8px;
      font-size: 11.5px; font-weight: 500;
      align-self: flex-start;
      margin-bottom: 10px;
    }
    .expiry-pill strong {
      font-variant-numeric: tabular-nums;
      color: #5A3D0C;
    }

    /* ── Floating label field ── */
    .rp-field {
      position: relative;
      display: grid;
      grid-template-columns: 34px 1fr auto;
      align-items: end;
      padding-top: 12px;
      min-height: 46px;
    }
    .rp-field-icon {
      color: #0C5273;
      grid-column: 1;
      align-self: end;
      padding-bottom: 8px;
      display: flex; align-items: center;
    }
    .rp-field-body {
      grid-column: 2;
      position: relative;
    }
    .rp-field-label {
      position: absolute;
      left: 0; bottom: 8px;
      color: #4A5560;
      font-size: 14.5px; font-weight: 500;
      pointer-events: none;
      transform-origin: left bottom;
      transition: transform .2s ease, color .2s ease;
    }
    .rp-field-label.is-lifted {
      transform: translateY(-20px) scale(.78);
      color: #0C5273;
      font-weight: 600;
    }
    .rp-field-body input {
      width: 100%;
      border: 0; outline: 0;
      background: transparent;
      font-family: inherit;
      font-size: 15px;
      color: #1F2933;
      padding: 5px 0 7px;
      letter-spacing: .01em;
    }
    .rp-field-trailing {
      grid-column: 3;
      align-self: end;
      padding-bottom: 3px;
    }
    .trailing-btn {
      background: transparent; border: 0; cursor: pointer;
      color: #7B8694; padding: 5px;
      border-radius: 5px;
      display: grid; place-items: center;
      transition: color .2s, background .2s;
    }
    .trailing-btn:hover { color: #0C5273; background: #E7F1F6; }
    .rp-field-underline {
      position: absolute;
      left: 34px; right: 0; bottom: 0;
      height: 1.5px;
      background: #E5E7EB;
    }
    .rp-field-underline::after {
      content: "";
      position: absolute; inset: 0;
      background: #0C5273;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform .35s cubic-bezier(.2,.7,.2,1);
    }
    .rp-field.is-focused .rp-field-underline::after { transform: scaleX(1); }
    .rp-field.is-error .rp-field-underline { background: #D8553B; }
    .rp-field.is-error .rp-field-icon { color: #D8553B; }

    /* ── Strength meter ── */
    .strength-bars { display: flex; gap: 4px; }
    .strength-bar {
      flex: 1; height: 4px; border-radius: 2px;
      background: #EEF0F2;
      transition: background .3s ease;
    }
    .strength-meta {
      display: flex; justify-content: space-between;
      font-size: 11.5px; color: #7B8694;
      margin-top: 3px;
    }
    .strength-label { font-weight: 700; }

    /* ── Rules grid ── */
    .rules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 14px;
      list-style: none;
      margin: 0; padding: 0;
    }
    .rule-item {
      display: flex; align-items: center; gap: 7px;
      font-size: 11.5px; color: #7B8694;
      transition: color .25s;
    }
    .rule-item.is-ok { color: #1F2933; }
    .rule-dot {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #EEF0F2;
      color: transparent;
      display: grid; place-items: center;
      transition: all .25s ease;
      flex-shrink: 0;
    }
    .rule-item.is-ok .rule-dot { background: #1FA37A; color: #fff; }

    .inline-error { font-size: 12px; color: #D8553B; margin-top: -2px; }
    .submit-error { font-size: 12.5px; color: #D8553B; margin-top: 6px; text-align: center; }

    /* ── Buttons ── */
    .rp-btn-primary {
      appearance: none; border: 0;
      border-radius: 8px;
      padding: 11px 18px;
      font-family: inherit;
      font-weight: 700; font-size: 13.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center; justify-content: center;
      gap: 9px;
      background: #0C5273;
      color: #fff;
      box-shadow: 0 8px 20px -10px rgba(12,82,115,.6), inset 0 -1px 0 rgba(0,0,0,.15);
      transition: all .2s ease;
      width: 100%;
    }
    .rp-btn-primary:hover:not(:disabled) {
      background: #0a4663;
      transform: translateY(-1px);
      box-shadow: 0 12px 24px -12px rgba(12,82,115,.7), inset 0 -1px 0 rgba(0,0,0,.15);
    }
    .rp-btn-primary:active:not(:disabled) { transform: translateY(0); }
    .rp-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

    .link-quiet {
      background: transparent; border: 0;
      color: #4A5560;
      font-family: inherit;
      font-size: 13px; font-weight: 600;
      text-decoration: none; cursor: pointer;
      padding: 5px 8px;
      border-radius: 6px;
      transition: color .2s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .link-quiet:hover { color: #0C5273; }

    /* ── Success animation ── */
    .dm-ring {
      fill: none; stroke: #0C5273;
      stroke-width: 2;
      stroke-dasharray: 226;
      stroke-dashoffset: 226;
      animation: drawRing .8s cubic-bezier(.2,.8,.2,1) forwards;
      transform-origin: center;
      transform: rotate(-90deg);
    }
    .dm-tick {
      fill: none; stroke: #0C5273;
      stroke-width: 4;
      stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 60;
      stroke-dashoffset: 60;
      animation: drawTick .4s .6s cubic-bezier(.2,.8,.2,1) forwards;
    }
    @keyframes drawRing { to { stroke-dashoffset: 0; } }
    @keyframes drawTick { to { stroke-dashoffset: 0; } }

    .security-tip {
      display: inline-flex;
      align-items: center; gap: 8px;
      background: #E7F1F6;
      color: #0C5273;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 12px; font-weight: 600;
      margin: 2px 0 10px;
    }
    .security-tip span { color: #4A5560; font-weight: 500; }

    .reset-foot {
      font-size: 11.5px; color: #7B8694;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #EEF0F2;
    }

    /* ── Loading ── */
    .loading-spinner {
      width: 40px; height: 40px;
      border: 3px solid #E7F1F6;
      border-top-color: #0C5273;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Responsive ── */
    @media (max-width: 920px) {
      .reset-stage {
        width: 100%;
        grid-template-columns: 1fr;
        min-height: auto;
      }
      .reset-left { display: none; }
      .reset-right { padding: 28px 20px 20px; }
      .screen-title { font-size: 22px; }
      .rules-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PublicResetPasswordComponent implements OnInit, OnDestroy {
  state: ScreenState = 'loading';
  errorCode: ErrorCode = 'UNKNOWN';

  maskedEmail = '';
  expiresAt: Date | null = null;

  showPassword = false;
  showConfirmPassword = false;
  passwordFocused = false;
  confirmFocused = false;

  isSubmitting = false;
  submitError: string | null = null;

  expiryCountdown = '';
  readonly currentYear = new Date().getFullYear();

  form = new FormGroup({
    password: new FormControl('', [Validators.required, PasswordValidators.validate()]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  readonly passwordRules: PasswordRule[] = [
    { id: 'len', label: 'At least 4 characters', check: (v) => v.length >= 4 },
    { id: 'letter', label: 'Contains a letter (a-z / A-Z)', check: (v) => /[a-zA-Z]/.test(v) },
    { id: 'number', label: 'Contains a number (0-9)', check: (v) => /\d/.test(v) },
    { id: 'special', label: 'A special character (!@#$%^&*)', check: (v) => /[!@#$%^&*]/.test(v) },
  ];

  private token = '';
  private expiryInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private service: PublicResetPasswordService,
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('token') ?? '';
    this.token = this.sanitizeToken(raw);
    if (!this.token) {
      this.state = 'error';
      this.errorCode = 'NOT_FOUND';
      return;
    }
    this.load();
  }

  ngOnDestroy(): void {
    if (this.expiryInterval) clearInterval(this.expiryInterval);
  }

  private sanitizeToken(value: string): string {
    const sanitized = value.replace(/[^A-Za-z0-9_\-]/g, '');
    return sanitized.length === value.length ? sanitized : '';
  }

  private load(): void {
    this.service.validateToken(this.token).subscribe({
      next: (resp) => {
        if (!resp.status) {
          this.state = 'error';
          this.errorCode = this.mapErrorCode(resp.message);
          return;
        }
        if (resp.data?.email) {
          this.maskedEmail = this.maskEmail(resp.data.email);
        }
        if (resp.data?.expiresAt) {
          this.expiresAt = new Date(resp.data.expiresAt);
          this.startExpiryCountdown();
        }
        this.state = 'ready';
      },
      error: () => {
        this.state = 'error';
        this.errorCode = 'UNKNOWN';
      },
    });
  }

  private startExpiryCountdown(): void {
    this.updateCountdown();
    this.expiryInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown(): void {
    if (!this.expiresAt) return;
    const diff = Math.max(0, this.expiresAt.getTime() - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    this.expiryCountdown = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (diff <= 0) {
      if (this.expiryInterval) clearInterval(this.expiryInterval);
      this.state = 'error';
      this.errorCode = 'EXPIRED';
    }
  }

  get passwordValue(): string {
    return this.form.value.password || '';
  }

  get strengthLevel(): number {
    const pw = this.passwordValue;
    if (!pw) return 0;
    const passed = this.passwordRules.filter(r => r.check(pw)).length;
    if (passed <= 1) return 1;
    if (passed === 2) return 2;
    if (passed === 3) return 3;
    return 4;
  }

  get strengthLabel(): string {
    const labels = ['', 'Weak', 'Fair', 'Strong', 'Excellent'];
    return labels[this.strengthLevel];
  }

  get strengthLabelColor(): string {
    const colors = ['#7B8694', '#D8553B', '#E08A2A', '#2A8868', '#1FA37A'];
    return colors[this.strengthLevel];
  }

  get passedCount(): number {
    return this.passwordRules.filter(r => r.check(this.passwordValue)).length;
  }

  getBarColor(barIndex: number): string {
    if (barIndex > this.strengthLevel) return '#EEF0F2';
    switch (this.strengthLevel) {
      case 1: return '#D8553B';
      case 2: return '#E08A2A';
      case 3: return '#3CB088';
      case 4: return '#1FA37A';
      default: return '#EEF0F2';
    }
  }

  ruleOk(rule: PasswordRule): boolean {
    return rule.check(this.passwordValue);
  }

  get passwordsMatch(): boolean {
    return this.form.value.password === this.form.value.confirmPassword;
  }

  get canSubmit(): boolean {
    return this.form.valid && this.passwordsMatch && !this.isSubmitting;
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.submitError = null;

    this.service
      .resetPassword(this.token, {
        password: this.form.value.password!,
        confirmPassword: this.form.value.confirmPassword!,
      })
      .subscribe({
        next: (resp) => {
          this.isSubmitting = false;
          if (!resp.status) {
            const code = this.mapErrorCode(resp.message);
            if (code === 'ALREADY_USED' || code === 'EXPIRED') {
              this.state = 'error';
              this.errorCode = code;
              return;
            }
            this.submitError = resp.message || 'Unable to reset password. Please try again.';
            return;
          }
          if (this.expiryInterval) clearInterval(this.expiryInterval);
          this.state = 'success';
        },
        error: () => {
          this.isSubmitting = false;
          this.submitError = 'Unable to reset password. Please try again.';
        },
      });
  }

  private mapErrorCode(message: string): ErrorCode {
    if (message === 'NOT_FOUND') return 'NOT_FOUND';
    if (message === 'EXPIRED') return 'EXPIRED';
    if (message === 'ALREADY_USED') return 'ALREADY_USED';
    return 'UNKNOWN';
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.length <= 2 ? local : local[0] + '***' + local[local.length - 1];
    return `${visible}@${domain}`;
  }
}
