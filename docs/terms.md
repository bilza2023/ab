


## Business Terminology of the Talc Inventory System

---

## 🏭 Station

A **Station** is a physical operational site in the business.

Examples include processing plants or storage yards such as:

* ABS
* PSS
* KEF

A Station represents a real-world location where material is:

* Received
* Processed
* Stored
* Dispatched

A Station is a physical business unit.

---

## 🧱 MMA (Material Movement Area)

An **MMA** is a defined stock area within a Station.

It represents a specific operational condition or processing stage of material.

Examples:

* `ABS_RAW`
* `ABS_SCREENED`
* `PSS_SORTED`

Material in one MMA is considered **operationally different** from material in another MMA — even if Supplier, Shade, and Size are the same.

Important:

An MMA is **not a single pile of material**.
An MMA is a **structured stock bucket** that contains multiple measurable stock units.

---

## 📦 Slot

A **Slot** is the smallest measurable stock unit in the system.

A Slot is defined by the 4S combination:

> **Station/MMA + Supplier + Shade + Size**

This combination uniquely identifies one specific pile of material.

Stock balance is always calculated at the **Slot level**.

If any one of the four elements changes, it becomes a different Slot.

---

## 🚚 Transport Reference

A **Transport Reference** is a unique business identifier for a shipment.

It links:

* The source MMA
* The destination MMA
* The quantity moved

It ensures that Dispatch and Receive actions are tied together under one traceable shipment record.

---

