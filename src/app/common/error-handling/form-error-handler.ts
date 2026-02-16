import { AbstractControl, FormArray, FormGroup } from "@angular/forms";
import { ToastrService } from "ngx-toastr";

export interface ValidationMessageConfig {
  /** Override field display name */
  labels?: Record<string, string>;

  /** Override messages per error type */
  messages?: {
    required?: string | ((label: string) => string);
    minlength?: (label: string, error: any) => string;
    maxlength?: (label: string, error: any) => string;
    min?: (label: string, error: any) => string;
    max?: (label: string, error: any) => string;
    pattern?: (label: string) => string;
    default?: (label: string) => string;
  };
}

export function errorLoggerWithToastr(
  form: FormGroup | FormArray,
  toastr: ToastrService,
  config?: ValidationMessageConfig
): void {

  if (form.valid) {
    return;
  }

  const messages = collectErrors(form, '', config);

  toastr.warning(
    messages.join('\n'),
    'Please fill the following fields correctly.',
    {
      enableHtml: false,
      timeOut: 5000,
      closeButton: true,
    }
  );
}

function collectErrors(
  control: FormGroup | FormArray,
  parentKey: string = '',
  config?: ValidationMessageConfig
): string[] {

  let errors: string[] = [];

  Object.keys(control.controls).forEach(key => {
    const currentControl = control.get(key);
    const controlPath = parentKey ? `${parentKey}.${key}` : key;

    if (currentControl instanceof FormGroup || currentControl instanceof FormArray) {
      errors = errors.concat(
        collectErrors(currentControl, controlPath, config)
      );
    }

    if (currentControl?.errors) {
      errors = errors.concat(
        buildErrorMessages(currentControl, controlPath, config)
      );
    }
  });

  return errors;
}

function buildErrorMessages(
  control: AbstractControl,
  controlPath: string,
  config?: ValidationMessageConfig
): string[] {

  const messages: string[] = [];
  const { cleanPath, row } = extractRowIndex(controlPath);

  const label =
    config?.labels?.[normalizePath(cleanPath)]
    ?? prettifyControlName(cleanPath);

  const finalLabel = row
    ? `${label} (row ${row})`
  : label;

  Object.keys(control.errors!).forEach(errorKey => {
    const errorValue = control.errors![errorKey];

    switch (errorKey) {
      case 'required':
        messages.push(`${finalLabel} is required`);
        break;


      case 'minlength':
        messages.push(
          config?.messages?.minlength
            ? config.messages.minlength(label, errorValue)
            : `${label} must be at least ${errorValue.requiredLength} characters`
        );
        break;

      case 'maxlength':
        messages.push(
          config?.messages?.maxlength
            ? config.messages.maxlength(label, errorValue)
            : `${label} must not exceed ${errorValue.requiredLength} characters`
        );
        break;

      case 'min':
        messages.push(
          config?.messages?.min
            ? config.messages.min(label, errorValue)
            : `${label} must be greater than ${errorValue.min}`
        );
        break;

      case 'max':
        messages.push(
          config?.messages?.max
            ? config.messages.max(label, errorValue)
            : `${label} must be less than ${errorValue.max}`
        );
        break;

      case 'pattern':
        messages.push(
          config?.messages?.pattern
            ? config.messages.pattern(label)
            : `${label} format is invalid`
        );
        break;

      default:
        messages.push(
          config?.messages?.default
            ? config.messages.default(label)
            : `${label} is invalid`
        );
    }
  });

  return messages;
}

function extractRowIndex(path: string): { cleanPath: string; row?: number } {
  const match = path.match(/(\w+)\.(\d+)\.(.+)/);

  if (!match) {
    return { cleanPath: path };
  }

  const row = Number(match[2]) + 1;
  const fieldName = match[3];

  return {
    cleanPath: fieldName,
    row,
  };
}




function normalizePath(path: string): string {
  return path.replace(/\.\d+/g, '');
}

function prettifyControlName(controlName: string): string {
  return controlName
    .replace(/\.\d+/g, '')          // remove array indexes
    .replace(/([A-Z])/g, ' $1')     // split camelCase
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
