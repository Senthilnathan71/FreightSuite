import {
  HblPdfData,
  generateHblDocument,
} from './hbl-pdf.generator';

interface AllHblTransformOptions {
  company?: any;
  branch?: any;
  userData?: any;
  currentDate?: Date;
  currentBranchCityName?: string | null;
  agentList?: any[];
  masterJobData?: any;
  isDraft?: boolean;
  title?: string;
}

function fmtDate(value: any): string {
  if (!value) return '';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

function cleanJoin(parts: any[], sep: string): string {
  return parts
    .map((p) => (p ?? '').toString().trim())
    .filter(Boolean)
    .join(sep);
}

export function transformAllHblItemApiData(
  houseJobData: any,
  options: AllHblTransformOptions,
  logo?: string,
): HblPdfData {
  const products = houseJobData?.Products || [];

  const agentName = (agentSid: number): string => {
    const found = (options?.agentList || []).find(
      (x: any) => x?.CustomerMasterSid == agentSid,
    );
    return found?.CustomerName || '';
  };

  const rows = products.map((rate: any) => ({
    containerInfo: cleanJoin(
      [
        rate?.ContainerNo,
        houseJobData?.masterJob?.containers?.[0]?.LineSeal,
        houseJobData?.Cargo?.[0]?.MarksAndNumber,
      ],
      ' / ',
    ),
    packageInfo: cleanJoin(
      [
        rate?.ExternlQty,
        houseJobData?.Cargo?.[0]?.CommodityDescription,
        rate?.ExternaPkg,
      ],
      ' / ',
    ),
    grossWeight: Number(rate?.GrossWeight) || 0,
    volume: Number(rate?.Volume) || 0,
  }));

  const totalGrossWeight = rows.reduce(
    (sum: number, item: any) => sum + (Number(item?.grossWeight) || 0),
    0,
  );
  const totalVolume = rows.reduce(
    (sum: number, item: any) => sum + (Number(item?.volume) || 0),
    0,
  );

  const branchCityLine = cleanJoin(
    [
      options?.currentBranchCityName || options?.branch?.cityMaster?.cityName,
      options?.branch?.postalCode || options?.branch?.ZipCode,
      options?.branch?.phoneNumber || options?.branch?.Phone,
    ],
    ', ',
  );

  const isDraft = options?.isDraft === true;
  const title = options?.title || (isDraft
    ? 'House Bill of Lading'
    : `House Bill of Lading - ${houseJobData?.Others?.[0]?.ReleaseType || ''}`.trim());

  return {
    isDraft,
    title,
    billNo: houseJobData?.HBLNo || '',
    shipperName: houseJobData?.ShipperName || '',
    shipperAddress: houseJobData?.ShipperAddress || '',
    consigneeName: houseJobData?.ConsigneeName || '',
    consigneeAddress: houseJobData?.ConsigneeAddress || '',
    notifyName: houseJobData?.Notify || '',
    notifyAddress: houseJobData?.NotifyAddress || '',
    deliveryAgent: agentName(houseJobData?.DestinationAgent),
    placeOfReceipt: houseJobData?.POO || '',
    portOfLoading: houseJobData?.POL || '',
    jobNo: houseJobData?.HBLNo || '',
    jobRef: houseJobData?.Others?.[0]?.CustomerRefNo || '',
    vesselVoyage: cleanJoin([houseJobData?.VesselName, houseJobData?.VoyageNo], ' / '),
    portOfDischarge: houseJobData?.POD || '',
    placeOfDelivery: houseJobData?.Others?.[0]?.DeliveryPlace || '',
    noOfBill: (options?.masterJobData?.NoofOriginal ?? houseJobData?.masterJob?.NoofOriginal ?? '').toString(),
    companyName: options?.company?.companyName || '',
    branchName: options?.branch?.branchName || '',
    branchAddressLine1: options?.branch?.addressLine1 || '',
    branchAddressLine2: options?.branch?.addressLine2 || '',
    branchCityLine,
    logo,
    containers: rows,
    totalGrossWeight,
    totalVolume,
    totalContainers: (houseJobData?.Cargo?.[0]?.NoofContainers ?? '').toString(),
    onboardDate: fmtDate(houseJobData?.masterJob?.others?.[0]?.SOBDate || options?.masterJobData?.others?.[0]?.SOBDate),
    carrierSignCompany: options?.company?.companyName || '',
    printedBy: options?.userData?.userName || '',
    printedOn: fmtDate(options?.currentDate || new Date()),
  };
}

export function generateAllHblDocument(items: HblPdfData[]): any {
  const content: any[] = [];
  const draftPages = new Set<number>();

  items.forEach((item, index) => {
    const singleDoc = generateHblDocument(item);
    const section = (singleDoc?.content || []).map((node: any, idx: number) => {
      if (index > 0 && idx === 0) {
        return { ...node, pageBreak: 'before' };
      }
      return node;
    });

    // One HBL block is generated as one page in this flow.
    if (item?.isDraft) {
      draftPages.add(index + 1);
    }

    content.push(...section);
  });

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [14, 12, 14, 12],
    defaultStyle: {
      fontSize: 9,
    },
    background: (currentPage: number, pageSize: any) => {
      if (!draftPages.has(currentPage)) {
        return null;
      }

      return {
        canvas: [
          {
            type: 'rect',
            x: 10,
            y: 10,
            w: pageSize.width - 20,
            h: pageSize.height - 20,
            lineWidth: 1,
            lineColor: '#000',
          },
        ],
      };
    },
    content,
  };
}

