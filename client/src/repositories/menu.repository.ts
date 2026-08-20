import Menu from "../models/menu";

export interface CreateMenuPayload {
    name: string;
    flavour: string;
    price: number;
    weight: string;
    description?: string;
    image?: string;
    available?: boolean;
}

export class MenuRepository {

    // Get All Menu
    async getAll() {
        return await Menu.find();
    }

    // Get Menu By Id
    async getById(id: string) {
        return await Menu.findById(id);
    }


    async checkMenuAvailability(menuId: string) {
    const menu = await Menu.findOne({
      _id: menuId,
    }).lean();

    if (!menu) {
      return null;
    }

    return {
      _id: menu._id,
      name: menu.name,
      available: menu.available !== false,
    };
  }

}