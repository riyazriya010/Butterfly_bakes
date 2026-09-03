import Admin from "../models/admin";
import Menu from "../models/menu";
import CakeVariant from "../models/variant";


interface CreateMenuData {
    name: string;
    flavour: string;
    weight: number;
    price: number;
    description?: string;
    available?: boolean;
}

export class AdminRepository {


    async getOne() {
        return await Admin.findOne();
    }


    // async createMenu(menuData: {
    //     name: string;
    //     flavour: string;
    //     price: number;
    //     weight: string;
    //     description?: string;
    //     image?: string;
    //     available?: boolean;
    // }) {
    //     const duplicate = await Menu.findOne({
    //         name: {
    //             $regex: `^${menuData.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    //             $options: "i",
    //         },
    //         flavour: {
    //             $regex: `^${menuData.flavour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    //             $options: "i",
    //         },
    //         weight: {
    //             $regex: `^${menuData.weight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    //             $options: "i",
    //         },
    //     }).lean();

    //     if (duplicate) {
    //         throw new Error("DUPLICATE_MENU");
    //     }

    //     return await Menu.create(menuData);
    // }


    async createMenu(
        menuData: CreateMenuData
    ) {
        const escapeRegex = (value: string) =>
            value.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        // --------------------------------------------------
        // CHECK DUPLICATE MENU
        // --------------------------------------------------

        const duplicateMenu =
            await Menu.findOne({
                name: {
                    $regex: `^${escapeRegex(
                        menuData.name
                    )}$`,
                    $options: "i",
                },

                flavour: {
                    $regex: `^${escapeRegex(
                        menuData.flavour
                    )}$`,
                    $options: "i",
                },
            });

        if (duplicateMenu) {
            throw new Error(
                "DUPLICATE_MENU"
            );
        }

        // --------------------------------------------------
        // CREATE MENU
        // --------------------------------------------------

        const menu = await Menu.create({
            name: menuData.name,
            flavour: menuData.flavour,
            description:
                menuData.description || "",
            available:
                menuData.available ?? true,
        });

        // --------------------------------------------------
        // CREATE FIRST VARIANT
        // --------------------------------------------------

        await CakeVariant.create({
            cakeId: menu._id,
            cakeName: menu.name,
            weight: menuData.weight,
            price: menuData.price,
            available: true,
        });

        return menu;
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
            // weight: updateData.weight ?? currentMenu.weight,
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
        const menu = await Menu.findById(id).lean();

        if (!menu) {
            return null;
        }

        await CakeVariant.deleteMany({
            cakeId: id,
        });

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



    // ---------------------------------  VARIANTS  ----------------------------

    // create variant
    async createVariant(variantData: {
        cakeId: string;
        cakeName: string;
        price: number;
        weight: number;
        available?: boolean;
    }) {
        const duplicate = await CakeVariant.findOne({
            cakeId: variantData.cakeId,
            weight: variantData.weight,
        }).lean();

        if (duplicate) {
            throw new Error("DUPLICATE_VARIANT");
        }

        return await CakeVariant.create({
            cakeId: variantData.cakeId,
            cakeName: variantData.cakeName,
            weight: variantData.weight,
            price: variantData.price,
            available: variantData.available ?? true,
        });
    }

    // get all variants
    async getVariantLists({
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
                        cakeName: {
                            $regex: search,
                            $options: "i",
                        },
                    }
                ],
            }
            : {};

        const [data, totalItems] = await Promise.all([
            CakeVariant.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            CakeVariant.countDocuments(query),
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

    async updateVariant(
        id: string,
        updateData: {
            weight?: number;
            price?: number;
            available?: boolean;
        }
    ) {
        try {
            return await CakeVariant.findByIdAndUpdate(
                id,
                {
                    $set: updateData,
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).lean();
        } catch (error: any) {
            if (error?.code === 11000) {
                throw new Error("DUPLICATE_VARIANT");
            }

            throw error;
        }
    }


    async toggleVariantAvailability(
        id: string
    ) {
        const variant = await CakeVariant.findById(id).select(
            "available"
        );

        if (!variant) {
            return null;
        }

        // Count variants belonging to this cake
        const variantCount = await CakeVariant.countDocuments({
            cakeId: variant.cakeId,
        });

        // Every cake must have at least one variant
        if (variantCount <= 1) {
            throw new Error("MINIMUM_ONE_VARIANT_REQUIRED");
        }

        variant.available = !variant.available;

        await variant.save();

        return variant.toObject();
    }


    async deleteVariant(id: string) {
        const variant = await CakeVariant.findById(id)
            .select("cakeId");

        if (!variant) {
            return null;
        }

        // Count variants belonging to this cake
        const variantCount = await CakeVariant.countDocuments({
            cakeId: variant.cakeId,
        });

        // Every cake must have at least one variant
        if (variantCount <= 1) {
            throw new Error("MINIMUM_ONE_VARIANT_REQUIRED");
        }

        return await CakeVariant.findByIdAndDelete(id).lean();
    }



}