import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const jwt_secret = process.env.JWT_SECRET || 'secret';
export const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header)
        return res.status(401).json({ message: 'No token provided' });
    const token = header.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Invalid token format' });
    try {
        const payload = jwt.verify(token, jwt_secret);
        req.userId = payload.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
//# sourceMappingURL=auth.js.map