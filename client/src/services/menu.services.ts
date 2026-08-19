import connectDB from "../lib/mongoose";
import { CreateMenuPayload, MenuRepository } from "../repositories/menu.repository";


// CREATE INSTANCE FOR MENU REPOSITORIES
const menuRepo = new MenuRepository()

export async function createMenu(data: CreateMenuPayload) {
    // CONNECT DB
    await connectDB()

    // CREATE MENU
    return await menuRepo.create(data)
}


export async function getMenu() {
    // CONNECT DB
    await connectDB()

    // CREATE MENU
    return await menuRepo.getAll()
}