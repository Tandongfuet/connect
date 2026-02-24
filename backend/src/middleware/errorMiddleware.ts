import { Request, Response, NextFunction } from 'express';

// Handles routes that are not found
const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Custom error handler to override the default Express error handler
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Sometimes an error might come in with a 200 status code, so we set it to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // Show stack trace only in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };