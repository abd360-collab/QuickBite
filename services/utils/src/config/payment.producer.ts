import { getChannel } from "./rabbitmq.js"


// This function will:
// Send payment success message

export const publishPaymentSuccess = async(payload: {
    orderId: string,
    paymentId: string,
    provider: "razorpay" | "stripe",
}) => {
    const channel = getChannel() //👉 Get the RabbitMQ channel


    // 👉 You are sending a message to a queue
    // “Send message to this specific queue 📦”
    // converts data into a format RabbitMQ understands:
    // JSON.stringify(...):
// 👉 Convert object → string
// Buffer.from(...):
// 👉 Convert string → binary format

    channel.sendToQueue(        
        process.env.PAYMENT_QUEUE!,
        Buffer.from(JSON.stringify({
            type: "PAYMENT_SUCCESS",
            data: payload,
        })),

        { persistent: true }
    );
};