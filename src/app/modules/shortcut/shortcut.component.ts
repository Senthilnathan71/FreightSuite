import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { ShortcutService } from './shortcut.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-shortcut',
  standalone: true,
  imports: [FeatherModule, CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './shortcut.component.html',
  styleUrl: './shortcut.component.scss'
})
export class ShortcutComponent {

   @ViewChild('content') contentModal!: TemplateRef<any>;
  @ViewChild('editModal') editModal!: TemplateRef<any>;
  @ViewChild('addNewModal') addNewModal!: TemplateRef<any>;

  shortcutForm!: FormGroup;
  shortcuts: any[] = [];
  chunkedShortcuts: any[][] = [];
  chunkedShortcutsEdit: any[][] = [];
  currentEditId?: number;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private shortcutService: ShortcutService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.shortcutForm = this.fb.group({
      label: ['', Validators.required],
      description: [''],
      link: ['', Validators.required],
      useRouter: [false],
    });

    this.loadShortcuts();
    setTimeout(() => {
      this.openModal(this.contentModal);
    }, 0);
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }
  loadShortcuts(): void {
    this.shortcutService.getAllShortcut().subscribe((resp: any) => {
      this.shortcuts = resp;
      this.chunkedShortcuts = this.chunkArray(this.shortcuts, 2);
      this.chunkedShortcutsEdit = this.chunkArray(this.shortcuts, 2);
    });
  }

  chunkArray(arr: any[], size: number): any[][] {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  openAddNew(currentModal: NgbModalRef) {
    currentModal.dismiss();
    this.currentEditId = undefined;
    this.shortcutForm.reset({ useRouter: false });
    setTimeout(() => {
      this.modalService.open(this.addNewModal, { size: 'lg', centered: true });
    }, 100);
  }

  openEditModal(currentModal: NgbModalRef) {
    currentModal.dismiss();
    setTimeout(() => {
      this.modalService.open(this.editModal, { size: 'lg', centered: true });
    }, 100);
  }

  editShortcut(shortcut: any, modal: NgbModalRef) {
    modal.dismiss();
    this.currentEditId = shortcut.shortCutId;
    this.shortcutForm.patchValue({
      label: shortcut.label,
      description: shortcut.description,
      link: shortcut.link,
      useRouter: shortcut.useRouter,
    });
    setTimeout(() => {
      this.modalService.open(this.addNewModal, { size: 'lg', centered: true });
    }, 100);
  }

  onSubmit(): void {
    
    if (this.currentEditId) {
      const payload = {
        ...this.shortcutForm.value,
        shortCutId:this.currentEditId
      }
      this.shortcutService.updateShortcutById(this.currentEditId, payload).subscribe(() => {
        this.afterSave();
      });
    } else {
      const payload = this.shortcutForm.value;
      this.shortcutService.createShortcut(payload).subscribe(() => {
        this.afterSave();
      });
    }
  }

  afterSave(): void {
    this.modalService.dismissAll();
    this.loadShortcuts();
    this.shortcutForm.reset({ useRouter: false });
    this.currentEditId = undefined;
  }

  navigateTo(shortcut: any) {
  if (shortcut.link) {
    this.router.navigateByUrl(shortcut.link);
    this.modalService.dismissAll()
  }
}

}
