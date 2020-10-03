import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export * as emoji from './emoji'
export * as globalSettings from './global-settings'
export * as regex from './regex'
