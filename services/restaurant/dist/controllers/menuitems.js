import axios from "axios";
import getBuffer from "../config/datauri.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../model/Restaurant.js";
import MenuItems from "../model/MenuItems.js";
export const addMenuItem = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Please Login",
        });
    }
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            message: "No Restaurant found",
        });
    }
    const { name, description, price } = req.body;
    if (!name || !price) {
        return res.status(400).json({
            message: "Name and Price are required",
        });
    }
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            message: "Please provide an image of the restaurant",
        });
    }
    const fileBuffer = getBuffer(file);
    if (!fileBuffer?.content) {
        return res.status(500).json({
            message: "Failed to create file buffer",
        });
    }
    const { data: uploadResult } = await axios.post(`${process.env.UTILS_SERVICE}/api/upload`, {
        buffer: fileBuffer.content,
    }); //image uploaded
    const item = await MenuItems.create({
        name,
        description,
        price,
        restaurantId: restaurant._id,
        image: uploadResult.url,
    });
    res.json({
        message: "Item added successfully",
        item,
    });
});
export const getAllItems = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message: "Id is required",
        });
    }
    const items = await MenuItems.find({ restaurantId: id });
    res.json(items);
});
export const deleteMenuItem = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Please Login",
        });
    }
    const { itemId } = req.params;
    if (!itemId) {
        return res.status(400).json({
            message: "Id is required",
        });
    }
    const item = await MenuItems.findById(itemId);
    if (!item) {
        return res.status(404).json({
            message: "No item found",
        });
    }
    const restaurant = await Restaurant.findOne({
        _id: item.restaurantId,
        ownerId: req.user._id,
    });
    if (!restaurant) {
        res.status(404).json({
            message: "No Restaurant found",
        });
    }
    await item.deleteOne();
    res.json({
        message: "Menu item deleted successfully",
    });
});
export const toggleMenuItemAvailability = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Please Login",
        });
    }
    const { itemId } = req.params;
    if (!itemId) {
        return res.status(400).json({
            message: "Id is required",
        });
    }
    const item = await MenuItems.findById(itemId);
    if (!item) {
        return res.status(404).json({
            message: "No item found",
        });
    }
    const restaurant = await Restaurant.findOne({
        _id: item.restaurantId,
        ownerId: req.user._id,
    });
    if (!restaurant) {
        res.status(404).json({
            message: "No Restaurant found",
        });
    }
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({
        message: `Item Marked as ${item.isAvailable ? "available" : "unavailable"}`
    });
});
