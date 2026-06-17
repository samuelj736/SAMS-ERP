/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Blueprint {
  name: string;
  filename: string;
  language: string;
  code: string;
}

export const LARAVEL_12_BLUEPRINTS: Blueprint[] = [
  {
    name: '1. Migrations',
    filename: 'create_flower_erp_tables.php',
    language: 'php',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Core items catalog (wholesale & retail prices)
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->enum('type', ['BUNCH', 'STEM', 'BOUQUET']);
            $table->integer('stem_count_per_bunch')->nullable(); // Set if type is BUNCH
            $table->decimal('cost_price', 12, 2);
            $table->decimal('retail_price', 12, 2);
            $table->decimal('wholesale_price', 12, 2);
            $table->integer('min_stock_level')->default(10);
            $table->timestamps();
        });

        // 2. Suppliers Registry
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
            $table->timestamps();
        });

        // 3. Purchase Orders (Bunches / Stems)
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number')->unique();
            $table->decimal('total_amount', 12, 2);
            $table->enum('status', ['PENDING', 'RECEIVED'])->default('RECEIVED');
            $table->timestamps();
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_cost', 12, 2);
            $table->timestamps();
        });

        // 4. BOM Recipes (Bouquets / Wreaths blueprints)
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('labor_cost', 12, 2)->default(0.00);
            $table->decimal('retail_price', 12, 2);
            $table->decimal('wholesale_price', 12, 2);
            $table->timestamps();
        });

        Schema::create('recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete(); // Represents single STEM components
            $table->integer('quantity'); // Count of stems required
            $table->timestamps();
        });

        // 5. Transaction Ledgers (The single source of truth for all stock)
        Schema::create('inventory_ledger_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->enum('type', [
                'PURCHASE', 
                'CONVERSION_OUT', 
                'CONVERSION_IN', 
                'SALE', 
                'PRODUCTION_CONSUME', 
                'PRODUCTION_YIELD', 
                'DAMAGE_WRITE_OFF'
            ]);
            $table->integer('quantity'); // Positive for receipts, negative for disbursements
            $table->decimal('unit_price', 12, 2);
            $table->string('reference_type')->nullable(); // e.g. PurchaseOrder, Sale, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });

        // 6. Customers Registry
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('type', ['RETAIL', 'WHOLESALE'])->default('RETAIL');
            $table->decimal('discount_rate', 5, 2)->default(0.00); // % percentage
            $table->timestamps();
        });

        // 7. Sales Records and Cash Registry billing items
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->enum('customer_type', ['RETAIL', 'WHOLESALE'])->default('RETAIL');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['CASH', 'CARD', 'BANK_TRANSFER', 'CREDIT']);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount', 5, 2)->default(0.00);
            $table->timestamps();
        });

        // 8. Damage Registry (Losses & Spoiled Flowers)
        Schema::create('damages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('quantity');
            $table->enum('reason', ['SPOILED', 'BROKEN_STEM', 'DRIED_OUT', 'OTHER']);
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // 9. Attendance Registry
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('clock_in');
            $table->dateTime('clock_out')->nullable();
            $table->decimal('hours_worked', 5, 2)->nullable();
            $table->timestamps();
        });

        // 10. Wages and Payroll Statements
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('pay_period_start');
            $table->date('pay_period_end');
            $table->decimal('regular_hours', 6, 2)->default(0.00);
            $table->decimal('overtime_hours', 6, 2)->default(0.00);
            $table->decimal('gross_pay', 12, 2);
            $table->decimal('deductions', 12, 2)->default(0.00);
            $table->decimal('net_pay', 12, 2);
            $table->enum('status', ['PENDING', 'PAID'])->default('PENDING');
            $table->date('payment_date')->nullable();
            $table->timestamps();
        });

        // 11. Operational Expenses Log
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->enum('category', ['RENT', 'UTILITIES', 'MARKETING', 'PACKAGING', 'SALARIES', 'OTHER']);
            $table->decimal('amount', 12, 2);
            $table->string('description');
            $table->date('date');
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('damages');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('inventory_ledger_transactions');
        Schema::dropIfExists('recipe_items');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('inventory_items');
    }
};
`
  },
  {
    name: '2. Eloquent Models',
    filename: 'InventoryItem.php',
    language: 'php',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Casts\\Attribute;

class InventoryItem extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'type',
        'stem_count_per_bunch',
        'cost_price',
        'retail_price',
        'wholesale_price',
        'min_stock_level',
    ];

    /**
     * Get all transaction logs for this specific flower/item.
     */
    public function ledgerTransactions(): HasMany
    {
        return $this->hasMany(InventoryLedgerTransaction::class);
    }

    /**
     * Compute current stock strictly from the Transaction Ledger.
     * This acts as the transactional database single source of truth.
     */
    public function stockBalance(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->ledgerTransactions()->sum('quantity')
        );
    }

    /**
     * Check if current stock level has fallen below the min stock limit.
     */
    public function isLowStock(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->stock_balance < $this->min_stock_level
        );
    }
}
`
  },
  {
    name: '3. Ledger Transaction Service',
    filename: 'InventoryService.php',
    language: 'php',
    code: `<?php

namespace App\\Services;

use App\\Models\\InventoryItem;
use App\\Models\\InventoryLedgerTransaction;
use App\\Models\\Supplier;
use App\\Models\\PurchaseOrder;
use Exception;
use Illuminate\\Support\\Facades\\DB;

class InventoryService
{
    /**
     * Main dispatcher to write a robust transactional log entry into the ledger database.
     */
    public static function logTransaction(
        int $itemId,
        string $type,
        int $quantity,
        float $unitPrice,
        ?string $refType = null,
        ?int $refId = null,
        ?string $notes = null
    ): InventoryLedgerTransaction {
        return InventoryLedgerTransaction::create([
            'inventory_item_id' => $itemId,
            'type' => $type,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'notes' => $notes,
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Convert and decompose a batch of purchased flower Bunches into single Stems for inventory storage and BOM recipe usage.
     * Decrements the Bunch item in the ledger and increments the Stem item.
     */
    public function convertBunchesToStems(InventoryItem $bunchItem, InventoryItem $stemItem, int $bunchesCount, string $notes = ''): void
    {
        if ($bunchItem->type !== 'BUNCH' || $stemItem->type !== 'STEM') {
            throw new Exception('Invalid source or target item types for converting bunches to stems.');
        }

        if (!$bunchItem->stem_count_per_bunch) {
            throw new Exception('No stem count configured on the source bunch item: ' . $bunchItem->name);
        }

        DB::transaction(function () use ($bunchItem, $stemItem, $bunchesCount, $notes) {
            // Verify source bunch balance is sufficient
            $currentBunchStock = $bunchItem->stock_balance;
            if ($currentBunchStock < $bunchesCount) {
                throw new Exception("Insufficient bunch stock to convert: {$currentBunchStock} available, {$bunchesCount} requested");
            }

            // 1. Log reduction on Bunch item
            self::logTransaction(
                itemId: $bunchItem->id,
                type: 'CONVERSION_OUT',
                quantity: -$bunchesCount,
                unitPrice: $bunchItem->cost_price,
                notes: "Decomposed {$bunchesCount} bunches into stems. " . $notes
            );

            // 2. Log increment on Stem item
            $stemsProducedCount = $bunchesCount * $bunchItem->stem_count_per_bunch;
            self::logTransaction(
                itemId: $stemItem->id,
                type: 'CONVERSION_IN',
                quantity: $stemsProducedCount,
                unitPrice: $stemItem->cost_price ?? ($bunchItem->cost_price / $bunchItem->stem_count_per_bunch),
                notes: "Obtained {$stemsProducedCount} stems from {$bunchesCount} bunches decomposition."
            );
        });
    }
}
`
  },
  {
    name: '4. Recipe Production Service',
    filename: 'RecipeProductionService.php',
    language: 'php',
    code: `<?php

namespace App\\Services;

use App\\Models\\Recipe;
use App\\Models\\InventoryItem;
use App\\Models\\ProductionLog;
use Exception;
use Illuminate\\Support\\Facades\\DB;

class RecipeProductionService
{
    /**
     * Execute structured recipe production:
     * - Checks stem inventory constraints.
     * - Atomically disburses component Stems.
     * - Atomically stores finished Bouquet items.
     * - Appends records to the transaction ledger.
     */
    public function produceBouquet(Recipe $recipe, int $quantity): ProductionLog
    {
        return DB::transaction(function () use ($recipe, $quantity) {
            // Validate all necessary stem components exist with sufficient stock
            foreach ($recipe->items as $recipeItem) {
                $component = $recipeItem->inventoryItem;
                $stemsRequired = $recipeItem->quantity * $quantity;
                $availableStems = $component->stock_balance;

                if ($availableStems < $stemsRequired) {
                    throw new Exception("Insufficient stock of {$component->name}. Required: {$stemsRequired}, Available: {$availableStems}");
                }
            }

            // 1. Create Production Log Entry
            $productionLog = ProductionLog::create([
                'recipe_id' => $recipe->id,
                'quantity_produced' => $quantity,
                'user_id' => auth()->id(),
            ]);

            // 2. Consume required Stems from the inventory ledger
            foreach ($recipe->items as $recipeItem) {
                $component = $recipeItem->inventoryItem;
                $stemsRequired = $recipeItem->quantity * $quantity;

                InventoryService::logTransaction(
                    itemId: $component->id,
                    type: 'PRODUCTION_CONSUME',
                    quantity: -$stemsRequired,
                    unitPrice: $component->cost_price,
                    refType: ProductionLog::class,
                    refId: $productionLog->id,
                    notes: "Consumed for Bouquet Recipe: " . $recipe->name
                );
            }

            // 3. Increment Bouquet item stock in the inventory ledger
            // Locate or dynamically spawn a Bouquet inventory catalog row if necessary
            $bouquetItem = InventoryItem::firstOrCreate([
                'sku' => $recipe->sku,
            ], [
                'name' => $recipe->name,
                'type' => 'BOUQUET',
                'cost_price' => $recipe->items->sum(fn ($i) => $i->inventoryItem->cost_price * $i->quantity) + $recipe->labor_cost,
                'retail_price' => $recipe->retail_price,
                'wholesale_price' => $recipe->wholesale_price,
                'min_stock_level' => 2,
            ]);

            InventoryService::logTransaction(
                itemId: $bouquetItem->id,
                type: 'PRODUCTION_YIELD',
                quantity: $quantity,
                unitPrice: $bouquetItem->cost_price,
                refType: ProductionLog::class,
                refId: $productionLog->id,
                notes: "Manufactured from layout Recipe: " . $recipe->name
            );

            return $productionLog;
        });
    }
}
`
  },
  {
    name: '5. Filament Form & Table Schema',
    filename: 'PurchaseOrderResource.php',
    language: 'php',
    code: `<?php

namespace App\\Filament\\Resources;

use App\\Filament\\Resources\\PurchaseOrderResource\\Pages;
use App\\Models\\PurchaseOrder;
use Filament\\Forms;
use Filament\\Forms\\Form;
use Filament\\Resources\\Resource;
use Filament\\Tables;
use Filament\\Tables\\Table;

class PurchaseOrderResource extends Resource
{
    protected static ?string $model = PurchaseOrder::class;
    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';
    protected static ?string $navigationGroup = 'Supply Chain';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\\Components\\Section::make('Supplier Details')
                    ->schema([
                        Forms\\Components\\Select::make('supplier_id')
                            ->relationship('supplier', 'name')
                            ->searchable()
                            ->required(),
                        Forms\\Components\\TextInput::make('invoice_number')
                            ->default('INV-' . strtoupper(uniqid()))
                            ->required()
                            ->unique(ignoreRecord: true),
                        Forms\\Components\\Select::make('status')
                            ->options([
                                'PENDING' => 'Pending',
                                'RECEIVED' => 'Received',
                            ])
                            ->default('RECEIVED')
                            ->required(),
                    ])->columns(3),

                Forms\\Components\\Section::make('Items Purchased')
                    ->schema([
                        Forms\\Components\\Repeater::make('items')
                            ->relationship('items')
                            ->schema([
                                Forms\\Components\\Select::make('inventory_item_id')
                                    ->relationship('inventoryItem', 'name')
                                    ->required()
                                    ->searchable()
                                    ->preload(),
                                Forms\\Components\\TextInput::make('quantity')
                                    ->numeric()
                                    ->default(1)
                                    ->minValue(1)
                                    ->required(),
                                Forms\\Components\\TextInput::make('unit_cost')
                                    ->numeric()
                                    ->prefix('₹')
                                    ->required(),
                            ])
                            ->columns(3)
                            ->createItemButtonLabel('Add Item')
                    ])
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\\Columns\\TextColumn::make('invoice_number')->searchable()->sortable(),
                Tables\\Columns\\TextColumn::make('supplier.name')->sortable(),
                Tables\\Columns\\TextColumn::make('total_amount')->money('INR')->sortable(),
                Tables\\Columns\\BadgeColumn::make('status')
                    ->colors([
                        'warning' => 'PENDING',
                        'success' => 'RECEIVED',
                    ]),
                Tables\\Columns\\TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime()
                    ->sortable(),
            ]);
    }
}
`
  },
  {
    name: '6. RBAC Model Policy',
    filename: 'PurchaseOrderPolicy.php',
    language: 'php',
    code: `<?php

namespace App\\Policies;

use App\\Models\\PurchaseOrder;
use App\\Models\\User;

class PurchaseOrderPolicy
{
    /**
     * Determine whether the user can view any purchase orders.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['ADMIN', 'MANAGER']);
    }

    /**
     * Determine whether the user can view the specific purchase order.
     */
    public function view(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return in_array($user->role, ['ADMIN', 'MANAGER']);
    }

    /**
     * Determine whether the user can create purchase orders (Procuring stock).
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['ADMIN', 'MANAGER']);
    }

    /**
     * Only Admin can delete purchase records to prevent tampering with historical stock numbers.
     */
    public function delete(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->role === 'ADMIN';
    }
}
`
  },
  {
    name: '7. Pest Unit & Feature Tests',
    filename: 'InventoryServiceTest.php',
    language: 'php',
    code: `<?php

use App\\Models\\InventoryItem;
use App\\Models\\User;
use App\\Services\\InventoryService;
use App\\Services\\RecipeProductionService;
use App\\Models\\Recipe;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->adminUser = User::factory()->create(['role' => 'ADMIN']);
    $this->actingAs($this->adminUser);

    // Create 1 Bunch product and 1 single Stem product
    $this->bunchItem = InventoryItem::create([
        'name' => 'Red Roses Bunch (10s)',
        'sku' => 'BUNCH-RED-ROSE',
        'type' => 'BUNCH',
        'stem_count_per_bunch' => 10,
        'cost_price' => 15.00,
        'retail_price' => 25.00,
        'wholesale_price' => 22.00,
    ]);

    $this->stemItem = InventoryItem::create([
        'name' => 'Red Rose Stem',
        'sku' => 'STEM-RED-ROSE',
        'type' => 'STEM',
        'cost_price' => 1.50,
        'retail_price' => 3.50,
        'wholesale_price' => 3.00,
    ]);
});

test('it correctly handles bunch to stem conversion and balances stock', function () {
    // 1. Add 5 Bunches into the ledger through a purchase
    InventoryService::logTransaction(
        itemId: $this->bunchItem->id,
        type: 'PURCHASE',
        quantity: 5,
        unitPrice: 15.00,
        notes: 'Initial Seed Buy'
    );

    expect($this->bunchItem->stock_balance)->toBe(5);
    expect($this->stemItem->stock_balance)->toBe(0);

    // 2. Convert 2 Bunches into Stems
    $service = new InventoryService();
    $service->convertBunchesToStems($this->bunchItem, $this->stemItem, 2);

    // 3. Verify bunch balance decremented by 2, leaving 3
    expect($this->bunchItem->stock_balance)->toBe(3);

    // 4. Verify STEM balance grew by 2 bunches * 10 stems = 20
    expect($this->stemItem->stock_balance)->toBe(20);
});

test('it throws an exception when converting more bunches than available', function () {
    InventoryService::logTransaction(
        itemId: $this->bunchItem->id,
        type: 'PURCHASE',
        quantity: 1,
        unitPrice: 15.00
    );

    $service = new InventoryService();
    
    // Attempt converting 2 bunches when only 1 is available
    expect(fn() => $service->convertBunchesToStems($this->bunchItem, $this->stemItem, 2))
        ->toThrow(Exception::class, 'Insufficient bunch stock to convert');
});
`
  }
];
