import { TestBed } from '@angular/core/testing';
import { SessionStateService } from './session-state.service';

describe('SessionStateService', () => {
  let service: SessionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionStateService);
  });

  it('should toggle read-only state', () => {
    expect(service.isReadOnly).toBeFalse();

    service.setReadOnly(true);
    expect(service.isReadOnly).toBeTrue();

    service.clear();
    expect(service.isReadOnly).toBeFalse();
  });
});
