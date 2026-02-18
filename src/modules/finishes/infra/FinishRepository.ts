
import { PrismaClient } from '@prisma/client';
import { RoomFinishDomain } from '../domain/FinishTypes';

const prisma = new PrismaClient();

export const FinishRepository = {
  
  async getRoomSchedule(projectId: string, roomId: string) {
    return await prisma.roomFinishSchedule.findUnique({
      where: {
        projectId_roomId: { projectId, roomId }
      },
      include: {
        floorFinish: true,
        wallFinish: true,
        ceilingFinish: true
      }
    });
  },

  async upsertRoomSchedule(data: RoomFinishDomain) {
    return await prisma.roomFinishSchedule.upsert({
      where: {
        projectId_roomId: {
          projectId: data.projectId,
          roomId: data.roomId
        }
      },
      update: {
        floorFinishId: data.floor.finishId,
        wallFinishId: data.walls.finishId,
        ceilingFinishId: data.ceiling.finishId,
        specifications: JSON.stringify({
            skirtingId: data.floor.skirtingId,
            corniceId: data.ceiling.corniceId,
            featureWalls: data.walls.featureWalls
        })
      },
      create: {
        projectId: data.projectId,
        roomId: data.roomId,
        floorFinishId: data.floor.finishId,
        wallFinishId: data.walls.finishId,
        ceilingFinishId: data.ceiling.finishId,
        specifications: JSON.stringify({
            skirtingId: data.floor.skirtingId,
            corniceId: data.ceiling.corniceId,
            featureWalls: data.walls.featureWalls
        })
      }
    });
  },

  async getAllProducts() {
    return await prisma.finishProduct.findMany({
        orderBy: { category: 'asc' }
    });
  }
};
