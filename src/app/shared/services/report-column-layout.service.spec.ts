import { ReportColumnLayoutService } from './report-column-layout.service';

describe('ReportColumnLayoutService', () => {
  let service: ReportColumnLayoutService;
  const SID = 123;

  beforeEach(() => {
    localStorage.clear();
    service = new ReportColumnLayoutService();
  });

  afterEach(() => localStorage.clear());

  it('returns null when nothing is saved', () => {
    expect(service.load(SID)).toBeNull();
  });

  it('round-trips a saved layout', () => {
    service.save(SID, { order: ['a', 'b', 'c'], hidden: ['b'] });
    expect(service.load(SID)).toEqual({ order: ['a', 'b', 'c'], hidden: ['b'] });
  });

  it('scopes layouts per report id', () => {
    service.save(SID, { order: ['a'], hidden: [] });
    expect(service.load(999)).toBeNull();
  });

  it('reset removes the saved layout', () => {
    service.save(SID, { order: ['a'], hidden: [] });
    service.reset(SID);
    expect(service.load(SID)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    localStorage.setItem(`report-columns:${SID}`, '{ not valid json');
    expect(service.load(SID)).toBeNull();
  });

  it('coerces missing arrays to empty', () => {
    localStorage.setItem(`report-columns:${SID}`, JSON.stringify({ order: ['a'] }));
    expect(service.load(SID)).toEqual({ order: ['a'], hidden: [] });
  });
});
