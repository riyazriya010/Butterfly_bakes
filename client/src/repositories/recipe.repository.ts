// RECIPE
import { ObjectId } from "mongodb";
import { Readable } from "stream";

import Recipe from "../models/recipe";
import { getRecipeBucket } from "../lib/gridfs";


export interface RecipeListParams {
    page: number;
    limit: number;
    search?: string;
}


function escapeRecipeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}



export class RecipesRepository {

    // GET RECIPE LIST WITH SEARCH AND PAGINATION
    async getRecipeLists({
        page,
        limit,
        search = "",
    }: RecipeListParams) {
        const filter: Record<string, unknown> = {};

        if (search.trim()) {
            const regex = new RegExp(
                escapeRecipeRegex(search.trim()),
                "i"
            );

            filter.$or = [
                { title: regex },
                { fileName: regex },
                { description: regex },
            ];
        }

        const skip = (page - 1) * limit;

        const [recipes, totalItems] = await Promise.all([
            Recipe.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .select(
                    "title description fileName contentType fileSize createdAt"
                )
                .lean(),

            Recipe.countDocuments(filter),
        ]);

        return {
            data: recipes.map((recipe) => ({
                _id: recipe._id.toString(),
                title: recipe.title,
                description: recipe.description,
                fileName: recipe.fileName,
                contentType: recipe.contentType,
                fileSize: recipe.fileSize,
                createdAt: recipe.createdAt,
                fileUrl: `/api/admin/recipes/${recipe._id}/file`,
            })),

            pagination: {
                currentPage: page,
                totalPages: Math.max(
                    1,
                    Math.ceil(totalItems / limit)
                ),
                totalItems,
                limit,
            },
        };
    }



    // FIND RECIPE BY ID
    async getRecipeById(id: string) {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        return Recipe.findById(id).lean();
    }

    // GET RECIPE PDF STREAM
    getRecipeFileStream(gridFsId: ObjectId) {
        return getRecipeBucket().openDownloadStream(gridFsId);
    }

}