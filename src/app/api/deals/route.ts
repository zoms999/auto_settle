import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        services: true,
        paymentSchedules: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { services, paymentSchedules, ...dealData } = body;

    // Create deal with services and payment schedules
    const deal = await prisma.deal.create({
      data: {
        ...dealData,
        services: {
          create: services || [],
        },
        paymentSchedules: {
          create: paymentSchedules || [],
        },
      },
      include: {
        services: true,
        paymentSchedules: true,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}