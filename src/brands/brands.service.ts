// src/brands/brands.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.brand.findMany({
            orderBy: { brands_name: 'asc' },
        });
    }

    findOne(id: number) {
        return this.prisma.brand.findUnique({
            where: { brands_id: id },
            include: { models: true },
        });
    }
}