import { RequestHandler } from 'express';

const TryCatch = (handler: RequestHandler): RequestHandler => {
    // Look how clean this is! No types needed inside the parentheses.
    // The ': RequestHandler =>' above already told TypeScript what these are.
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (err: any) {
            res.status(500).json({
                message: err.message,
            });
        }
    }
}

export default TryCatch;