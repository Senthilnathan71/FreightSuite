import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { saveAs } from 'file-saver';

interface FilePickerWindow extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PdfFileSaveService {
  constructor(private http: HttpClient) {}

  async shouldDownloadByFilePath(companyMasterSid: number): Promise<boolean> {
    if (!companyMasterSid) return false;

    try {
      const resp: any = await firstValueFrom(
        this.http.get(`company-config/value/${companyMasterSid}/SaveAsFilePath`)
      );
      const rawValue = resp?.data ?? resp;
      return this.isTruthyConfigValue(rawValue);
    } catch (error) {
      console.error('Error fetching SaveAsFilePath config:', error);
      return false;
    }
  }

  async savePdf(blob: Blob, filename: string, preferPicker: boolean): Promise<void> {
    if (preferPicker) {
      await this.saveWithPicker(blob, filename);
      return;
    }
    saveAs(blob, filename);
  }

  private async saveWithPicker(blob: Blob, filename: string): Promise<void> {
    const pickerWindow = window as FilePickerWindow;

    if (typeof pickerWindow.showSaveFilePicker === 'function') {
      try {
        const fileHandle = await pickerWindow.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'PDF Document',
              accept: {
                'application/pdf': ['.pdf']
              }
            }
          ]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          throw error;
        }
      }
    }

    saveAs(blob, filename);
  }

  private isTruthyConfigValue(value: any): boolean {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;

    const normalized = String(value).trim().toUpperCase();
    return normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE' || normalized === '1';
  }
}
