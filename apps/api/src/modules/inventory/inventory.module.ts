import { Module } from '@nestjs/common';

import { ActivityModule } from '../activity/activity.module';
import { SequencesModule } from '../sequences/sequences.module';

import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';

import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';

import { MovementsController } from './movements/movements.controller';
import { MovementsService } from './movements/movements.service';

import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';

import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';

@Module({
  imports: [ActivityModule, SequencesModule],
  controllers: [
    CategoriesController,
    ItemsController,
    MovementsController,
    SuppliersController,
    PurchaseOrdersController,
  ],
  providers: [
    CategoriesService,
    ItemsService,
    MovementsService,
    SuppliersService,
    PurchaseOrdersService,
  ],
  exports: [
    CategoriesService,
    ItemsService,
    MovementsService,
    SuppliersService,
    PurchaseOrdersService,
  ],
})
export class InventoryModule {}
