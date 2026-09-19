import prisma from "../config/prisma";
import {ApiError} from "../middlewares/errorMiddleware";
import {CategoryInput} from "../validators/categoryValidator";

export const createCategory = async (data: CategoryInput) => {
  return prisma.category.create({data});
};

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: {name: "asc"},
  });
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({where: {id}});

  if (!category) {
    throw new ApiError(404, "Category tidak ditemukan");
  }

  return category;
};

export const updateCategory = async (id: string, data: CategoryInput) => {
  const category = await prisma.category.findUnique({where: {id}});

  if (!category) {
    throw new ApiError(404, "Category tidak ditemukan");
  }

  return prisma.category.update({where: {id}, data});
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {id},
    include: {products: true},
  });

  if (!category) {
    throw new ApiError(404, "Category tidak ditemukan");
  }

  if (category.products.length > 0) {
    throw new ApiError(
      409,
      "Category tidak dapat dihapus karena masih memiliki product. Pindahkan atau hapus product tersebut terlebih dahulu",
    );
  }

  await prisma.category.delete({where: {id}});
};
