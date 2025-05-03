import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog , MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'delete-warning-dialog',
  standalone: true,
    imports: [
       CommonModule,
          MatDialogModule, 
          MatButtonModule
    ],
  template: `
    <h2 mat-dialog-title>Confirm Delete</h2>
    <mat-dialog-content>Are you sure you want to delete this?</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNo()">Cancel</button>
      <button mat-button color="warn" (click)="onYes()">Delete</button>
    </mat-dialog-actions>
  `
})
export class DeleteWarningComponent {
  constructor(
    private dialogRef: MatDialogRef<DeleteWarningComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onYes() {
    this.dialogRef.close(true);
  }

  onNo() {
    this.dialogRef.close(false);
  }
}
