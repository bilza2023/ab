
# 📘 Talc Engine

## Business Introduction to the Append-Only Inventory Core

---

## 🔷 Core Principle — Append-Only Ledger

The Talc Engine is built on an **Append-Only Ledger** principle.

This means:

* No stock record is ever edited
* No movement is deleted
* No history is overwritten

Every business action creates a new ledger entry.

If a mistake occurs, it is corrected through a new reversing entry — not by changing the past.

This guarantees:

* Complete traceability
* Transparent audit history
* Strong stock integrity
* Business accountability

The system behaves like financial accounting — but for material movement.

---

# ⚙️ The Five Business Verbs

The engine recognizes five operational actions.  Everything else in the system is derived from these.

---

## 1️⃣ Deposit

**Material enters an MMA**

Business Meaning:
Stock increases in a defined Slot.

### Required Business Data

| Field        | Meaning                            |
| ------------ | ---------------------------------- |
| `toMmaCode`  | The destination operational stage  |
| `supplierId` | Owner of the material              |
| `shade`      | Quality classification             |
| `size`       | Physical form (may default)        |
| `qty`        | Quantity being added               |
| `reason`     | Business reason (default: DEPOSIT) |
| `timestamp`  | Date and time of entry             |

Business Effect:
Creates a positive stock entry in one Slot.

---

## 2️⃣ Withdraw

**Material is consumed or processed**

Business Meaning:
Stock decreases from a defined Slot.

### Required Business Data

| Field         | Meaning                             |
| ------------- | ----------------------------------- |
| `fromMmaCode` | Source operational stage            |
| `supplierId`  | Owner (if pre-processing stage)     |
| `shade`       | Quality classification              |
| `size`        | Physical form                       |
| `qty`         | Quantity being removed              |
| `reason`      | Business reason (default: WITHDRAW) |
| `timestamp`   | Date and time                       |

Business Effect:
Creates a negative stock entry.

System Guard:
Cannot withdraw more than available stock.

---

## 3️⃣ Dispatch

**Material is sent from one MMA to another**

Business Meaning:
Stock decreases at source and is marked “in transit”.

### Required Business Data

| Field         | Meaning                   |
| ------------- | ------------------------- |
| `transportId` | Unique shipment reference |
| `fromMmaCode` | Source MMA                |
| `toMmaCode`   | Destination MMA           |
| `supplierId`  | Owner                     |
| `shade`       | Quality                   |
| `size`        | Physical form             |
| `qty`         | Quantity shipped          |
| `timestamp`   | Date and time             |

Business Effect:

* Negative entry at source
* Shipment record created

Stock is now “in transit”.

---

## 4️⃣ Receive

**Material arrives at destination**

Business Meaning:
Shipment is completed and stock increases at the destination MMA.

### Required Business Data

| Field         | Meaning                  |
| ------------- | ------------------------ |
| `transportId` | Shipment reference       |
| `timestamp`   | Date and time of arrival |

Business Effect:

* Positive entry at destination
* Shipment closed

System Guarantee:
Cannot receive twice (idempotent protection).

---

## 5️⃣ Cancel

**Shipment is reversed before arrival**

Business Meaning:
If a dispatched shipment does not complete, it is formally canceled.

### Required Business Data

| Field         | Meaning                       |
| ------------- | ----------------------------- |
| `transportId` | Shipment reference            |
| `timestamp`   | Date and time of cancellation |

Business Effect:

* Shipment marked canceled
* Stock is restored to source MMA

This maintains integrity without deleting history.

---

# 📊 What the Engine Records

For every movement, the engine records:

* Station / MMA
* Supplier
* Shade
* Size
* Quantity (positive or negative)
* Timestamp
* Business reason
* Transport reference (if applicable)

Every ton of material is traceable to a specific Slot within the 4S system.

Nothing moves anonymously.

---

# 🔒 Why This Matters to the Business

Because the system is Append-Only:

* Historical records cannot be manipulated
* Inventory can always be reconstructed
* Disputes can be resolved with data
* Supplier reconciliation is clean
* Processing losses are visible
* Movement is accountable

The engine does not manage money.
It does not manage customers.
It does not handle accounting entries.

It performs one function with precision:

> Controlled, auditable movement of material across defined operational stages.
