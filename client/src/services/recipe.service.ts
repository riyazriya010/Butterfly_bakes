import { ObjectId } from "mongodb";
import connectDB from "../lib/mongoose";
import type {
    CreateRecipeData,
    RecipeListParams,
} from "../repositories/admin.repository";
import { RecipesRepository } from "../repositories/recipe.repository";

const recipeRepo = new RecipesRepository()


// GET RECIPE LIST WITH SEARCH AND PAGINATION
export async function getRecipeListService(
    params: RecipeListParams
) {
    await connectDB();

    const page = Math.max(1, Math.floor(params.page || 1));
    const limit = Math.min(
        100,
        Math.max(1, Math.floor(params.limit || 10))
    );

    return recipeRepo.getRecipeLists({
        page,
        limit,
        search: params.search?.trim() ?? "",
    });
}

// GET RECIPE BY ID
export async function getRecipeByIdService(id: string) {
    await connectDB();

    if (!ObjectId.isValid(id)) {
        throw new Error("INVALID_RECIPE_ID");
    }

    return recipeRepo.getRecipeById(id);
}

// GET RECIPE PDF STREAM
export async function getRecipeFileStreamService(id: string) {
    await connectDB();

    if (!ObjectId.isValid(id)) {
        throw new Error("INVALID_RECIPE_ID");
    }

    const recipe = await recipeRepo.getRecipeById(id);

    if (!recipe) {
        throw new Error("RECIPE_NOT_FOUND");
    }

    const stream = recipeRepo.getRecipeFileStream(recipe.gridFsId);

    return {
        recipe,
        stream,
    };
}