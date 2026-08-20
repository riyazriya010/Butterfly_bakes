import connectDB from "../lib/mongoose";
import { AdminRepository } from "../repositories/admin.repository";

const adminRepo = new AdminRepository()

export async function getAdmin() {
    // CONNECT DB
    await connectDB()

    return await adminRepo.getOne()
}


export async function createMenu(menuData: {
  name: string;
  flavour: string;
  price: number;
  weight: string;
  description?: string;
  image?: string;
  available?: boolean;
}) {
  await connectDB();

  return await adminRepo.createMenu(menuData);
}


export async function getMenuList({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search: string;
}) {
  await connectDB();

  return await adminRepo.getMenuLists({
    page,
    limit,
    search,
  });
}


export async function updateMenu(
  id: string,
  updateData: Record<string, unknown>
) {
  await connectDB();

  return await adminRepo.updateMenu(id, updateData);
}


export async function deleteMenu(id: string) {
  await connectDB();

  return await adminRepo.deleteMenu(id);
}



export async function updateMenuAvailability(
  id: string,
  available: boolean
) {
  await connectDB();
 
  return await adminRepo.updateMenuAvailability(
    id,
    available
  );
}