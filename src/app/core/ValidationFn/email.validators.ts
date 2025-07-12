import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class EmailValidators {

  static singleEmail(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const email = control.value.trim();
      if (email.length === 0) return { required: true };

      // RFC 5322 compliant regex (official email standard)
      const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      // General Case
      // const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


      return emailRegex.test(email)
        ? null
        : {
          invalidEmail: {
            message: 'Invalid email format',
            value: email,
            examples: 'Expected format: user@example.com'
          }
        };
    };
  }

  static multipleEmails(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = control.value.trim();

      // Check for trailing comma
      if (value.endsWith(',')) {
        return { trailingComma: { message: 'Remove trailing comma or add another email' } };
      }

      const emails = value.split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (emails.length === 0) return null;

      // Check for duplicates (case insensitive)
      const emailSet = new Set<string>();
      const duplicates = new Set<string>();

      emails.forEach(email => {
        const lowerEmail = email.toLowerCase();
        if (emailSet.has(lowerEmail)) {
          duplicates.add(email);
        }
        emailSet.add(lowerEmail);
      });

      if (duplicates.size > 0) {
        return {
          duplicateEmails: {
            message: 'Duplicate emails found',
            duplicates: Array.from(duplicates)
          }
        };
      }

      // RFC 5322 compliant regex
      // const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      // General Case
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      const invalidEmails = emails.filter(email => !emailRegex.test(email));

      if (invalidEmails.length > 0) {
        return {
          invalidEmails: {
            message: 'One or more emails are invalid',
            invalidCount: invalidEmails.length,
            firstInvalid: invalidEmails[0],
            examples: 'Valid format: user@example.com'
          }
        };
      }

      return null;
    };
  }
}
/*
      -------------  Local Part (before @)  ----------------

        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+")) 
        -->   [^<>()\[\]\\.,;:\s@"]+
             one or more characters that are not:
                Special chars: <>()[]\.,;:@
                Whitespace (\s)
                Quotes (")

        -->   (\.[^<>()\[\]\\.,;:\s@"]+)*
                Allows dots (.) but not consecutively (e.g., user.name).
        -->   (".+")
                Supports quoted strings (e.g., "first last"@domain.com).

      -------------  Domain Part (after @)  ----------------

        -->     (\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])  
                    # IPv4 address (e.g., [192.168.1.1])
        -->     (([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})                     
                    # Standard domain (e.g., gmail.com)

    */

/*

@if((form.get('emails')?.touched || form.get('emails')?.dirty) && form.get('emails')?.invalid) {
<div class="error-message">
@if(form.get('emails')?.hasError('trailingComma')) {
  <span>{{ form.get('emails')?.errors?.trailingComma.message }}</span>
}
 
@if(form.get('emails')?.hasError('duplicateEmails')) {
  <span>
    {{ form.get('emails')?.errors?.duplicateEmails.message }}: 
    {{ form.get('emails')?.errors?.duplicateEmails.duplicates.join(', ') }}
  </span>
}
 
@if(form.get('emails')?.hasError('invalidEmails')) {
  <span>
    {{ form.get('emails')?.errors?.invalidEmails.message }} - 
    First invalid: "{{ form.get('emails')?.errors?.invalidEmails.firstInvalid }}"
  </span>
}
</div>
}

*/