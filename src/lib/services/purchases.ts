import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber, toNumber } from '@/lib/utils';
import { InvoiceStatus, Prisma, StockMovementType } from '@prisma/client';

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
  discount?: number;
  taxRate?: number;
}

export interface CreatePurchaseInput {
  tenantId: string;
  branchId: string;
  supplierId?: string | null;
  items: PurchaseItemInput[];
  discount?: number;
  paid?: number;
  notes?: string;
  isReturn?: boolean;
}

export async function createPurchase(input: CreatePurchaseInput) {
  if (input.items.length === 0) throw new Error('NO_ITEMS');

  return prisma.$transaction(async (tx) => {
    let subtotal = 0;
    let tax = 0;
    const lineRows: Prisma.PurchaseInvoiceItemCreateManyInvoiceInput[] = [];
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) }, tenantId: input.tenantId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error('PRODUCT_NOT_FOUND');
      const lineDiscount = item.discount ?? 0;
      const lineTaxRate = item.taxRate ?? 0;
      const gross = item.quantity * item.unitCost - lineDiscount;
      const lineTax = (gross * lineTaxRate) / 100;
      const lineTotal = gross + lineTax;
      subtotal += gross;
      tax += lineTax;
      lineRows.push({
        productId: product.id,
        quantity: new Prisma.Decimal(item.quantity),
        unitCost: new Prisma.Decimal(item.unitCost),
        discount: new Prisma.Decimal(lineDiscount),
        taxRate: new Prisma.Decimal(lineTaxRate),
        total: new Prisma.Decimal(lineTotal),
      });
    }

    const discount = input.discount ?? 0;
    const total = subtotal - discount + tax;
    const paid = input.paid ?? 0;
    const number = generateInvoiceNumber(input.isReturn ? 'PR' : 'P');

    const invoice = await tx.purchaseInvoice.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        number,
        supplierId: input.supplierId || null,
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

    for (const item of input.items) {
      const delta = input.isReturn ? -item.quantity : item.quantity;
      await tx.productStock.upsert({
        where: {
          productId_branchId: { productId: item.productId, branchId: input.branchId },
        },
        create: {
          productId: item.productId,
          branchId: input.branchId,
          quantity: new Prisma.Decimal(delta),
        },
        update: { quantity: { increment: new Prisma.Decimal(delta) } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId: input.tenantId,
          productId: item.productId,
          branchId: input.branchId,
          type: input.isReturn ? StockMovementType.RETURN_OUT : StockMovementType.PURCHASE,
          quantity: new Prisma.Decimal(item.quantity),
          reference: number,
        },
      });

      // Optionally update product cost price to latest cost
      if (!input.isReturn) {
        await tx.product.update({
          where: { id: item.productId },
          data: { costPrice: new Prisma.Decimal(item.unitCost) },
        });
      }
    }

    // Supplier balance (unpaid -> we owe supplier)
    if (input.supplierId) {
      const owed = total - paid;
      if (owed !== 0) {
        await tx.supplier.update({
          where: { id: input.supplierId },
          data: { balance: { increment: new Prisma.Decimal(input.isReturn ? -owed : owed) } },
        });
      }
    }

    return invoice;
  });
}
