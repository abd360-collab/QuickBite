import crypto from "crypto";
// This function will:
// Take payment details
// Verify if they are correct
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const body = `${orderId}|${paymentId}`; //👉 Combining values into one string. Razorpay uses this exact format to create signature
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).
        update(body)
        .digest("hex");
    return expectedSignature === signature;
};
// 🧩 Full Flow (Very Simple)
// User pays 💳
// Razorpay sends:
// orderId
// paymentId
// signature
// Your backend:
// Recreates signature using secret
// Compares with Razorpay signature
// If same → payment is real ✅
