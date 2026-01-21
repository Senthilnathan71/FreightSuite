/**
 * Quotation PDF Generator
 * Generates Quotation and Contract PDFs
 */

import { QuotationPdfData, QuotationDocumentType } from '../interfaces/pdf-document.interfaces';
import { buildHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildChargesTable } from '../builders/pdf-table.builder';
import {
  buildTitle,
  buildCustomerInfo,
  buildGreeting,
  buildTermsSection,
  buildClosingMessage,
  buildSignature,
  buildRouteHeader,
  buildInfoRow
} from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
import {
  formatDate,
  getDepartmentName,
  getFormattedPort
} from '../helpers/pdf-formatters';

/**
 * Generate quotation/contract PDF document definition
 */
export function generateQuotationDocument(
  data: QuotationPdfData,
  documentType: QuotationDocumentType = 'quotation'
): any {
  const isContract = documentType === 'contract' || data.quotation?.isContract;
  const docTitle = isContract ? 'Contract' : 'Quotation';
  const docTypeLabel = isContract ? 'Contract' : 'Quotation';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || PDF_DEFAULT_CONFIG.pageMargins,
    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo),

      // Title
      buildTitle(docTitle),

      // Customer Info
      buildCustomerInfo(
        {
          customerName: data.quotation?.customerName,
          customerAddress: data.quotation?.customerAddress
        },
        {
          docNumber: data.quotation?.quoteNumber,
          docDate: data.quotation?.quoteDate,
          reference: data.quotation?.customerRef
        },
        { docTypeLabel }
      ),

      // Greeting
      buildGreeting(
        'Dear Sir/Mam,',
        'Thank you very much for the opportunity to quote for your esteemed organization.\nWe are pleased to submit our best rates as outlined below.'
      ),

      // Route Tables
      ...buildRouteTables(data),

      // Terms Section
      buildTermsSection(data.terms),

      // Closing Message
      buildClosingMessage(),

      // Signature
      buildSignature(data.userData, data.company)
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Build route tables for quotation
 */
function buildRouteTables(data: QuotationPdfData): any[] {
  const content: any[] = [];
  const routes = data.routes || [];
  const showAgreedRate = data.quotation?.agreedRate === true;

  routes.forEach((route, index) => {
    const departmentName = route.departmentName ||
      getDepartmentName(route.departmentSid, data.departments || []);

    const polPort = getFormattedPort(route.polSid, data.ports || []);
    const podPort = getFormattedPort(route.podSid, data.ports || []);
    const fdpPort = route.fdpSid && route.fdpSid !== route.podSid
      ? getFormattedPort(route.fdpSid, data.ports || [])
      : '';

    const routeLabel = fdpPort
      ? `${polPort} - ${podPort} - ${fdpPort}`
      : `${polPort} - ${podPort}`;

    // Route header
    content.push(buildRouteHeader(departmentName, routeLabel, {
      margin: [0, index > 0 ? 20 : 0, 0, 0]
    }));

    // Process each carrier
    const carriers = route.carriers || [];
    carriers.forEach(carrier => {
      const cargo = route.cargo?.[0];

      // Carrier info row
      content.push(buildInfoRow([
        { label: 'Carrier', value: carrier.carrierName || '', width: '25%' },
        { label: 'Cargo Type', value: cargo?.cargoType || '', width: '25%' },
        { label: 'Valid From', value: formatDate(route.effDate), width: '25%' },
        { label: 'Valid To', value: formatDate(route.expDate), width: '25%' }
      ]));

      // Charges table
      const charges = carrier.charges || [];
      if (charges.length > 0) {
        content.push(buildChargesTable(
          charges.map(c => ({
            ChargeDisplayName: c.chargeName,
            RevenueChargeUomSid: null,
            Qty: c.qty,
            RevenueCurrencyMasterSid: null,
            RevenueExchangeRate: c.exchangeRate,
            RevenueRate: c.rate,
            RevenueAmount: c.amount,
            RevenueLocalAmount: c.localAmount,
            unit: c.unit,
            currency: c.currency
          })),
          showAgreedRate,
          {
            currencyMaster: data.currencyMaster,
            chargeUnitMaster: data.chargeUnitMaster
          }
        ));
      }
    });
  });

  return content;
}

/**
 * Generate quotation PDF from raw API data
 * This function transforms API response data to QuotationPdfData format
 */
export function transformQuotationApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    currencyMaster?: any[];
    chargeUnitMaster?: any[];
    departments?: any[];
    ports?: any[];
  }
): QuotationPdfData {
  const quotation = apiData;
  const routes = quotation.quoteRoute || [];

  return {
    company: {
      companyName: company?.companyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      postalCode: company?.postal_code || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || branch?.ZipCode || '',
      phoneNumber: branch?.phoneNumber || branch?.Phone || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    quotation: {
      quoteNumber: quotation.QuoteNumber || '',
      quoteDate: quotation.QuoteDate,
      customerRef: quotation.CustomerRef || '',
      customerName: quotation.CustomerName || '',
      customerAddress: quotation.CustomerAddress || '',
      isContract: quotation.IsContract === 'Y',
      agreedRate: quotation.AgreedRate === 'Y'
    },
    routes: routes.map((route: any) => ({
      departmentSid: route.DepartmentMasterSid,
      polSid: route.POLSid,
      podSid: route.PODSid,
      fdpSid: route.FDPSid,
      effDate: route.effDate,
      expDate: route.expdate,
      carriers: (route.quoteCarrier || []).map((carrier: any) => ({
        carrierName: carrier.CarrierName || '',
        charges: (carrier.quoteCharge || []).map((charge: any) => ({
          chargeName: charge.ChargeDisplayName || '',
          unit: '',
          qty: charge.Qty || 0,
          currency: '',
          rate: charge.RevenueRate || 0,
          amount: charge.RevenueAmount || 0,
          exchangeRate: charge.RevenueExchangeRate,
          localAmount: charge.RevenueLocalAmount
        }))
      })),
      cargo: (route.quoteCargo || []).map((cargo: any) => ({
        cargoType: cargo.CargoType || ''
      }))
    })),
    terms: (apiData.terms || []).map((term: any) => ({
      content: term.TandC || ''
    })),
    currencyMaster: lookups?.currencyMaster || [],
    chargeUnitMaster: lookups?.chargeUnitMaster || [],
    departments: lookups?.departments || [],
    ports: lookups?.ports || []
  };
}
