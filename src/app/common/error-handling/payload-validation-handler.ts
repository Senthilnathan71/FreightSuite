// This is for sorting the messages provided by Class-Validators (multiple messages)

import { throwError } from "rxjs";
import { ResponseData } from "../../modules/operation/services/shipment-milestone.service";

/**
 * Priority order for validation error messages
 * Lower number = higher priority (appears first)
 */
enum ValidationErrorPriority {
  REQUIRED = 1,
  TYPE = 2,
  FORMAT = 3,
  LENGTH = 4,
  RANGE = 5,
  PATTERN = 6,
  CUSTOM = 7,
  OTHER = 8
}

/**
 * Determines the priority of a validation error message
 */
function getErrorPriority(message: string): number {
  const lowerMessage = message.toLowerCase();

  // Required validation
  if (lowerMessage.includes('is required') || lowerMessage.includes('should not be empty')) {
    return ValidationErrorPriority.REQUIRED;
  }

  // Type validation
  if (lowerMessage.includes('must be a') || 
      lowerMessage.includes('must be an') ||
      lowerMessage.includes('should be a') ||
      lowerMessage.includes('should be an')) {
    return ValidationErrorPriority.TYPE;
  }

  // Format/Structure validation
  if (lowerMessage.includes('must be') && 
      (lowerMessage.includes('format') || 
       lowerMessage.includes('valid') ||
       lowerMessage.includes('email') ||
       lowerMessage.includes('url'))) {
    return ValidationErrorPriority.FORMAT;
  }

  // Length validation
  if (lowerMessage.includes('shorter than') || 
      lowerMessage.includes('longer than') ||
      lowerMessage.includes('length') ||
      lowerMessage.includes('characters')) {
    return ValidationErrorPriority.LENGTH;
  }

  // Range validation
  if (lowerMessage.includes('must not be less than') ||
      lowerMessage.includes('must not be greater than') ||
      lowerMessage.includes('between')) {
    return ValidationErrorPriority.RANGE;
  }

  // Pattern validation
  if (lowerMessage.includes('match') || lowerMessage.includes('pattern')) {
    return ValidationErrorPriority.PATTERN;
  }

  // Custom validation (IsIn, etc.)
  if (lowerMessage.includes('must be one of') || lowerMessage.includes('invalid')) {
    return ValidationErrorPriority.CUSTOM;
  }

  // Default for other messages
  return ValidationErrorPriority.OTHER;
}

/**
 * Sorts validation error messages by priority
 * @param messages - Array of validation error messages
 * @returns Sorted array with highest priority errors first
 */
export function sortValidationErrors(messages: string[]): string[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  return [...messages].sort((a, b) => {
    const priorityA = getErrorPriority(a);
    const priorityB = getErrorPriority(b);
    
    // Sort by priority first
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, maintain original order (stable sort)
    return 0;
  });
}

/**
 * Gets the first (highest priority) error message
 */
export function getFirstValidationError(messages: string | string[]): string {
  if (typeof messages === 'string') {
    return messages;
  }
  
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Validation failed';
  }

  const sorted = sortValidationErrors(messages);
  return sorted[0];
}

export function handleError(error: any) {
  if (error.status === 400 && error.error) {
    let backendMessage: string;
    if (Array.isArray(error.error.message)) {
      const sortedMessages = sortValidationErrors(error.error.message);
      backendMessage = sortedMessages.join('\n');
    } else {
      backendMessage = error.error.message || 'Bad Request';
    }
    const newError: ResponseData = {
      status: false,
      message: backendMessage,
      data: null
    };
    return throwError(() => newError);
  }
  const fallbackError: ResponseData = {
    status: false,
    message: 'Something went wrong',
    data: null
  };
  return throwError(() => fallbackError);
}