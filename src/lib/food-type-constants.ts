import { FoodType } from '@prisma/client'

export const foodTypeLabels: Record<FoodType, string> = {
  CRICKET: '귀뚜라미',
  MEALWORM: '밀웜',
  FEED: '사료',
  VEGETABLE: '야채/과일',
  MOUSE: '쥐',
  FROZEN_CHICK: '냉짱',
  FRUIT_FLY: '초파리',
  OTHER: '기타',
}

export const foodTypeColors: Record<FoodType, string> = {
  CRICKET: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300',
  MEALWORM: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300',
  FEED: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300',
  VEGETABLE: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300',
  MOUSE: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-300',
  FROZEN_CHICK: 'bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-950 dark:text-pink-300',
  FRUIT_FLY: 'bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300',
  OTHER: 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300',
}
