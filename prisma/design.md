

# Design.md — Unified Stock Schema

## Purpose

We manage mineral stock across multiple stations and states (raw → screened → sorted → production).
Originally, each state had its own ledger/transport tables, which caused duplication and schema drift.
We now use **one unified ledger table** and **one unified transport table**, with **separate process tables** for family-to-family transitions.

---

## Families (Material States)

```prisma
enum Family {
  RAW
  SCREENED
  SORTED
  PRODUCTION
}
```

### RAW

* First entry point for all material.
* Size is always `ANY` (no true granularity).
* Deposits come directly from suppliers.
* Only transitions: RAW → SCREENED (via processing).

### SCREENED

* Material after first-level processing.
* Size is meaningful (`LUMPS`, `CHIPS`, `FINE`).
* Can be transported between stations.
* Only transitions: SCREENED → SORTED (via screening).

### SORTED

* Material after fine-grain screening.
* Has extra attributes: **ht** (sieve/height) and **wastage** percentage.
* Only transitions: SORTED → PRODUCTION (via production process).

### PRODUCTION

* Final product family.
* Adds **grade** (e.g., `H1ss`, `H1s2`) for quality classification.
* Can be transported between stations.

---

## Core Tables

### StockLedger

* Append-only, universal across all families.
* Records every stock change (`qtyDelta`).
* Partitioned by `mmaCode`, tagged with `family`.
* Fields: `family`, `mmaCode`, `supplierId`, `shade`, `size`, `qtyDelta`, `reason`, `linkId`, `meta`.
* Queries:

  * **Slots:** sum of qtyDelta for an MMA.
  * **On-hand by supplier/shade/size:** group aggregates.
  * **Audit:** follow `linkId` chains back to transports/processes.

### StockTransport

* Append-only, records movements of material **within the same family**.
* Key fields: `fromMmaCode`, `toMmaCode`, `supplierId`, `shade`, `size`, `qty`, `amount`.
* Event types: `DISPATCH`, `RECEIVE`, `CANCEL`.
* Never moves across families.
* Queries:

  * Pending inbound (list of open dispatches not yet received).
  * Reconciliation (dispatch vs receive qty/amount).
  * Station dashboards (show inbound/outbound per MMA).

---

## Processes (Family Transitions)

Family changes are **never transports**. They are explicit, auditable processes.

### process_tbl (RAW → SCREENED)

* Source: one RAW slot (size = ANY).
* Targets: one or many SCREENED slots (with size).
* Records balance: total source qty = total target qty.
* Fields: `fromMmaCode`, `toMmaCode`, `sourceShade`, `sourceSize`, `sourceQtyT`, `targets` (JSON of shade/size/qty).
* Links to ledger via `linkId`.

### screening_tbl (SCREENED → SORTED)

* Source: SCREENED slot.
* Targets: SORTED slot(s).
* Adds extra attributes: `ht`, `wastage`.
* Records exact withdraw/deposit ledger rows via `withdrawLedgerId`, `depositLedgerId`.
* Fields: `fromMmaCode`, `toMmaCode`, `fromShade/Size`, `toShade/Size`, `qtyT`, `ht`, `wastage`.

### production_tbl (SORTED → PRODUCTION)

* Source: SORTED slot.
* Targets: PRODUCTION slot(s).
* Adds attribute: `grade`.
* Same ledger linkage for audit.
* Fields: `fromMmaCode`, `toMmaCode`, `fromShade/Size`, `toGrade`, `qtyT`, `grade`.

---

## Why This Structure Works

1. **Unification**

   * One ledger, one transport → no schema drift, simpler maintenance.
   * Families handled via enum, not separate tables.

2. **Partitioning**

   * `mmaCode` is the real identity key for stock buckets.
   * Unlimited MMAs, no schema changes required.

3. **Transport Clarity**

   * Only same-family moves in `StockTransport`.
   * Cross-family transitions are processes, not hidden in transport.

4. **Process Transparency**

   * Each transition family has its own process table.
   * Extra attributes (ht, wastage, grade) live only where they are relevant.
   * Prevents “schema pollution” in the core ledger.

5. **Auditable**

   * Every `qtyDelta` is linked to a transport or process.
   * Dispatch/Receive reconciliation ensures no phantom stock.
   * Process tables enforce input-output balance.

---

## Intended Use

* **Daily Ops**: deposit raw, transport screened/sorted/production stock, receive inbound, cancel transports if needed.
* **Stations**: show slots (ledger), inbound/outbound (transport), run receive/dispatch forms.
* **Processes**: record when material is processed, screened, or turned into product, with full audit trail.
* **Reporting**:

  * Family-level stock positions (RAW vs SCREENED vs SORTED vs PRODUCTION).
  * Supplier-based summaries.
  * Yield analysis: wastage, grade distribution, process success/failure.

---

✅ This design keeps the schema compact, expressive, and auditable, while making clear distinctions:

* **Ledger = universal truth**
* **Transport = movement within family**
* **Processes = transitions between families**

---

Do you want me to also expand this doc with a **diagram (ERD text sketch)** so you can visualize the links between Supplier, Ledger, Transport, and Processes?
