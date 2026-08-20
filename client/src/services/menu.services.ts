import connectDB from "../lib/mongoose";
import { MenuRepository } from "../repositories/menu.repository";



// CREATE INSTANCE FOR MENU REPOSITORIES
const menuRepo = new MenuRepository()


export async function getMenu() {
    // CONNECT DB
    await connectDB()

    // CREATE MENU
    return await menuRepo.getAll()
}


export async function checkMenuAvailability(menuId: string) {
  await connectDB();

  return await menuRepo.checkMenuAvailability(menuId);
}