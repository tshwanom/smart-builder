
import { prisma } from "@/lib/prisma";
import { StructureElement } from "@prisma/client";
import { StructureElementDomain } from "../domain/StructureTypes";

export class StructureRepository {
  
  async create(data: Omit<StructureElement, "id" | "createdAt" | "updatedAt">): Promise<StructureElement> {
    return await prisma.structureElement.create({
        data
    });
  }

  async getByProject(projectId: string): Promise<StructureElement[]> {
    return await prisma.structureElement.findMany({
      where: { projectId }
    });
  }

  async update(id: string, data: Partial<StructureElement>): Promise<StructureElement> {
    return await prisma.structureElement.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<StructureElement> {
    return await prisma.structureElement.delete({
      where: { id }
    });
  }
}
