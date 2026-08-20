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

}