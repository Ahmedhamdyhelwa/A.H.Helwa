import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber, toNumber } from '@/lib/utils';
import {
  InvoiceStatus,
  Prisma,
  StockMovementType,
} from '@prisma/client';

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface CreateSaleInput {
  tenantId: string;
  branchId: string;
  cashierId?: string;
  customerId?: string | null;
  items: SaleItemInput[];
  discount?: number;
  paid?: number;
  notes?: string;
  isReturn?: boolean;
}

export async function createSale(input: CreateSaleInput) {
  if (input.items.length === 0) {
    throw new Error('NO_ITEMS');
  }

  return prisma.$transaction(async (tx) => {
    let subtotal = 0;
    let tax = 0;
    const lineRows: Prisma.SalesInvoiceItemCreateManyInvoiceInput[] = [];
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) }, tenantId: input.tenantId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error('PRODUCT_NOT_FOUND');
      const lineDiscount = item.discount ?? 0;
      const lineTaxRate = item.taxRate ?? toNumber(product.taxRate);
      const gross = item.quantity * item.unitPrice - lineDiscount;
      const lineTax = (gross * lineTaxRate) / 100;
      const lineTotal = gross + lineTax;
      subtotal += gross;
      tax += lineTax;
      lineRows.push({
        productId: product.id,
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        costPrice: product.costPrice,
        discount: new Prisma.Decimal(lineDiscount),
        taxRate: new Prisma.Decimal(lineTaxRate),
        total: new Prisma.Decimal(lineTotal),
      });
    }

    const discount = input.discount ?? 0;
    const total = subtotal - discount + tax;
    const paid = input.paid ?? total;
    const number = generateInvoiceNumber(input.isReturn ? 'SR' : 'S');

    const invoice = await tx.salesInvoice.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        number,
        customerId: input.customerId || null,
        cashierId: input.cashierId,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        paid: new Prisma.Decimal(paid),
        status: paid >= total ? InvoiceStatus.PAID : paid > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.POSTED,
        isReturn: !!input.isReturn,
        notes: input.notes,
        items: { createMany: { data: lineRows } },
      },
      include: { items: true },
    });

    // Update stock + create movements
    for (const item of input.items) {
      const delta = input.isReturn ? item.quantity : -item.quantity;
      await tx.productStock.upsert({
        where: {
          productId_branchId: { productId: item.productId, branchId: input.branchId },
        },
        create: {
          productId: item.productId,
          branchId: input.branchId,
          quantity: new Prisma.Decimal(delta),
        },
        update: {
          quantity: { increment: new Prisma.Decimal(delta) },
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId: input.tenantId,
          productId: item.productId,
          branchId: input.branchId,
          type: input.isReturn ? StockMovementType.RETURN_IN : StockMovementType.SALE,
          quantity: new Prisma.Decimal(item.quantity),
          reference: number,
        },
      });
    }

    // Update customer balance (unpaid amount)
    if (input.customerId) {
      const owed = total - paid;
      if (owed !== 0) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: { balance: { increment: new Prisma.Decimal(input.isReturn ? -owed : owed) } },
        });
      }
    }

    return invoice;
  });
}
