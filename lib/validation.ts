import { z } from "zod";

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "O nickname precisa ter ao menos 2 caracteres.")
  .max(20, "O nickname precisa ter no máximo 20 caracteres.")
  .regex(/^[A-Za-z0-9_-]+$/, "Use apenas letras, números, _ ou -.");

const tokenSchema = z.string().min(10).max(4000);

export const answerRequestSchema = z.object({
  token: tokenSchema,
  questionId: z.string().min(1).max(50),
  userAnswer: z.union([z.boolean(), z.null()]),
});

export const nextRequestSchema = z.object({
  token: tokenSchema,
});

export const submitRankingSchema = z.object({
  token: tokenSchema,
  nickname: nicknameSchema,
});

export type SubmitRankingInput = z.infer<typeof submitRankingSchema>;
export type AnswerRequestInput = z.infer<typeof answerRequestSchema>;
