import {cloudinary, isCloudinaryConfigured} from "../config/cloudinary";
import prisma from "../config/prisma";
import {ApiError} from "../middlewares/errorMiddleware";
import {ProductInput} from "../validators/productValidator";

export const uploadProductImage = (fileBuffer: Buffer): Promise<string> => {
  if (!isCloudinaryConfigured) {
    return Promise.reject(
      new ApiError(503, "Cloudinary belum dikonfigurasi di file environment"),
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {folder: "restoku/products"},
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(
              new ApiError(502, "Gagal upload gambar ke Cloudinary"),
            );
          }

          if (!result?.secure_url) {
            return reject(
              new ApiError(502, "Cloudinary tidak mengembalikan URL gambar"),
            );
          }

          resolve(result.secure_url);
        },
      );

      uploadStream.end(fileBuffer);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      reject(new ApiError(502, "Gagal memulai upload ke Cloudinary"));
    }
  });
};

export const createProduct = async (
  data: ProductInput,
  fileBuffer?: Buffer,
) => {
  const category = await prisma.category.findUnique({
    where: {id: data.categoryId},
  });

  if (!category) {
    throw new ApiError(404, "Category tidak ditemukan");
  }

  const image = fileBuffer ? await uploadProductImage(fileBuffer) : data.image;

  return prisma.product.create({data: {...data, image}});
};

export const getProducts = async (isStaff: boolean) => {
  return prisma.product.findMany({
    where: isStaff ? {} : {isAvailable: true},
    include: {
      category: {select: {id: true, name: true}},
    },
    orderBy: {createdAt: "desc"},
  });
};

export const getProductById = async (id: string, isStaff: boolean) => {
  const product = await prisma.product.findUnique({
    where: {id},
    include: {
      category: {select: {id: true, name: true}},
    },
  });

  if (!product) {
    throw new ApiError(404, "Product tidak ditemukan");
  }

  if (!isStaff && !product.isAvailable) {
    throw new ApiError(404, "Product tidak ditemukan");
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: ProductInput,
  fileBuffer?: Buffer,
) => {
  const product = await prisma.product.findUnique({where: {id}});

  if (!product) {
    throw new ApiError(404, "Product tidak ditemukan");
  }

  const category = await prisma.category.findUnique({
    where: {id: data.categoryId},
  });

  if (!category) {
    throw new ApiError(404, "Category tidak ditemukan");
  }

  const image = fileBuffer ? await uploadProductImage(fileBuffer) : data.image;

  return prisma.product.update({where: {id}, data: {...data, image}});
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: {id},
  });

  if (!product) {
    throw new ApiError(404, "Product tidak ditemukan");
  }

  const orderItemCount = await prisma.orderItem.count({
    where: {
      productId: id,
    },
  });

  if (orderItemCount > 0) {
    throw new ApiError(
      409,
      "Product tidak bisa dihapus karena sudah pernah digunakan dalam pesanan",
    );
  }

  await prisma.product.delete({
    where: {id},
  });
};

export const updateAvailability = async (id: string, isAvailable: boolean) => {
  const product = await prisma.product.findUnique({where: {id}});

  if (!product) {
    throw new ApiError(404, "Product tidak ditemukan");
  }

  return prisma.product.update({where: {id}, data: {isAvailable}});
};
