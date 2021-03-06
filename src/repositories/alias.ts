import { prisma } from '../utilities'

export const create = async ({
  name,
  productId,
  stickerId,
  suffix,
  teamId,
}: {
  name: string
  productId: string
  stickerId: string
  suffix: string
  teamId: string
}) => {
  return await prisma.alias.create({
    data: {
      name: name,
      productId,
      stickerId,
      suffix,
      team: {
        connect: {
          teamId: teamId,
        },
      },
    },
  })
}

export const findOne = async ({ name, teamId }: { name: string; teamId: string }) => {
  return await prisma.alias.findOne({
    where: {
      name_teamId: {
        name: name,
        teamId: teamId,
      },
    },
  })
}

export const deleteAll = async ({ teamId }: { teamId: string }) => {
  return await prisma.alias.deleteMany({
    where: {
      teamId: teamId,
    },
  })
}
