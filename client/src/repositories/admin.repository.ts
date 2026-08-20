import Admin from "../models/admin";
import Menu from "../models/menu";

export class AdminRepository {


    async getOne() {
        return await Admin.findOne();
    }


    async createMenu(menuData: {
        name: string;
        flavour: string;
        price: number;
        weight: string;
        description?: string;
        image?: string;
        available?: boolean;
    }) {
        const duplicate = await Menu.findOne({
            name: {
                $regex: `^${menuData.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
            flavour: {
                $regex: `^${menuData.flavour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
            weight: {
                $regex: `^${menuData.weight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
        }).lean();

        if (duplicate) {
            throw new Error("DUPLICATE_MENU");
        }

        return await Menu.create(menuData);
    }


    async getMenuLists({
        page,
        limit,
        search,
    }: {
        page: number;
        limit: number;
        search: string;
    }) {
        const query = search
            ? {
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: "i",
                        },
                    },
                    {
                        flavour: {
                            $regex: search,
                            $options: "i",
                        },
                    },
                ],
            }
            : {};

        const [data, totalItems] = await Promise.all([
            Menu.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Menu.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit,
            },
        };
    }


    async updateMenu(
        id: string,
        updateData: Record<string, unknown>
    ) {

        const currentMenu = await Menu.findById(id).lean();

        if (!currentMenu) {
            return null;
        }

        const duplicateQuery = {
            _id: { $ne: id },
            name: updateData.name ?? currentMenu.name,
            flavour: updateData.flavour ?? currentMenu.flavour,
            weight: updateData.weight ?? currentMenu.weight,
        };

        const duplicate = await Menu.findOne(duplicateQuery).lean();

        if (duplicate) {
            throw new Error("DUPLICATE_MENU");
        }

        return await Menu.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date(),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).lean();
    }




    async deleteMenu(id: string) {
        return await Menu.findByIdAndDelete(id).lean();
    }


    async updateMenuAvailability(
        id: string,
        available: boolean
    ) {
        return await Menu.updateOne(
            { _id: id },
            {
                $set: {
                    available: available,
                    updatedAt: new Date(),
                },
            }
        );
    }



}