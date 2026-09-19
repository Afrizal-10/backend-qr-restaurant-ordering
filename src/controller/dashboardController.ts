import {Request, Response, NextFunction} from "express";
import * as dashboardService from "../services/dashboardService";
import * as reportService from "../services/reportService";
import {ApiError} from "../middlewares/errorMiddleware";

// Get dashboard summary
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const summary = await dashboardService.getSummary();

    res.status(200).json({
      success: true,
      message: "Ringkasan dashboard berhasil diambil",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// Get sales chart data (default: 7 hari terakhir)
export const getSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const days = Number(req.query.days) || 7;
    const sales = await dashboardService.getSalesChart(days);

    res.status(200).json({
      success: true,
      message: "Data sales chart berhasil diambil",
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

// Get top products (default: 5 produk terlaris)
export const getTopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const topProducts = await dashboardService.getTopProducts(limit);

    res.status(200).json({
      success: true,
      message: "Top product berhasil diambil",
      data: topProducts,
    });
  } catch (error) {
    next(error);
  }
};

// Get recent orders (default: 10 order terbaru)
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const orders = await dashboardService.getRecentOrders(limit);

    res.status(200).json({
      success: true,
      message: "Order terbaru berhasil diambil",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Get cashier dashboard (untuk role cashier)
export const getCashierDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dashboard = await dashboardService.getCashierDashboard();

    res.status(200).json({
      success: true,
      message: "Dashboard cashier berhasil diambil",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: parse startDate dan endDate dari query string
const parseDateRange = (query: Request["query"]) => {
  const {startDate: rawStart, endDate: rawEnd} = query;

  if (!rawStart || !rawEnd) {
    throw new ApiError(
      400,
      "startDate dan endDate wajib diisi (format: YYYY-MM-DD)",
    );
  }

  const startDate = new Date(`${rawStart}T00:00:00`);
  const endDate = new Date(`${rawEnd}T23:59:59`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ApiError(
      400,
      "Format startDate/endDate tidak valid (pakai YYYY-MM-DD)",
    );
  }

  if (startDate > endDate) {
    throw new ApiError(400, "startDate tidak boleh lebih besar dari endDate");
  }

  return {startDate, endDate};
};

// Export laporan penjualan ke Excel
export const exportExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {startDate, endDate} = parseDateRange(req.query);
    const report = await dashboardService.getSalesReportData(
      startDate,
      endDate,
    );
    const buffer = await reportService.generateSalesReportExcel(report);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="laporan-penjualan.xlsx"`,
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Export laporan penjualan ke PDF
export const exportPdf = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {startDate, endDate} = parseDateRange(req.query);
    const report = await dashboardService.getSalesReportData(
      startDate,
      endDate,
    );
    const buffer = await reportService.generateSalesReportPdf(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="laporan-penjualan.pdf"`,
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
