// Shim kompatibilitas — definisi kanonik ada di module goals.
// Dipakai module user (CompleteOnboarding) supaya tidak cross-import file domain
// module lain secara langsung. Type-only re-export, hilang saat compile.
export type { IGoalRepository, CreateGoalInput, UpdateGoalInput } from '@/modules/goals';
