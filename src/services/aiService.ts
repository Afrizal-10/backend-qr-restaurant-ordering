import {Content, FunctionDeclaration} from "@google/genai";
import {gemini, GEMINI_MODEL} from "../config/gemini";
import {ApiError} from "../middlewares/errorMiddleware";
import * as dashboardService from "./dashboardService";
import * as tableService from "./tableService";
import * as productService from "./productService";
import * as categoryService from "./categoryService";

type Role = "ADMIN" | "CASHIER";
type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

const TOOLS: Record<
  string,
  {declaration: FunctionDeclaration; handler: ToolHandler}
> = {
  get_dashboard_summary: {
    declaration: {
      name: "get_dashboard_summary",
      description:
        "Ambil ringkasan dashboard admin: revenue hari ini, jumlah order hari ini, jumlah meja tersedia/terisi, total product.",
      parametersJsonSchema: {type: "object", properties: {}},
    },
    handler: async () => dashboardService.getSummary(),
  },
  get_sales_chart: {
    declaration: {
      name: "get_sales_chart",
      description:
        "Ambil data penjualan (revenue) per hari untuk beberapa hari terakhir.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Jumlah hari ke belakang, default 7",
          },
        },
      },
    },
    handler: async (args) =>
      dashboardService.getSalesChart(Number(args.days) || 7),
  },
  get_top_products: {
    declaration: {
      name: "get_top_products",
      description:
        "Ambil daftar product dengan jumlah terjual terbanyak (all-time).",
      parametersJsonSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Jumlah product teratas, default 5",
          },
        },
      },
    },
    handler: async (args) =>
      dashboardService.getTopProducts(Number(args.limit) || 5),
  },
  get_recent_orders: {
    declaration: {
      name: "get_recent_orders",
      description:
        "Ambil daftar order terbaru beserta status dan info pembayarannya.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Jumlah order terbaru, default 10",
          },
        },
      },
    },
    handler: async (args) =>
      dashboardService.getRecentOrders(Number(args.limit) || 10),
  },
  get_sales_recap: {
    declaration: {
      name: "get_sales_recap",
      description:
        "Ambil rekap total revenue dan jumlah order untuk periode kalender tertentu: hari ini, minggu ini (Senin-sekarang), bulan ini (tanggal 1-sekarang), atau tahun ini (1 Januari-sekarang). Pakai ini kalau user tanya rekapan/ringkasan penjualan per hari/minggu/bulan/tahun.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["day", "week", "month", "year"],
            description:
              "Periode rekap: 'day' (hari ini), 'week' (minggu ini), 'month' (bulan ini), 'year' (tahun ini)",
          },
        },
        required: ["period"],
      },
    },
    handler: async (args) => {
      const period = args.period as "day" | "week" | "month" | "year";
      return dashboardService.getSalesRecap(period || "day");
    },
  },
  get_cashier_dashboard: {
    declaration: {
      name: "get_cashier_dashboard",
      description:
        "Ambil data operasional harian: jumlah order pending/preparing/ready, order hari ini, revenue hari ini, meja terisi.",
      parametersJsonSchema: {type: "object", properties: {}},
    },
    handler: async () => dashboardService.getCashierDashboard(),
  },
  get_tables: {
    declaration: {
      name: "get_tables",
      description:
        "Ambil daftar semua meja beserta status (AVAILABLE/OCCUPIED) dan kapasitasnya.",
      parametersJsonSchema: {type: "object", properties: {}},
    },
    handler: async () => tableService.getTables(),
  },
  get_products: {
    declaration: {
      name: "get_products",
      description:
        "Ambil daftar semua product/menu beserta harga dan status ketersediaannya.",
      parametersJsonSchema: {type: "object", properties: {}},
    },
    handler: async () => productService.getProducts(true),
  },
  get_categories: {
    declaration: {
      name: "get_categories",
      description: "Ambil daftar semua kategori menu.",
      parametersJsonSchema: {type: "object", properties: {}},
    },
    handler: async () => categoryService.getCategories(),
  },
};

const TOOLS_BY_ROLE: Record<Role, string[]> = {
  ADMIN: [
    "get_dashboard_summary",
    "get_sales_chart",
    "get_sales_recap",
    "get_top_products",
    "get_recent_orders",
    "get_cashier_dashboard",
    "get_tables",
    "get_products",
    "get_categories",
  ],
  CASHIER: [
    "get_cashier_dashboard",
    "get_recent_orders",
    "get_tables",
    "get_products",
    "get_categories",
  ],
};

