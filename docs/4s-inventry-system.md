
# 📊 4S Inventory System

## The Talc 4S Inventory Model

---

## 🔷 Overview

The Talc Inventory System is built on what we call the **4S Model**.

Every unit of stock (Slot) in the business is uniquely defined using four business dimensions:

> **Station/MMA + Supplier + Shade + Size**

These four dimensions together define a single measurable stock bucket called a **Slot**.

All stock movements operate strictly within this structure.
No stock exists outside the 4S framework.

---

## 🧩 The Four Dimensions

### 1️⃣ Station / MMA

Defines **where** the material exists within the operational process.

Each MMA represents a distinct processing or storage stage inside a Station.

Example:

Material in `ABS_RAW` is operationally different from material in `ABS_SCREENED`, even if Supplier, Shade, and Size are identical.

An MMA therefore represents a **business state** of material, not just a physical location.

---

### 2️⃣ Supplier

Defines **ownership or source** of the material.

Material from different suppliers is always tracked separately.

> Ownership inside a Slot is never mixed prior to processing.
> After processing is completed, the resulting stock becomes company-owned inventory.

This rule ensures clear accountability and clean supplier reconciliation.

---

### 3️⃣ Shade

Defines the **quality classification or product grade** of the material.

Different shades are never mixed in stock calculation or reporting.

Shade separation protects quality integrity across the system.

---

### 4️⃣ Size

Defines the **physical granularity or form** of the material
(e.g., lumps, chips, fine, mixed).

In early processing stages, size may default to a general category such as `"mixed"` when granularity is not yet separated.

---

## 🏗 Structure of an MMA

An MMA is a **group of Slots**.

Within a single MMA:

* Multiple Suppliers may exist
* Each Supplier may have multiple Shades
* Each Shade may have multiple Sizes

Each unique combination forms a separate Slot with its own independent stock balance.

Structurally:

```
MMA
 ├── Supplier A
 │    ├── Shade X
 │    │    ├── Size 1
 │    │    └── Size 2
 │    └── Shade Y
 │         └── Size 1
 ├── Supplier B
 │    ├── Shade X
 │    │    └── Size 1
 │    └── Shade Y
 └── Supplier C
      └── Shade X
           └── Size 1
```

Each leaf node in this structure represents a Slot.

Stock is always calculated at this lowest level.

---

## 🔄 Ownership Transition Rule

The 4S system strictly separates ownership during pre-processing stages.

Before processing:

* Stock remains supplier-specific.
* Slots remain separated by Supplier.

After processing:

* Output stock becomes company-owned.
* Supplier separation no longer applies unless explicitly required.

This transition reflects the real business flow from raw material intake to finished product inventory.

---

## 🎯 Why the 4S Model Matters

The 4S structure guarantees:

* Clear separation of ownership
* Clear separation of quality
* No unintended mixing of material
* Full traceability
* Transparent supplier accountability
* Clean, auditable stock reporting

Stock is never recorded loosely.

Every increase or decrease applies to one clearly defined Slot within the 4S structure.

