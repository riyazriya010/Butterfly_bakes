
import {
    Schema,
    model,
    models,
    Model,
    Types,
} from "mongoose";

export interface IRecipe {
    title: string;
    description: string;
    fileName: string;
    contentType: string;
    gridFsId: Types.ObjectId;
    fileSize: number;
    createdAt: Date;
    updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        contentType: {
            type: String,
            required: true,
            default: "application/pdf",
        },

        gridFsId: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
        },

        fileSize: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Supports title search and sorting.
RecipeSchema.index({ title: 1, createdAt: -1 });
RecipeSchema.index({ fileName: 1 });

const Recipe: Model<IRecipe> =
    models.Recipe ||
    model<IRecipe>("Recipe", RecipeSchema);

export default Recipe;
