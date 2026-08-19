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
    // Create Menu
    async create(data: CreateMenuPayload) {
        return await Menu.create(data);
    }

    // Get All Menu
    async getAll() {
        return await Menu.find();
    }

    // Get Menu By Id
    async getById(id: string) {
        return await Menu.findById(id);
    }

    // Update Menu
    async update(id: string, data: Partial<CreateMenuPayload>) {
        return await Menu.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    // Delete Menu
    async delete(id: string) {
        return await Menu.findByIdAndDelete(id);
    }

}