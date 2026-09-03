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

export async function getMenuWithVariants(
  page: number,
  limit: number,
  search?: string
) {
  await connectDB();

  return await menuRepo.getMenuWithVariants(
    page,
    limit,
    search
  );
}


// export async function checkMenuAvailability(menuId: string) {
//   await connectDB();

//   return await menuRepo.checkMenuAvailability(menuId);
// }


export async function checkMenuAvailability(
  cakeId: string,
  variantId: string
) {
  return await menuRepo.checkMenuAvailability(
    cakeId,
    variantId
  );
}


export async function getMenuFilterOptions() {
  await connectDB();

  return await menuRepo.getMenuFilterOptions();
}


export async function getSingleCakeDetails(id: string) {
  await connectDB();

  return await menuRepo.singleCakeDetails(id)
}