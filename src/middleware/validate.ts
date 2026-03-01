import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export function handleValidation(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

export const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  handleValidation,
];

export const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

export const validateScholarship = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("university").trim().notEmpty().withMessage("University is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  handleValidation,
];

export const validateJob = [
  body("company").trim().notEmpty().withMessage("Company is required"),
  body("title").trim().notEmpty().withMessage("Job title is required"),
  handleValidation,
];

export const validateSession = [
  body("time_slot_id").isInt().withMessage("Time slot is required"),
  body("reason").trim().notEmpty().withMessage("Reason is required"),
  handleValidation,
];
