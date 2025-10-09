# Invoice Currency Default & User Override Flow

This document explains how the default currency works and how users can change it in different scenarios.

## 📋 Overview

The system now has **smart currency defaulting** that adapts to different scenarios while always allowing users to override:

| Scenario | Default Currency | Can User Change? | Where to Change |
|----------|-----------------|------------------|-----------------|
| **New Invoice (Direct)** | Company Home Currency | ✅ Yes | Invoice Entry Form |
| **Invoice from Booking** | Charge Currency → Company Home Currency | ✅ Yes | Invoice Generation Modal |

---

## 🎯 Scenario 1: Creating New Invoice Directly

**Path:** `/operation/invoice/entry` (no ID parameter)

### Default Behavior
When creating a new invoice directly (not from booking):

1. **Currency Code**: Auto-set to **company's home currency** (e.g., "AED", "USD", "INR")
2. **Exchange Rate**: Auto-set to **1** (home currency always has rate of 1)

### Implementation
`invoice-entry.component.ts` (lines 137-143):

```typescript
// New invoice - set default currency from company config
const currencySettings = this.companySettings.getCurrencySettings();
this.invoiceForm.patchValue({
  PartyMasterSid: 3,
  CurrencyCode: currencySettings.code,  // e.g., "AED"
  ExchangeRate: 1                       // Home currency rate
});
```

### User Can Change
✅ **Yes**, users can change both:
- Select different currency from dropdown in the form
- Manually enter different exchange rate

---

## 🎯 Scenario 2: Generating Invoice from Booking

**Path:** Booking Entry → Rates Tab → Generate Voucher → Select Charges → Generate

### Default Behavior (Priority Order)

The modal initializes currency in this order:

1. **First Priority**: Currency from the selected charge
   - If generating **Invoice**: Use `RevenueCurrencyMaster` from first charge
   - If generating **Vendor Invoice**: Use `CostCurrencyMaster` from first charge

2. **Second Priority**: Company's home currency from config
   - If charge has no currency, use company default (e.g., "AED")

3. **Fallback**: `null` (user must select)

### Implementation
`booking-entry.component.ts` (lines 2477-2486):

```typescript
// Set default currency from booking, charge, or company config
const defaultCurrency = isRevenue
  ? firstCharge?.RevenueCurrencyMaster
  : firstCharge?.CostCurrencyMaster;

// Get company's home currency from settings
const companyHomeCurrency = this.companySettings.getCurrencySettings();
const companyCurrency = this.currencyList?.find(c => c?.currencyCode === companyHomeCurrency.code);

this.invoiceHeaderCurrency = defaultCurrency || companyCurrency || null;
```

### User Can Change
✅ **Yes**, users can change in the modal:

#### Modal Controls
```html
<!-- Currency Dropdown (line 2558-2565) -->
<ng-select
  [(ngModel)]="invoiceHeaderCurrency"
  [items]="currencyList"
  bindLabel="currencyCode"
  placeholder="Select Currency"
  (change)="onHeaderCurrencyChange()">
</ng-select>

<!-- Exchange Rate Input (line 2577-2584) -->
<input
  type="number"
  [(ngModel)]="invoiceHeaderExchangeRate"
  (ngModelChange)="onHeaderExchangeRateChange()"
  step="0.0001"
  min="0" />
```

#### What Happens When User Changes

**When Currency Changes:**
- `onHeaderCurrencyChange()` is called
- Tax calculations are recalculated
- Converted amounts update automatically

**When Exchange Rate Changes:**
- `onHeaderExchangeRateChange()` is called
- All amounts convert to selected currency
- Total displays in new currency

---

## 🔄 Real-World Examples

### Example 1: UAE Company - Standard Flow

**Company Config:**
```json
{
  "currency": {
    "code": "AED",
    "symbol": "AED",
    "position": "before"
  }
}
```

**User Actions:**

| Step | Action | Default Currency | Default Rate |
|------|--------|-----------------|--------------|
| 1 | Opens new invoice directly | **AED** ✅ | **1** ✅ |
| 2 | User changes to USD | **USD** 👤 | 1 (user must update) |
| 3 | User sets rate to 3.67 | USD | **3.67** 👤 |

### Example 2: Booking with Mixed Currencies

**Booking Rates:**
- Charge 1: Freight in **USD** at rate 3.67
- Charge 2: Handling in **AED** at rate 1

**User Generates Invoice:**

| Step | Action | Modal Shows |
|------|--------|-------------|
| 1 | Selects Charge 1 (USD) | Currency: **USD**, Rate: **3.67** |
| 2 | User keeps USD | Amounts stay in USD |
| 3 | User changes to AED | System prompts to update rate |
| 4 | User sets rate to 1 | All amounts convert to AED |

### Example 3: Override Company Default

**Company Config:** Home currency is **INR**

**User Actions:**

| Scenario | Default | User Override | Result |
|----------|---------|---------------|--------|
| New invoice | INR @ 1 | Changes to **USD** @ 83.5 | Invoice in USD |
| Booking charge in EUR | EUR @ 90.2 | Keeps EUR | Invoice in EUR |
| Booking charge in EUR | EUR @ 90.2 | Changes to **INR** @ 1 | Invoice in INR |

---

## 🎨 UI Components

### Invoice Entry Form
```
┌─────────────────────────────────────┐
│ Currency: [AED ▼]  ← User can change
│ Ex Rate:  [1.0000] ← User can change
└─────────────────────────────────────┘
```

### Invoice Generation Modal (Booking)
```
┌─────────────────────────────────────────────┐
│ Invoice Header                               │
├─────────────────────────────────────────────┤
│ Billing Currency: [AED ▼]  ← User can change│
│ Exchange Rate:    [1.0000] ← User can change│
│ Invoice Currency: AED      ← Read-only      │
├─────────────────────────────────────────────┤
│ [Charge List with tax groups]               │
├─────────────────────────────────────────────┤
│ Total (AED): 1,234.56                       │
│              @ 1.0000                        │
└─────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Setting Company Home Currency

**Path:** `/master/company/:id/config`

**Set Currency:**
```json
{
  "systemSettings": {
    "currency": {
      "code": "AED",        // ← This becomes default
      "symbol": "AED",
      "position": "before",
      "decimalPlaces": 2
    }
  }
}
```

### Supported Currencies

The system supports all currencies in the `CurrencyMaster` table:
- USD (US Dollar)
- EUR (Euro)
- AED (UAE Dirham)
- INR (Indian Rupee)
- GBP (British Pound)
- SAR (Saudi Riyal)
- QAR (Qatari Riyal)
- ...and more

---

## ✅ Key Benefits

| Benefit | Description |
|---------|-------------|
| 🎯 **Smart Defaults** | Automatically sets the most appropriate currency |
| ⚡ **Time Saving** | Users don't need to select currency every time |
| 🔄 **Flexible** | Users can always override when needed |
| 🌍 **Multi-Currency** | Seamlessly supports international business |
| 💰 **Accurate Conversion** | Real-time conversion with user-defined rates |

---

## 🐛 Troubleshooting

### Issue: Wrong Currency Showing as Default

**Check:**
1. Company configuration at `/master/company/:id/config`
2. Verify `systemSettings.currency.code` is set correctly
3. Clear localStorage and re-login

### Issue: Can't Change Currency in Modal

**Check:**
1. Ensure `currencyList` is loaded (check browser console)
2. Verify ng-select is not disabled
3. Check browser console for JavaScript errors

### Issue: Exchange Rate Not Updating

**Check:**
1. Verify `onHeaderExchangeRateChange()` is being called
2. Check that the input is not read-only
3. Ensure `invoiceHeaderExchangeRate` model is bound correctly

---

## 📝 Summary

**Default Currency Logic:**
```
New Invoice:
  DEFAULT = Company Home Currency @ Rate 1
  USER_CAN_CHANGE = Yes (in form)

Invoice from Booking:
  DEFAULT = Charge Currency > Company Currency > null
  USER_CAN_CHANGE = Yes (in modal)
```

**User Override:**
- ✅ **Always allowed**
- 🎯 **Easy to use** (dropdown + input)
- 🔄 **Real-time updates** (calculations adjust immediately)
- 💾 **Saved to invoice** (persisted in VoucherHeader)

The system provides **intelligent defaults** while maintaining **full user control**! 🎉
