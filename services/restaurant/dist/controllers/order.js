import axios from "axios";
import TryCatch from "../middlewares/trycatch.js";
import Address from "../model/Address.js";
import Cart from "../model/Cart.js";
import Order from "../model/Order.js";
import Restaurant from "../model/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";
export const createOrder = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "Unauthoriszd",
        });
    }
    const { paymentMethod, addressId } = req.body;
    if (!addressId) {
        return res.status(400).json({
            message: "Address is required",
        });
    }
    const address = await Address.findOne({
        _id: addressId,
        userId: user._id,
    });
    if (!address) {
        return res.status(404).json({
            message: "Address not found",
        });
    }
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180)
                * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return +(R * c).toFixed(2);
    };
    const cartItems = await Cart.find({
        userId: user._id,
    }).populate("itemId").populate("restaurantId");
    if (cartItems.length === 0) {
        return res.status(400).json({
            message: "Cart is empty",
        });
    }
    const firstCartItem = cartItems[0];
    if (!firstCartItem || !firstCartItem.restaurantId) {
        return res.status(400).json({
            message: "Invalid Cart Data",
        });
    }
    const restaurantId = firstCartItem.restaurantId._id;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json({
            message: "No restaurant with this Id",
        });
    }
    if (!restaurant.isOpen) {
        return res.status(404).json({
            message: "Sorry this restuarant is closed for now",
        });
    }
    const distance = getDistanceKm(address.location.coordinates[1], address.location.coordinates[0], restaurant.autoLocation.coordinates[1], restaurant.autoLocation.coordinates[0]);
    let subTotal = 0; //should not take from frontend as ethical hacker can manipulate it.
    const orderItems = cartItems.map((cart) => {
        const item = cart.itemId; // not just ID
        if (!item) {
            throw new Error("Invalid cart Item");
        }
        const itemTotal = item.price * cart.quantity;
        subTotal += itemTotal;
        return {
            itemId: item._id.toString(),
            name: item.name,
            price: item.price,
            quantity: cart.quantity,
        };
    });
    const deliveryFee = subTotal < 250 ? 49 : 0;
    const platformFee = 7;
    const totalAmount = subTotal + deliveryFee + platformFee;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // order expires if remain unpaid for more than 15 minutes.
    const [longitude, latitude] = address.location.coordinates;
    const riderAmount = Math.ceil(distance) * 17;
    const order = await Order.create({
        userId: user._id.toString(),
        restaurantId: restaurantId.toString(),
        restaurantName: restaurant.name,
        riderId: null,
        distance,
        riderAmount,
        items: orderItems,
        subTotal,
        deliveryFee,
        platformFee,
        totalAmount,
        addressId: address._id.toString(),
        deliveryAddress: {
            formattedAddress: address.formattedAddress,
            mobile: address.mobile,
            latitude,
            longitude
        },
        paymentMethod,
        paymentStatus: "pending",
        status: "placed",
        expiresAt,
    });
    await Cart.deleteMany({ userId: user._id });
    res.json({
        message: "order created successfully",
        orderId: order._id.toString(),
        amount: totalAmount,
    });
});
export const fetchOrderPayment = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden"
        });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    if (order.paymentStatus !== "pending") {
        return res.status(400).json({
            message: "Order already paid",
        });
    }
    res.json({
        orderId: order._id,
        amount: order.totalAmount,
        currency: "INR",
    });
});
export const fetchRestaurantOrders = TryCatch(async (req, res) => {
    const user = req.user;
    const { restaurantId } = req.params;
    if (!user) {
        return res.status(401).json({
            message: "Unauthorised",
        });
    }
    if (!restaurantId) {
        return res.status(400).json({
            message: "Restaurant id is required",
        });
    }
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const orders = await Order.find({ restaurantId,
        paymentStatus: "paid" })
        .sort({ createdAt: -1 })
        .limit(limit);
    return res.json({
        success: true,
        count: orders.length,
        orders,
    });
});
const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"];
export const updateOrderStatus = TryCatch(async (req, res) => {
    const user = req.user;
    const { orderId } = req.params;
    const { status } = req.body;
    const { restaurantId } = req.params;
    if (!user) {
        return res.status(401).json({
            message: "Unauthorised",
        });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
            message: "Invalid Order Status",
        });
    }
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    if (order.paymentStatus !== "paid") {
        return res.status(404).json({
            message: "Order not completed",
        });
    }
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) {
        return res.status(404).json({
            message: "Restaurant not found",
        });
    }
    if (restaurant.ownerId !== user._id.toString()) {
        return res.status(401).json({
            message: "You are not allowed to update this order",
        });
    }
    order.status = status;
    await order.save();
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
            orderId: order._id,
            status: order.status,
        }
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
    });
    // now assign riders
    if (status === "ready_for_rider") {
        console.log("Publishing Order ready for rider", order._id);
        await publishEvent("ORDER_READY_FOR_QUEUE", {
            orderId: order._id.toString(),
            restaurantId: restaurant._id.toString(),
            location: restaurant.autoLocation,
        });
        console.log("Event published successfully");
    }
    res.json({
        message: "Order status updated successfully",
        order,
    });
});
export const getMyOrders = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorised",
        });
    }
    const orders = await Order.find({
        userId: req.user._id.toString(),
        paymentStatus: "paid",
    }).sort({ createdAt: -1 });
    res.json({ orders });
});
export const fetchSingleOrder = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "Unauthorised",
        });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    if (order.userId !== req.user?._id.toString()) {
        return res.status(401).json({
            message: "You are not allowed to view this order",
        });
    }
    res.json(order);
});
export const assignRiderToOrder = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden"
        });
    }
    const { orderId, riderId, riderName, riderPhone } = req.body;
    const orderAvailable = await Order.findOne({ riderId, status: { $ne: "delivered" } });
    if (orderAvailable) {
        return res.status(400).json({
            message: "You already have a order"
        });
    }
    const order = await Order.findById(orderId);
    if (order?.riderId !== null) {
        return res.status(400).json({
            message: "Order Already Taken",
        });
    }
    const orderUpdated = await Order.findOneAndUpdate({ _id: orderId, riderId: null }, {
        riderId,
        riderName,
        riderPhone,
        status: "rider_assigned",
    }, {
        new: true
    });
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
    });
    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
    }, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
    });
    res.json({
        message: "Rider assigned successfully",
        success: true,
        order: orderUpdated,
    });
});
export const getCurrentOrderForRider = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden"
        });
    }
    const { riderId } = req.query;
    if (!riderId) {
        return res.status(400).json({
            message: "Rider id is required",
        });
    }
    const order = await Order.findOne({
        riderId,
        status: { $ne: "delivered" },
    }).populate("restaurantId");
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    res.json(order);
});
export const updateOrderStatusRider = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden"
        });
    }
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }
    if (order.status === "rider_assigned") {
        order.status = "picked_up";
        await order.save();
        await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order,
        }, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order,
        }, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        return res.json({
            message: "Order updated Successfully",
        });
    }
    if (order.status === "picked_up") {
        order.status = "delivered";
        await order.save();
        await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order,
        }, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order,
        }, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        return res.json({
            message: "Order updated Successfully",
        });
    }
});
export const getSalesStats = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const stats = await Order.aggregate([
            {
                $match: {
                    restaurantId: restaurantId,
                    paymentStatus: "paid",
                    status: "delivered", // important
                },
            },
            {
                $facet: {
                    total: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: "$totalAmount" },
                            },
                        },
                    ],
                    today: [
                        {
                            $match: {
                                createdAt: { $gte: startOfDay },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                todayOrders: { $sum: 1 },
                                todayRevenue: { $sum: "$totalAmount" },
                            },
                        },
                    ],
                    topItems: [
                        { $unwind: "$items" },
                        {
                            $group: {
                                _id: "$items.name",
                                totalSold: { $sum: "$items.quantity" },
                            },
                        },
                        { $sort: { totalSold: -1 } },
                        { $limit: 5 },
                    ],
                },
            },
        ]);
        const total = stats[0].total[0] || {};
        const today = stats[0].today[0] || {};
        res.json({
            totalOrders: total.totalOrders || 0,
            totalRevenue: total.totalRevenue || 0,
            todayOrders: today.todayOrders || 0,
            todayRevenue: today.todayRevenue || 0,
            topItems: stats[0].topItems || [],
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching sales stats" });
    }
};
