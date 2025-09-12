/**
 * User Repository Module
 * 
 * Module ini mengexport UserRepository class dan instance-nya
 * untuk operasi CRUD pada entitas User.
 * 
 * @module UserRepository
 */

export { UserRepository, userRepository } from './userRepository';
export type { User, NewUser } from '@/db/schema';