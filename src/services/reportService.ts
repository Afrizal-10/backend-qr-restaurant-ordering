import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

type ReportOrder = {
  orderNumber: string;
  createdAt: Date;
  table: {tableNumber: string};
  payment: {method: string; paidAt: Date | null} | null;
  items: {product: {name: string}; quantity: number; subtotal: unknown}[];
  subtotal: unknown;
  tax: unknown;
  serviceCharge: unknown;
  total: unknown;
};

type ReportData = {
  startDate: Date;
  endDate: Date;
  orders: ReportOrder[];
  summary: {totalOrders: number; totalRevenue: number};
};

const formatDate = (date: Date) => date.toLocaleDateString("id-ID");

const formatItemsText = (items: ReportOrder["items"]) =>
  items.map((item) => `${item.product.name} x${item.quantity}`).join(", ");

export const generateSalesReportExcel = async (
  report: ReportData,
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Laporan Penjualan");

  sheet.columns = [
    {header: "No. Order", key: "orderNumber", width: 22},
    {header: "Tanggal", key: "date", width: 14},
    {header: "Meja", key: "table", width: 10},
    {header: "Item", key: "items", width: 40},
    {header: "Subtotal", key: "subtotal", width: 14},
    {header: "Tax", key: "tax", width: 12},
    {header: "Service Charge", key: "serviceCharge", width: 14},
    {header: "Total", key: "total", width: 14},
    {header: "Metode Bayar", key: "method", width: 14},
  ];

  sheet.getRow(1).font = {bold: true};

  report.orders.forEach((order) => {
    sheet.addRow({
      orderNumber: order.orderNumber,
      date: formatDate(order.createdAt),
      table: order.table.tableNumber,
      items: formatItemsText(order.items),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      serviceCharge: Number(order.serviceCharge),
      total: Number(order.total),
      method: order.payment?.method || "-",
    });
  });

  sheet.addRow({});
  const summaryRow = sheet.addRow({
    orderNumber: "TOTAL",
    total: report.summary.totalRevenue,
  });
  summaryRow.font = {bold: true};

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const generateSalesReportPdf = (report: ReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({margin: 40, size: "A4", layout: "landscape"});
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text("Laporan Penjualan - Restoku", {align: "center"});
    doc
      .fontSize(10)
      .text(
        `Periode: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
        {
          align: "center",
        },
      );
    doc.moveDown(1.5);

    // Header tabel sederhana (posisi kolom manual, cukup untuk laporan simpel)
    const columnPositions = {
      orderNumber: 40,
      date: 175,
      table: 240,
      items: 290,
      total: 650,
    };
    const rowHeight = 20;
    let y = doc.y;

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("No. Order", columnPositions.orderNumber, y);
    doc.text("Tanggal", columnPositions.date, y);
    doc.text("Meja", columnPositions.table, y);
    doc.text("Item", columnPositions.items, y);
    doc.text("Total", columnPositions.total, y);
    y += rowHeight;

    doc.font("Helvetica");
    report.orders.forEach((order) => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = doc.y;
      }

      doc.text(order.orderNumber, columnPositions.orderNumber, y, {width: 130});
      doc.text(formatDate(order.createdAt), columnPositions.date, y);
      doc.text(order.table.tableNumber, columnPositions.table, y);
      doc.text(formatItemsText(order.items), columnPositions.items, y, {
        width: 370,
      });
      doc.text(
        `Rp ${Number(order.total).toLocaleString("id-ID")}`,
        columnPositions.total,
        y,
      );

      y += rowHeight;
    });

    y += 10;
    doc.font("Helvetica-Bold");
    doc.text(
      `Total Order: ${report.summary.totalOrders}`,
      columnPositions.orderNumber,
      y,
    );
    y += rowHeight;
    doc.text(
      `Total Revenue: Rp ${report.summary.totalRevenue.toLocaleString("id-ID")}`,
      columnPositions.orderNumber,
      y,
    );

    doc.end();
  });
};
