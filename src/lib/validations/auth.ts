import { z } from "zod";
import { appRoles } from "@/lib/auth/roles";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[!@#$%^&*]/, "Must contain a special character");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
});

export const registerSchema = z
  .object({
    role: z.enum(appRoles),
    fullName: z.string().min(2, "Full name is required").max(80),
    email: z.email("Enter a valid email address").trim(),
    password: passwordSchema,
    confirmPassword: z.string().min(10, "Confirm your password"),
    specialty: z.string().max(80).optional().or(z.literal("")),
    organization: z.string().max(100).optional().or(z.literal("")),
    accessCode: z.string().max(80).optional().or(z.literal("")),
    agreeTerms: z.boolean().refine((value) => value === true, "You must agree to the Terms and HIPAA Notice"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((values, ctx) => {
    if (values.role === "provider" && !values.specialty?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Clinical specialty is required for provider accounts",
        path: ["specialty"],
      });
    }

    if ((values.role === "provider" || values.role === "admin") && !values.accessCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Staff access code is required for provider and admin accounts",
        path: ["accessCode"],
      });
    }
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(10, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;