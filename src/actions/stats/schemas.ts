import { z } from "zod";

export const getStatsSchema = z
  .object({
    yearFrom: z.number().int("시작 년도는 정수여야 합니다."),
    monthFrom: z
      .number()
      .int("시작 월은 정수여야 합니다.")
      .min(1, "시작 월은 1 이상이어야 합니다.")
      .max(12, "시작 월은 12 이하여야 합니다."),
    yearTo: z.number().int("종료 년도는 정수여야 합니다."),
    monthTo: z
      .number()
      .int("종료 월은 정수여야 합니다.")
      .min(1, "종료 월은 1 이상이어야 합니다.")
      .max(12, "종료 월은 12 이하여야 합니다."),
  })
  .refine(
    (data) => {
      const fromDate = new Date(data.yearFrom, data.monthFrom - 1);
      const toDate = new Date(data.yearTo, data.monthTo - 1);
      return fromDate <= toDate;
    },
    {
      message: "시작 날짜가 종료 날짜보다 이후일 수 없습니다.",
    }
  );

export type GetStatsInput = z.infer<typeof getStatsSchema>;
