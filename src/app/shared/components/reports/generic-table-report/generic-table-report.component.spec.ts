import { GenericTableReportComponent } from './generic-table-report.component';
import { ReportColumnLayoutService } from '../../../services/report-column-layout.service';

describe('GenericTableReportComponent', () => {
  let layout: ReportColumnLayoutService;
  const appStub: any = { getCurrentCompanyInfo: () => ({ companyName: 'ACME Logistics' }) };
  const SID = 555;

  const sampleData = {
    data: [
      { jobNumber: 'J1', mbl: 'M1', amount: 100 },
      { jobNumber: 'J2', mbl: 'M2', amount: 200 },
    ],
    params: {},
  };

  function build(data: any = sampleData): GenericTableReportComponent {
    const c = new GenericTableReportComponent(data, layout, appStub);
    c.reportMasterSid = SID;
    c.reportDisplayName = 'BL Issue List';
    c.ngOnInit();
    return c;
  }

  beforeEach(() => {
    localStorage.clear();
    layout = new ReportColumnLayoutService();
  });

  afterEach(() => localStorage.clear());

  it('derives columns from the data keys', () => {
    const c = build();
    expect(c.tableConfig.columns.map((col) => col.key)).toEqual(['jobNumber', 'mbl', 'amount']);
  });

  it('humanizes labels and exposes all rows', () => {
    const c = build();
    const labels = c.tableConfig.columns.map((col) => col.label);
    expect(labels).toEqual(['Job Number', 'Mbl', 'Amount']);
    expect(c.rows.length).toBe(2);
  });

  it('resolves rows from a bare array payload', () => {
    const c = build([{ a: 1 }, { a: 2 }]);
    expect(c.rows.length).toBe(2);
    expect(c.tableConfig.columns.map((col) => col.key)).toEqual(['a']);
  });

  it('getExcelData returns all visible columns by default', () => {
    const c = build();
    const cfg = c.getExcelData();
    expect(cfg.tableHeaders.map((h) => h.key)).toEqual(['jobNumber', 'mbl', 'amount']);
    expect(cfg.rows.length).toBe(2);
    expect(cfg.reportHeader.companyName).toBe('ACME Logistics');
    expect(cfg.reportHeader.reportTitle).toBe('BL Issue List');
  });

  it('getExcelData honors hidden columns', () => {
    const c = build();
    c.onColumnVisibilityChange({ jobNumber: false, mbl: true, amount: true });
    const cfg = c.getExcelData();
    expect(cfg.tableHeaders.map((h) => h.key)).toEqual(['mbl', 'amount']);
    expect(cfg.rows[0].cells.length).toBe(2);
  });

  it('getExcelData honors reordered columns', () => {
    const c = build();
    c.onColumnOrderChange(['amount', 'mbl', 'jobNumber']);
    const cfg = c.getExcelData();
    expect(cfg.tableHeaders.map((h) => h.key)).toEqual(['amount', 'mbl', 'jobNumber']);
  });

  it('applies a saved layout on init (order + hidden)', () => {
    layout.save(SID, { order: ['amount', 'jobNumber', 'mbl'], hidden: ['mbl'] });
    const c = build();
    expect(c.tableConfig.columns.map((col) => col.key)).toEqual(['amount', 'jobNumber', 'mbl']);
    expect(c.tableConfig.columns.find((col) => col.key === 'mbl')?.visible).toBe(false);
    expect(c.getExcelData().tableHeaders.map((h) => h.key)).toEqual(['amount', 'jobNumber']);
  });

  it('resetColumns reverts to defaults and clears storage', () => {
    layout.save(SID, { order: ['amount', 'jobNumber', 'mbl'], hidden: ['mbl'] });
    const c = build();
    c.resetColumns();
    expect(c.tableConfig.columns.map((col) => col.key)).toEqual(['jobNumber', 'mbl', 'amount']);
    expect(c.getExcelData().tableHeaders.map((h) => h.key)).toEqual(['jobNumber', 'mbl', 'amount']);
    expect(layout.load(SID)).toBeNull();
  });

  // --- Per-report overrides (data path + totals row) ------------------------

  function buildOverride(data: any, reportName: string): GenericTableReportComponent {
    const c = new GenericTableReportComponent(data, layout, appStub);
    c.reportMasterSid = 0; // no persistence
    c.reportName = reportName;
    c.ngOnInit();
    return c;
  }

  it('resolves nested VAT rows and appends a summed totals row', () => {
    const data = {
      data: {
        inputTax: [
          { voucherDate: '2026-01-01', subledgerName: 'A', taxableAmt: 100, taxAmt: 5 },
          { voucherDate: '2026-01-02', subledgerName: 'B', taxableAmt: 200, taxAmt: 10 },
        ],
      },
      params: {},
    };
    const c = buildOverride(data, 'vat-receivable-report');

    // 2 data rows + 1 totals row
    expect(c.rows.length).toBe(3);
    const total = c.rows[2];
    expect(total.__isTotalRow).toBe(true);
    expect(total.taxableAmt).toBe(300);
    expect(total.taxAmt).toBe(15);
    expect(total.voucherDate).toBe('Total'); // label in first non-numeric column
    // columns derived from the data rows only (no __isTotalRow column)
    expect(c.tableConfig.columns.map((col) => col.key)).toEqual([
      'voucherDate', 'subledgerName', 'taxableAmt', 'taxAmt',
    ]);
  });

  it('ledger totals sum the local amount and carry the last running balance', () => {
    const data = {
      transactions: [
        { voucherDate: '2026-01-01', signedLocalAmt: 100, cumulativeOutstanding: 100 },
        { voucherDate: '2026-01-02', signedLocalAmt: 50, cumulativeOutstanding: 150 },
      ],
      params: {},
    };
    const c = buildOverride(data, 'ledger-report');

    expect(c.rows.length).toBe(3);
    const total = c.rows[2];
    expect(total.signedLocalAmt).toBe(150); // summed
    expect(total.cumulativeOutstanding).toBe(150); // last value, not summed
    expect(total.voucherDate).toBe('Total');
  });

  it('resolves nested GST tableData and sums the numeric columns', () => {
    const data = {
      data: {
        tableData: [
          { TransactionNo: 'T1', TxnValue: 100, TaxableValue: 90, IGST: 5, TotalGST: 5 },
          { TransactionNo: 'T2', TxnValue: 200, TaxableValue: 180, IGST: 10, TotalGST: 10 },
        ],
      },
      params: {},
    };
    const c = buildOverride(data, 'GST-inward');
    expect(c.rows.length).toBe(3);
    const total = c.rows[2];
    expect(total.__isTotalRow).toBe(true);
    expect(total.TxnValue).toBe(300);
    expect(total.TaxableValue).toBe(270);
    expect(total.IGST).toBe(15);
    expect(total.TotalGST).toBe(15);
    expect(total.TransactionNo).toBe('Total'); // first non-numeric column
  });

  it('exports the totals row with total style', () => {
    const data = {
      data: { inputTax: [{ voucherDate: '2026-01-01', taxableAmt: 100, taxAmt: 5 }] },
      params: {},
    };
    const c = buildOverride(data, 'vat-receivable-report');
    const cfg = c.getExcelData();
    expect(cfg.rows.length).toBe(2);
    expect(cfg.rows[1].style).toBe('total');
  });

  // --- Rendering from the Classic getExcelData() source config --------------

  function buildSource(sourceConfig: any): GenericTableReportComponent {
    const c = new GenericTableReportComponent(null, layout, appStub);
    c.reportMasterSid = 0;
    c.reportDisplayName = 'Fallback Name';
    c.sourceConfig = sourceConfig;
    c.ngOnInit();
    return c;
  }

  it('matches Classic: title, header lines, curated columns and values from sourceConfig', () => {
    const cfg = {
      reportHeader: {
        companyName: 'ACME',
        reportTitle: 'House Summary Report',
        additionalInfo: [
          { label: 'From Date', value: '01/05/2026' },
          { label: 'To Date', value: '07/06/2026' },
          { label: 'Branch', value: '' }, // empty -> filtered out
        ],
      },
      tableHeaders: [
        { key: 'jobNo', label: 'Job No' },
        { key: 'shipper', label: 'Shipper' },
        { key: 'teu', label: 'TEU' },
      ],
      rows: [
        { style: 'data', cells: [{ value: 'J1' }, { value: 'A' }, { value: 1 }] },
        { style: 'data', cells: [{ value: 'J2' }, { value: 'B' }, { value: 2 }] },
      ],
    };
    const c = buildSource(cfg);

    expect(c.displayTitle).toBe('House Summary Report');
    expect(c.tableConfig.columns.map((col) => col.label)).toEqual(['Job No', 'Shipper', 'TEU']);
    expect(c.paramSummary.map((p) => p.label)).toEqual(['From Date', 'To Date']); // empty Branch dropped
    expect(c.rows.length).toBe(2);
    expect(c.rows[0]).toEqual(jasmine.objectContaining({ jobNo: 'J1', shipper: 'A', teu: 1 }));
  });

  it('expands a colspan total row to the correct columns', () => {
    const cfg = {
      reportHeader: { companyName: 'ACME', reportTitle: 'Ledger', additionalInfo: [] },
      tableHeaders: [
        { key: 'date', label: 'Date' },
        { key: 'naration', label: 'Narration' },
        { key: 'debit', label: 'Debit' },
        { key: 'credit', label: 'Credit' },
      ],
      rows: [
        { style: 'data', cells: [{ value: '01/01' }, { value: 'x' }, { value: 100 }, { value: 0 }] },
        { style: 'total', cells: [{ value: 'Total', colspan: 2 }, { value: 100 }, { value: 0 }] },
      ],
    };
    const c = buildSource(cfg);
    const total = c.rows[1];
    expect(total.__isTotalRow).toBe(true);
    expect(total.date).toBe('Total'); // colspan label lands on the first column
    expect(total.debit).toBe(100); // aligned past the colspan
    expect(total.credit).toBe(0);
    expect(total.naration).toBeUndefined(); // covered by the colspan, left blank
  });

  it('renders amount in words outside the table when provided by sourceConfig', () => {
    const cfg = {
      reportHeader: {
        companyName: 'ACME',
        reportTitle: 'Statement of Accounts',
        additionalInfo: [],
      },
      tableHeaders: [
        { key: 'voucherNo', label: 'Voucher No' },
        { key: 'amount', label: 'Amount' },
      ],
      rows: [
        { style: 'data', cells: [{ value: 'V1' }, { value: 100 }] },
        {
          style: 'data',
          cells: [
            { value: 'Amount in words', colspan: 2 },
            { value: 'One Hundred Only' },
          ],
        },
      ],
    };
    const c = buildSource(cfg);

    expect(c.rows.length).toBe(1);
    expect(c.rows[0]).toEqual(jasmine.objectContaining({ voucherNo: 'V1', amount: 100 }));
    expect(c.reportNotes).toEqual(['One Hundred Only']);
    expect(c.getExcelData().notesLabel).toBe('Amount in words');
    expect(c.getExcelData().notes).toEqual(['One Hundred Only']);
  });
});
