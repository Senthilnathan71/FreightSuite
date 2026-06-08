import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportViewModeService } from './report-view-mode.service';

describe('ReportViewModeService', () => {
  let service: ReportViewModeService;
  let httpMock: HttpTestingController;
  const COMPANY = 1;
  const URL = `company-config/value/${COMPANY}/EnableReportColumnCustomization`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportViewModeService],
    });
    service = TestBed.inject(ReportViewModeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('user override takes precedence over company config (no HTTP call)', (done) => {
    service.setUserOverride('CLASSIC');
    service.getEffectiveMode(COMPANY).subscribe((mode) => {
      expect(mode).toBe('CLASSIC');
      done();
    });
    httpMock.expectNone(URL);
  });

  it('falls back to company default = NEW when config value is Y', (done) => {
    service.getEffectiveMode(COMPANY).subscribe((mode) => {
      expect(mode).toBe('NEW');
      done();
    });
    httpMock.expectOne(URL).flush({ data: { ConfigurationValue: 'Y' } });
  });

  it('company default = CLASSIC when config value is N', (done) => {
    service.getEffectiveMode(COMPANY).subscribe((mode) => {
      expect(mode).toBe('CLASSIC');
      done();
    });
    httpMock.expectOne(URL).flush({ data: { ConfigurationValue: 'N' } });
  });

  it('company default = CLASSIC on error', (done) => {
    service.getEffectiveMode(COMPANY).subscribe((mode) => {
      expect(mode).toBe('CLASSIC');
      done();
    });
    httpMock.expectOne(URL).error(new ProgressEvent('error'));
  });

  it('setUserOverride(null) clears the override', () => {
    service.setUserOverride('NEW');
    expect(service.getUserOverride()).toBe('NEW');
    service.setUserOverride(null);
    expect(service.getUserOverride()).toBeNull();
  });
});
