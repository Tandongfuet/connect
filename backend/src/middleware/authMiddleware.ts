import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import { Role } from '../constants';

const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      (req as any).user = await User.findById(decoded.id).select('-password');
      
      if (!(req as any).user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
      
      next();
    } catch (error: any) {
      // Ignore malformed or expired tokens; do not spam logs
      if (error.name && error.name !== 'JsonWebTokenError') {
        console.error('Auth error:', error);
      }
      // proceed without setting req.user (unauthenticated)
      return next();
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === Role.Admin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

const seller = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === Role.Farmer || req.user.role === Role.ServiceProvider)) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a seller or service provider');
  }
};


export { protect, admin, seller };