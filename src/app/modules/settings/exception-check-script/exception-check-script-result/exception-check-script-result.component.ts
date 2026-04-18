import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExceptionCheckScriptService } from '../exception-check-script.service';
import { ExecutionResult } from '../exception-check-script.model';

@Component({
  selector: 'app-exception-check-script-result',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './exception-check-script-result.component.html',
})
export class ExceptionCheckScriptResultComponent implements OnInit {
  loading = true;
  error: string | null = null;
  result: ExecutionResult | null = null;
  private userData: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { scriptSid: number; scriptName: string },
    private dialogRef: MatDialogRef<ExceptionCheckScriptResultComponent>,
    private svc: ExceptionCheckScriptService,
    private appSettings: AppSettingsService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.userData = this.appSettings.decrypt(localStorage.getItem('userData')) || {};
    this.run();
  }

  private run(): void {
    const user = this.userData?.login || 'system';
    this.loading = true;
    this.svc.execute$(this.data.scriptSid, user).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.status === false) { this.error = res.message || 'Execution failed'; return; }
        this.result = res?.data ?? null;
      },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'Execution failed'; },
    });
  }

  download(): void {
    const user = this.userData?.login || 'system';
    this.svc.executeExport$(this.data.scriptSid, user).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.data.scriptName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toastr.error('Excel download failed'),
    });
  }

  close(): void { this.dialogRef.close(); }
}
