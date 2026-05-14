import { Injectable } from '@angular/core';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

export interface VoucherActionGuardContext {
  documentName: string;
  isSaving?: boolean;
  isPosting?: boolean;
  isCancelling?: boolean;
  isEditMode?: boolean;
  isReadOnly?: boolean;
  isPosted?: boolean;
  isDirty?: boolean;
  headerId?: number | string | null;
  formInvalid?: boolean;
  status?: string | null;
  postStatus?: string | null;
  canInsert?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canPost?: boolean;
  blockedByCondition?: boolean;
  blockedConditionReason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VoucherActionGuardService {
  constructor(private appSettings: AppSettingsService) {}

  block(reason: string, resolve?: (value: boolean) => void): boolean {
    if (!reason) return false;
    this.appSettings.showWarning(reason);
    resolve?.(false);
    return true;
  }

  getInsertBlockedReason(ctx: VoucherActionGuardContext): string {
    if (ctx.canInsert === false) {
      return `You do not have permission to create this ${this.lower(ctx.documentName)}.`;
    }
    return '';
  }

  getSaveBlockedReason(ctx: VoucherActionGuardContext): string {
    if (ctx.isSaving) return `${ctx.documentName} is already saving. Please wait.`;
    if (this.isPosted(ctx)) return `${ctx.documentName} is already posted and cannot be saved.`;
    if (this.isInactive(ctx.status)) return `Inactive ${this.lower(ctx.documentName)} cannot be saved.`;
    if (ctx.isReadOnly) return `${ctx.documentName} cannot be saved in its current status.`;
    if (ctx.isEditMode && ctx.canUpdate === false) {
      return `You do not have permission to update this ${this.lower(ctx.documentName)}.`;
    }
    if (!ctx.isEditMode && ctx.canInsert === false) {
      return `You do not have permission to create this ${this.lower(ctx.documentName)}.`;
    }
    return '';
  }

  getPostBlockedReason(ctx: VoucherActionGuardContext): string {
    if (ctx.isSaving || ctx.isPosting) return `${ctx.documentName} is currently saving or posting. Please wait.`;
    if (this.isPosted(ctx)) return `${ctx.documentName} is already posted.`;
    if (!ctx.headerId) return `Please save the ${this.lower(ctx.documentName)} before posting.`;
    if (this.isInactive(ctx.status)) return `Inactive ${this.lower(ctx.documentName)} cannot be posted.`;
    if (ctx.isReadOnly) return `${ctx.documentName} cannot be posted in its current status.`;
    if (ctx.canPost === false) return `You do not have permission to post this ${this.lower(ctx.documentName)}.`;
    if (ctx.formInvalid) return 'Please fill all required fields before posting.';
    if (ctx.isDirty) return 'Please save the draft before posting.';
    return '';
  }

  getDeleteBlockedReason(ctx: VoucherActionGuardContext): string {
    if (ctx.canDelete === false) {
      return `You do not have permission to delete this ${this.lower(ctx.documentName)}.`;
    }
    if (this.isPosted(ctx)) return `Posted ${this.lower(ctx.documentName)} cannot be deleted.`;
    if (this.isInactive(ctx.status)) return `${ctx.documentName} cannot be deleted in its current status.`;
    if (ctx.isReadOnly) return `${ctx.documentName} cannot be deleted in its current status.`;
    if (ctx.blockedByCondition) {
      return ctx.blockedConditionReason || `${ctx.documentName} cannot be deleted in its current status.`;
    }
    return '';
  }

  getDetailMutationBlockedReason(ctx: VoucherActionGuardContext): string {
    if (this.isPosted(ctx)) return `${ctx.documentName} details cannot be changed after posting.`;
    if (this.isInactive(ctx.status)) return `${ctx.documentName} details cannot be changed in its current status.`;
    if (ctx.isReadOnly) return `${ctx.documentName} details cannot be changed in its current status.`;
    if (ctx.canUpdate === false && ctx.isEditMode) {
      return `You do not have permission to update this ${this.lower(ctx.documentName)}.`;
    }
    return '';
  }

  getCancelBlockedReason(ctx: VoucherActionGuardContext): string {
    if (ctx.isCancelling) return `${ctx.documentName} is already cancelling. Please wait.`;
    if (!ctx.headerId) return `Please save the ${this.lower(ctx.documentName)} before cancelling.`;
    if (this.isInactive(ctx.status)) return `${ctx.documentName} cannot be cancelled in its current status.`;
    if (ctx.canUpdate === false) {
      return `You do not have permission to update this ${this.lower(ctx.documentName)}.`;
    }
    if (ctx.blockedByCondition) {
      return ctx.blockedConditionReason || `${ctx.documentName} cannot be cancelled in its current status.`;
    }
    return '';
  }

  getReverseBlockedReason(ctx: VoucherActionGuardContext): string {
    if (ctx.isSaving || ctx.isPosting || ctx.isCancelling) {
      return `${ctx.documentName} is currently processing. Please wait.`;
    }
    if (!ctx.headerId) return `Please save the ${this.lower(ctx.documentName)} before reversing.`;
    if (!this.isPosted(ctx)) return `${ctx.documentName} must be posted before reversing.`;
    if (this.isInactive(ctx.status)) return `${ctx.documentName} cannot be reversed in its current status.`;
    if (ctx.canUpdate === false) {
      return `You do not have permission to update this ${this.lower(ctx.documentName)}.`;
    }
    if (ctx.blockedByCondition) {
      return ctx.blockedConditionReason || `${ctx.documentName} cannot be reversed in its current status.`;
    }
    return '';
  }

  private isPosted(ctx: VoucherActionGuardContext): boolean {
    if (ctx.isPosted) return true;
    const status = this.normalize(ctx.postStatus);
    return status === 'P' || status === 'POSTED';
  }

  private isInactive(status?: string | null): boolean {
    const normalized = this.normalize(status);
    return ['S', 'SUSPENDED', 'INACTIVE', 'R', 'REVERSED', 'CANCELLED', 'CANCELED'].includes(normalized);
  }

  private normalize(value?: string | null): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private lower(documentName: string): string {
    return documentName.toLowerCase();
  }
}