const SYSTEM_INSTRUCTION_BASE = `
Kamu adalah asisten AI untuk "Restoku" - Real-Time QR Restaurant Ordering System.

Tentang sistem ini:

- Konsep: customer scan QR Code di meja, lihat menu, pesan, bayar (CASH atau QRIS), tanpa perlu bikin akun.
- Tech stack backend: Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, JWT + bcrypt (auth), Zod (validasi), Socket.IO (real-time), Midtrans (payment gateway QRIS), Cloudinary (upload gambar product).
- Database utama: users, categories, products, tables, orders, order_items, payments, order_status_histories.
- Alur status order: PENDING -> CONFIRMED -> PREPARING -> READY -> SERVED -> COMPLETED (atau CANCELLED dari PENDING/CONFIRMED).

ATURAN PENTING:

- Kamu HANYA boleh membaca data lewat fungsi (tools) yang disediakan.
- Kamu TIDAK PERNAH bisa membuat, mengubah, atau menghapus data apa pun.
- Kalau user tanya soal data, panggil fungsi yang sesuai terlebih dahulu.
- Jangan mengarang angka atau informasi dari database.

ATURAN FORMAT JAWABAN:

- Gunakan bahasa Indonesia yang natural seperti asisten aplikasi.
- Jawaban harus rapi, singkat, dan mudah dibaca.
- Jangan gunakan Markdown bold.
- Jangan gunakan backtick untuk nama tabel, field, atau istilah.
- Jangan gunakan heading Markdown.
- Jangan gunakan simbol Markdown yang tidak diperlukan.
- Untuk daftar gunakan tanda strip jika memang diperlukan.
- Gunakan paragraf biasa untuk jawaban sederhana.
- Jangan terlalu banyak membuat daftar.
- Jangan mengulang pertanyaan user.`;

const SYSTEM_INSTRUCTION_BY_ROLE: Record<Role, string> = {
  ADMIN: `${SYSTEM_INSTRUCTION_BASE}
Kamu sedang bicara dengan ADMIN. Admin bisa: kelola kategori & product, kelola meja & QR, kelola akun cashier, dan lihat semua data bisnis (revenue, sales chart, top product, dll). Kalau admin minta rekap/ringkasan penjualan per hari/minggu/bulan/tahun, pakai fungsi get_sales_recap dengan period yang sesuai. Bantu admin memahami cara pakai sistem dan menjawab pertanyaan seputar data bisnis mereka.`,
  CASHIER: `${SYSTEM_INSTRUCTION_BASE}
Kamu sedang bicara dengan CASHIER. Cashier bisa: lihat & konfirmasi order, ubah status order, lihat meja, konfirmasi pembayaran cash. Cashier TIDAK bisa kelola product/kategori/meja/akun user - kalau ditanya soal itu, jelaskan itu wewenang admin.`,
};

export const chat = async (message: string, role: Role): Promise<string> => {
  const allowedToolNames = TOOLS_BY_ROLE[role];
  const functionDeclarations = allowedToolNames.map(
    (name) => TOOLS[name].declaration,
  );

  const contents: Content[] = [{role: "user", parts: [{text: message}]}];

  const config = {
    systemInstruction: SYSTEM_INSTRUCTION_BY_ROLE[role],
    tools: [{functionDeclarations}],
  };

  let response;

  try {
    response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config,
    });
  } catch (error) {
    throw new ApiError(500, "Gagal menghubungi Gemini API");
  }

  const functionCalls = response.functionCalls;

  if (functionCalls && functionCalls.length > 0) {
    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new ApiError(500, "Respons function call Gemini tidak valid");
    }

    contents.push(modelContent);

    const functionResponseParts = await Promise.all(
      functionCalls.map(async (call) => {
        const tool = call.name ? TOOLS[call.name] : undefined;

        if (!tool || !call.name || !allowedToolNames.includes(call.name)) {
          return {
            functionResponse: {
              name: call.name ?? "unknown",
              response: {
                error:
                  "Fungsi tidak dikenali atau tidak diizinkan untuk role ini",
              },
            },
          };
        }

        const result = await tool.handler(call.args || {});

        return {
          functionResponse: {
            name: call.name,
            ...(call.id ? {id: call.id} : {}),
            response: {
              result,
            },
          },
        };
      }),
    );

    contents.push({
      role: "user",
      parts: functionResponseParts,
    });

    try {
      response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config,
      });
    } catch (error: any) {
      console.error("GEMINI SECOND REQUEST ERROR:", {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        error,
      });

      throw new ApiError(500, "Gagal memproses hasil dari Gemini API");
    }
  }

  return response.text || "Maaf, saya tidak bisa menjawab itu sekarang.";
};
